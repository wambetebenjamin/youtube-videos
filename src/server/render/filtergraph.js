/**
 * Project → FFmpeg command line.
 *
 * Design notes:
 *  - Layers are rasterised to full-canvas transparent PNGs first, then
 *    composited with `overlay`. Positioning therefore comes from the SVG
 *    (identical to the preview) and FFmpeg only handles time and motion.
 *  - Opacity ramps use the `fade` filter (linear) and movement uses eased
 *    overlay x/y expressions generated from the same easing table the
 *    browser uses.
 *  - Crop/scale offsets are precomputed as integers from ffprobe data
 *    rather than left as FFmpeg expressions: fewer surprises, no quoting
 *    headaches.
 */
import { easeExpr } from '../../core/easing.js';
import { animSpec, layerTimes } from '../../core/timeline.js';

const even = (v) => Math.max(2, Math.round(v / 2) * 2);
const r2 = (v) => Math.round(v * 1000) / 1000;

function clampProgressExpr(start, dur) {
  return `min(1,max(0,(t-${r2(start)})/${r2(dur)}))`;
}
function clampProgressExprOut(end, dur) {
  return `min(1,max(0,(${r2(end)}-t)/${r2(dur)}))`;
}

/** Geometry for fitting the source into the canvas. */
export function fitGeometry(source, canvas, srcW, srcH) {
  const W = canvas.width;
  const H = canvas.height;
  if (!srcW || !srcH) return { mode: 'none', scaleW: W, scaleH: H };

  const zoom = Math.max(0.1, source.zoom || 1);
  const offX = (source.offsetX || 0) * W;
  const offY = (source.offsetY || 0) * H;

  if (source.fit === 'contain') {
    const factor = Math.min(W / srcW, H / srcH) * zoom;
    const sw = even(srcW * factor);
    const sh = even(srcH * factor);
    return {
      mode: 'contain',
      scaleW: sw,
      scaleH: sh,
      x: Math.round((W - sw) / 2 + offX),
      y: Math.round((H - sh) / 2 + offY),
      backdrop: source.backdrop || 'blur',
    };
  }

  // cover (default)
  const factor = Math.max(W / srcW, H / srcH) * zoom;
  const sw = even(srcW * factor);
  const sh = even(srcH * factor);
  const cropX = Math.min(Math.max(0, Math.round((sw - W) / 2 + offX)), Math.max(0, sw - W));
  const cropY = Math.min(Math.max(0, Math.round((sh - H) / 2 + offY)), Math.max(0, sh - H));
  return { mode: 'cover', scaleW: sw, scaleH: sh, cropX, cropY };
}

/**
 * @param {object} o
 * @param {object} o.project      normalised project
 * @param {object} o.canvas       {width,height,fps,background}
 * @param {number} o.duration     output duration in seconds
 * @param {object} o.sourceInfo   ffprobe result for the clip (or null)
 * @param {Array}  o.assets       [{ file, layer, kind, role }] rasterised PNGs
 * @param {object} o.preset       export preset
 * @param {string} o.output       output path
 * @param {Map}    o.musicInfo    src -> ffprobe
 */
export function buildFFmpegArgs({ project, canvas, duration, sourceInfo, assets, preset, output, musicPaths }) {
  const args = ['-y'];
  const filters = [];
  const src = project.source || {};
  const speed = Math.max(0.1, Math.min(10, src.speed || 1));

  /* ---------------- inputs ---------------- */
  let inputIndex = 0;
  const clipIndex = inputIndex;

  if (sourceInfo?.path) {
    const start = Math.max(0, src.trim?.start || 0);
    const len = duration * speed;
    if (start > 0) args.push('-ss', String(r2(start)));
    args.push('-t', String(r2(len)), '-i', sourceInfo.path);
  } else {
    args.push('-f', 'lavfi', '-t', String(r2(duration)),
      '-i', `color=c=${(canvas.background || '#000000').replace('#', '0x')}:s=${canvas.width}x${canvas.height}:r=${canvas.fps}`);
  }
  inputIndex++;

  const musicInputs = [];
  for (const m of musicPaths || []) {
    if (m.track.loop) args.push('-stream_loop', '-1');
    args.push('-i', m.path);
    musicInputs.push({ index: inputIndex++, ...m });
  }

  const assetInputs = [];
  for (const a of assets || []) {
    args.push('-loop', '1', '-framerate', String(canvas.fps), '-i', a.file);
    assetInputs.push({ index: inputIndex++, ...a });
  }

  /* ---------------- video base ---------------- */
  let vLabel = 'base';
  const baseChain = [];

  if (sourceInfo?.path) {
    if (speed !== 1) baseChain.push(`setpts=PTS/${r2(speed)}`);
    const geo = fitGeometry(src, canvas, sourceInfo.width, sourceInfo.height);
    if (geo.mode === 'contain') {
      const bg = geo.backdrop;
      const pre = baseChain.length ? `[${clipIndex}:v]${baseChain.join(',')}[pre]` : null;
      const preLabel = pre ? 'pre' : `${clipIndex}:v`;
      if (pre) filters.push(pre);

      if (bg === 'blur') {
        const cover = fitGeometry({ ...src, fit: 'cover', zoom: 1, offsetX: 0, offsetY: 0 }, canvas, sourceInfo.width, sourceInfo.height);
        filters.push(`[${preLabel}]split=2[bgsrc][fgsrc]`);
        filters.push(
          `[bgsrc]scale=${cover.scaleW}:${cover.scaleH},crop=${canvas.width}:${canvas.height}:${cover.cropX}:${cover.cropY},` +
          `gblur=sigma=${Math.round(canvas.width / 24)},eq=brightness=-0.12:saturation=0.9[bgblur]`,
        );
        filters.push(`[fgsrc]scale=${geo.scaleW}:${geo.scaleH}[fgs]`);
        filters.push(`[bgblur][fgs]overlay=${geo.x}:${geo.y}[fitted]`);
      } else {
        const color = (src.backdropColor || canvas.background || '#000000').replace('#', '0x');
        filters.push(
          `[${preLabel}]scale=${geo.scaleW}:${geo.scaleH},` +
          `pad=${canvas.width}:${canvas.height}:${geo.x}:${geo.y}:color=${color}[fitted]`,
        );
      }
      filters.push(`[fitted]${postChain(src, canvas).join(',')}[${vLabel}]`);
    } else {
      const chain = [
        ...baseChain,
        `scale=${geo.scaleW}:${geo.scaleH}`,
        `crop=${canvas.width}:${canvas.height}:${geo.cropX}:${geo.cropY}`,
        ...postChain(src, canvas),
      ];
      filters.push(`[${clipIndex}:v]${chain.join(',')}[${vLabel}]`);
    }
  } else {
    filters.push(`[${clipIndex}:v]${postChain(src, canvas).join(',')}[${vLabel}]`);
  }

  /* ---------------- overlays ---------------- */
  let step = 0;
  for (const asset of assetInputs) {
    const layer = asset.layer;
    const { start, end } = layerTimes(layer, duration);
    const inA = animSpec(layer.animIn);
    const outA = animSpec(layer.animOut);
    const span = Math.max(0.0001, end - start);
    const inDur = Math.min(inA.duration, span / 2);
    const outDur = Math.min(outA.duration, span / 2);

    const ovIn = `ov${step}`;
    const chain = ['format=rgba'];

    if (asset.role !== 'progress-bar') {
      if (inA.fade && inA.type !== 'none' && inDur > 0.001) {
        chain.push(`fade=t=in:st=${r2(start)}:d=${r2(inDur)}:alpha=1`);
      }
      if (outA.fade && outA.type !== 'none' && outDur > 0.001) {
        chain.push(`fade=t=out:st=${r2(end - outDur)}:d=${r2(outDur)}:alpha=1`);
      }
    }
    filters.push(`[${asset.index}:v]${chain.join(',')}[${ovIn}]`);

    let xExpr = '0';
    let yExpr = '0';

    if (asset.role === 'progress-bar') {
      // A solid bar slid in from the left reads as a bar filling up.
      xExpr = `'-${canvas.width}+${canvas.width}*min(1,max(0,(t-${r2(start)})/${r2(Math.max(0.001, end - start))}))'`;
    } else {
      const terms = { x: [], y: [] };
      if (inDur > 0.001 && (inA.dx || inA.dy)) {
        const p = clampProgressExpr(start, inDur);
        const e = easeExpr(inA.easing, p);
        const dist = inA.distance * canvas.height;
        if (inA.dx) terms.x.push(`${r2(inA.dx * dist)}*(1-${e})`);
        if (inA.dy) terms.y.push(`${r2(inA.dy * dist)}*(1-${e})`);
      }
      if (outDur > 0.001 && (outA.dx || outA.dy)) {
        const p = clampProgressExprOut(end, outDur);
        const e = easeExpr(outA.easing, p);
        const dist = outA.distance * canvas.height;
        if (outA.dx) terms.x.push(`${r2(-outA.dx * dist)}*(1-${e})`);
        if (outA.dy) terms.y.push(`${r2(-outA.dy * dist)}*(1-${e})`);
      }
      if (terms.x.length) xExpr = `'${terms.x.join('+')}'`;
      if (terms.y.length) yExpr = `'${terms.y.join('+')}'`;
    }

    const next = `v${step}`;
    const enable = (start > 0 || end < duration - 0.001)
      ? `:enable='between(t,${r2(start)},${r2(end)})'`
      : '';
    filters.push(`[${vLabel}][${ovIn}]overlay=x=${xExpr}:y=${yExpr}:format=auto${enable}[${next}]`);
    vLabel = next;
    step++;
  }

  // Draft renders go out at a lower resolution.
  const outScale = preset?.scale && preset.scale !== 1 ? preset.scale : 1;
  if (outScale !== 1) {
    const w = even(canvas.width * outScale);
    const h = even(canvas.height * outScale);
    filters.push(`[${vLabel}]scale=${w}:${h}[vscaled]`);
    vLabel = 'vscaled';
  }

  filters.push(`[${vLabel}]fps=${preset?.fps || canvas.fps},format=yuv420p,setsar=1[vout]`);

  /* ---------------- audio ---------------- */
  const audioLabels = [];
  const A_FMT = 'aformat=sample_fmts=fltp:sample_rates=48000:channel_layouts=stereo';
  const hasClipAudio = !!(sourceInfo?.hasAudio && (src.volume ?? 1) > 0 && !src.mute);
  const wantsDuck = (project.audio?.music || []).some((m) => m.enabled !== false && m.duck && m.src);

  if (hasClipAudio) {
    const chain = [A_FMT];
    if (speed !== 1) for (const f of atempoChain(speed)) chain.push(f);
    chain.push(`volume=${r2(src.volume ?? 1)}`);
    chain.push(`atrim=0:${r2(duration)}`, 'asetpts=PTS-STARTPTS');
    filters.push(`[${clipIndex}:a]${chain.join(',')}[a0]`);
    if (wantsDuck) {
      filters.push('[a0]asplit=2[a0main][a0key]');
      audioLabels.push('a0main');
    } else {
      audioLabels.push('a0');
    }
  }

  let keyUsed = false;
  musicInputs.forEach((m, i) => {
    const t = m.track;
    const startAt = Math.max(0, t.start || 0);
    const available = Math.max(0.1, duration - startAt);
    const offset = Math.max(0, t.offset || 0);
    const fadeIn = Math.max(0, t.fadeIn || 0);
    const fadeOut = Math.max(0, Math.min(t.fadeOut || 0, available));

    const chain = [A_FMT];
    chain.push(`atrim=start=${r2(offset)}:end=${r2(offset + available)}`, 'asetpts=PTS-STARTPTS');
    chain.push(`volume=${r2(t.volume ?? 0.35)}`);
    if (fadeIn > 0) chain.push(`afade=t=in:st=0:d=${r2(fadeIn)}`);
    if (fadeOut > 0) chain.push(`afade=t=out:st=${r2(available - fadeOut)}:d=${r2(fadeOut)}`);
    if (startAt > 0) chain.push(`adelay=${Math.round(startAt * 1000)}|${Math.round(startAt * 1000)}`);

    const label = `m${i}`;
    filters.push(`[${m.index}:a]${chain.join(',')}[${label}]`);

    if (t.duck && hasClipAudio && !keyUsed) {
      filters.push(
        `[${label}][a0key]sidechaincompress=threshold=0.03:ratio=12:attack=20:release=350:makeup=1[${label}d]`,
      );
      audioLabels.push(`${label}d`);
      keyUsed = true;
    } else {
      audioLabels.push(label);
    }
  });

  let hasAudio = audioLabels.length > 0;
  if (audioLabels.length === 1) {
    filters.push(`[${audioLabels[0]}]atrim=0:${r2(duration)},asetpts=PTS-STARTPTS[aout]`);
  } else if (audioLabels.length > 1) {
    // This FFmpeg build has no amix `normalize` option: it always divides by
    // the input count, so multiply the gain back and catch peaks with a limiter.
    filters.push(
      `${audioLabels.map((l) => `[${l}]`).join('')}amix=inputs=${audioLabels.length}:duration=longest:dropout_transition=0,` +
      `volume=${audioLabels.length},alimiter=limit=0.95,atrim=0:${r2(duration)},asetpts=PTS-STARTPTS[aout]`,
    );
  }

  /* ---------------- output ---------------- */
  args.push('-filter_complex', filters.join(';'));
  args.push('-map', '[vout]');
  if (hasAudio) args.push('-map', '[aout]');

  args.push('-t', String(r2(duration)));
  args.push('-c:v', preset?.videoCodec || 'libx264');
  args.push('-preset', preset?.speed || 'medium');
  args.push('-crf', String(preset?.crf ?? 20));
  args.push('-pix_fmt', 'yuv420p');
  args.push('-profile:v', preset?.profile || 'high');
  args.push('-g', String(Math.round((preset?.fps || canvas.fps) * 2)));
  args.push('-movflags', '+faststart');

  if (hasAudio) {
    args.push('-c:a', 'aac', '-b:a', preset?.audioBitrate || '192k', '-ar', '48000', '-ac', '2');
  } else {
    args.push('-an');
  }

  args.push('-progress', 'pipe:1', '-nostats');
  args.push(output);
  return args;
}

function postChain(src, canvas) {
  const chain = [];
  const adj = src.adjust || {};
  const parts = [];
  if (adj.brightness) parts.push(`brightness=${r2(adj.brightness)}`);
  if (adj.contrast && adj.contrast !== 1) parts.push(`contrast=${r2(adj.contrast)}`);
  if (adj.saturation && adj.saturation !== 1) parts.push(`saturation=${r2(adj.saturation)}`);
  if (parts.length) chain.push(`eq=${parts.join(':')}`);
  if (adj.vignette) chain.push('vignette=PI/5');
  if (adj.sharpen) chain.push('unsharp=5:5:0.8:3:3:0.4');
  chain.push(`fps=${canvas.fps}`, 'setsar=1');
  return chain;
}

/** atempo only accepts 0.5–2.0 per instance, so chain them. */
function atempoChain(speed) {
  const out = [];
  let remaining = speed;
  while (remaining > 2) { out.push('atempo=2.0'); remaining /= 2; }
  while (remaining < 0.5) { out.push('atempo=0.5'); remaining /= 0.5; }
  if (Math.abs(remaining - 1) > 0.001) out.push(`atempo=${r2(remaining)}`);
  return out;
}
