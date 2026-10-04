import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { EXPORTS_DIR, CACHE_DIR, resolveRepoPath, toRepoPath } from '../../core/paths.js';
import { canvasOf } from '../../core/formats.js';
import { normalizeProject, resolveDuration } from '../../core/project.js';
import { layerTimes } from '../../core/timeline.js';
import { compositeSvg } from '../../core/svg.js';
import { makeRenderContext, svgToPng, rasterizeLayer } from './rasterize.js';
import { buildFFmpegArgs } from './filtergraph.js';
import { probe, runFFmpeg, thumbnail } from '../lib/ffmpeg.js';
import { getExportPreset } from '../lib/presets.js';

const slug = (s) => String(s || 'export').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 60);

/**
 * Render a project to an MP4.
 *
 * Static full-length layers are flattened into one PNG before compositing —
 * a ten-layer design usually collapses to two or three overlay passes.
 */
export async function renderProject(rawProject, opts = {}) {
  const project = normalizeProject(rawProject);
  const canvas = canvasOf(project);
  const preset = getExportPreset(opts.preset || project.export?.preset);
  const jobId = opts.jobId || randomUUID().slice(0, 8);
  const workDir = path.join(CACHE_DIR, 'render', jobId);
  fs.mkdirSync(workDir, { recursive: true });
  fs.mkdirSync(EXPORTS_DIR, { recursive: true });

  const log = (msg) => opts.onLog?.(msg);

  /* ---- source ---- */
  let sourceInfo = null;
  if (project.source?.clip) {
    const abs = resolveRepoPath(project.source.clip);
    if (!abs || !fs.existsSync(abs)) throw new Error(`clip not found: ${project.source.clip}`);
    sourceInfo = { ...(await probe(abs)), path: abs };
    if (!sourceInfo.hasVideo) throw new Error(`not a video file: ${project.source.clip}`);
  }

  const duration = Math.max(0.2, opts.duration || resolveDuration(project, sourceInfo?.duration || 0));
  log(`canvas ${canvas.width}x${canvas.height} @${canvas.fps}fps · ${duration.toFixed(2)}s · preset ${preset.id}`);

  /* ---- layers → PNGs ---- */
  const ctx = makeRenderContext(canvas);
  const assets = [];
  const active = (project.layers || []).filter((l) => {
    if (l.enabled === false) return false;
    const { start, end } = layerTimes(l, duration);
    return end > 0.001 && start < duration - 0.001;
  });

  const isStatic = (l) =>
    l.type !== 'progress' &&
    (l.start ?? 0) <= 0.001 &&
    (!l.end || l.end >= duration - 0.001) &&
    (l.animIn?.type ?? 'fade') === 'none' &&
    (l.animOut?.type ?? 'fade') === 'none';

  const staticLayers = active.filter(isStatic);
  const dynamicLayers = active.filter((l) => !isStatic(l));

  if (staticLayers.length) {
    const svg = compositeSvg({ layers: staticLayers }, 0, ctx, duration);
    const file = path.join(workDir, 'static.png');
    fs.writeFileSync(file, svgToPng(svg, ctx));
    assets.push({ file, layer: { id: 'static', start: 0, end: duration, animIn: { type: 'none' }, animOut: { type: 'none' } }, role: 'static' });
    log(`flattened ${staticLayers.length} static layer(s)`);
  }

  for (const [i, layer] of dynamicLayers.entries()) {
    if (layer.type === 'progress') {
      const p = layer.progress || {};
      if (p.trackColor) {
        const trackLayer = { ...layer, progress: { ...p, color: p.trackColor, opacity: p.trackOpacity ?? 0.25, trackColor: null } };
        const f = path.join(workDir, `layer-${i}-track.png`);
        rasterizeLayer(trackLayer, ctx, f, { progress: 1 });
        assets.push({ file: f, layer: { ...layer, animIn: { type: 'none' }, animOut: { type: 'none' } }, role: 'progress-track' });
      }
      const barLayer = { ...layer, progress: { ...p, trackColor: null } };
      const f = path.join(workDir, `layer-${i}-bar.png`);
      rasterizeLayer(barLayer, ctx, f, { progress: 1 });
      assets.push({ file: f, layer, role: 'progress-bar' });
      continue;
    }
    const file = path.join(workDir, `layer-${i}.png`);
    rasterizeLayer(layer, ctx, file);
    assets.push({ file, layer, role: 'layer' });
  }
  log(`rasterised ${assets.length} overlay pass(es)`);

  /* ---- music ---- */
  const musicPaths = [];
  for (const track of project.audio?.music || []) {
    if (track.enabled === false || !track.src) continue;
    const abs = resolveRepoPath(track.src);
    if (!abs || !fs.existsSync(abs)) {
      log(`! music missing, skipped: ${track.src}`);
      continue;
    }
    musicPaths.push({ path: abs, track });
  }

  /* ---- output name ---- */
  const stamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 13);
  const suffix = project.export?.suffix ? `-${slug(project.export.suffix)}` : '';
  const name = opts.outName || `${slug(project.name || project.id)}-${canvas.formatId}${suffix}-${stamp}${preset.id === 'draft' ? '-draft' : ''}.mp4`;
  const outPath = path.join(EXPORTS_DIR, name);

  const args = buildFFmpegArgs({ project, canvas, duration, sourceInfo, assets, preset, output: outPath, musicPaths });
  fs.writeFileSync(path.join(workDir, 'ffmpeg-args.json'), JSON.stringify(args, null, 2));

  await runFFmpeg(args, {
    onProgress: (p) => opts.onProgress?.({ ...p, duration, percent: Math.min(100, (p.seconds / duration) * 100) }),
    onLog: (s) => opts.onLogRaw?.(s),
    signal: opts.signal,
  });

  /* ---- poster + sidecar ---- */
  let poster = null;
  try {
    poster = outPath.replace(/\.mp4$/, '.jpg');
    await thumbnail(outPath, poster, { at: Math.min(1, duration / 3), width: 540 });
  } catch { poster = null; }

  const sidecar = `${outPath}.json`;
  fs.writeFileSync(sidecar, JSON.stringify({
    renderedAt: new Date().toISOString(),
    jobId,
    preset: preset.id,
    duration,
    canvas,
    project,
  }, null, 2));

  const stat = fs.statSync(outPath);
  if (!opts.keepWork) fs.rmSync(workDir, { recursive: true, force: true });

  return {
    jobId,
    file: toRepoPath(outPath),
    name,
    bytes: stat.size,
    duration,
    poster: poster ? toRepoPath(poster) : null,
    sidecar: toRepoPath(sidecar),
    preset: preset.id,
  };
}
