/**
 * Proxy media.
 *
 * Editing a 4K 800 MB clip in a browser is miserable: seeking is slow, the
 * first frame takes seconds, and every scrub re-buffers. The standard fix in
 * every NLE is to edit against a small stand-in and conform back to the
 * original at export time.
 *
 * A proxy here is a ~540p, short-GOP, faststart H.264 file in media/proxies/.
 * The studio previews it; the renderer never touches it. Proxies are derived
 * data — ignored by Git, rebuildable at any time with `npm run proxy`.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { PROXIES_DIR, toRepoPath, resolveRepoPath } from '../../core/paths.js';
import { runFFmpeg, probe } from './ffmpeg.js';

export const PROXY_HEIGHT = 540;

/** Short fingerprint of a source file: changes whenever the bytes change. */
export function sourceSig(abs) {
  const st = fs.statSync(abs);
  return crypto.createHash('md5').update(`${st.mtimeMs}:${st.size}`).digest('hex').slice(0, 8);
}

function slug(name) {
  return path.basename(name, path.extname(name)).replace(/[^a-zA-Z0-9._-]+/g, '-').slice(0, 60);
}

/**
 * Where the proxy for a source file lives. The signature is in the filename,
 * so re-encoding a source invalidates its proxy automatically instead of
 * silently previewing stale footage.
 */
export function proxyPathFor(relOrAbs) {
  const abs = path.isAbsolute(relOrAbs) ? relOrAbs : resolveRepoPath(relOrAbs);
  if (!fs.existsSync(abs)) return null;
  return path.join(PROXIES_DIR, `${slug(abs)}.${sourceSig(abs)}.mp4`);
}

/** The repo path of an existing, current proxy — or null. */
export function findProxy(rel) {
  try {
    const p = proxyPathFor(rel);
    return p && fs.existsSync(p) ? toRepoPath(p) : null;
  } catch {
    return null;
  }
}

/** Is a proxy worth building? Small or already-small files don't need one. */
export async function proxyWorthwhile(abs, info = null) {
  const st = fs.statSync(abs);
  if (st.size < 40 * 1024 * 1024) return false;
  const meta = info || await probe(abs).catch(() => null);
  if (!meta) return false;
  return Math.min(meta.width || 0, meta.height || 0) > PROXY_HEIGHT * 1.2;
}

/**
 * Build a proxy. Resolution-agnostic: scales the *shorter* side to 540 so a
 * vertical 1080x1920 clip becomes 540x960, and a 4K landscape becomes 960x540.
 */
export async function buildProxy(rel, { height = PROXY_HEIGHT, onProgress, force = false } = {}) {
  const abs = path.isAbsolute(rel) ? rel : resolveRepoPath(rel);
  if (!fs.existsSync(abs)) throw new Error(`no such file: ${rel}`);
  const out = proxyPathFor(abs);
  if (!force && fs.existsSync(out)) {
    return { path: toRepoPath(out), bytes: fs.statSync(out).size, cached: true };
  }
  fs.mkdirSync(PROXIES_DIR, { recursive: true });

  const info = await probe(abs).catch(() => null);
  const vertical = info && info.height > info.width;
  // Scale the short edge; -2 keeps the other edge even for H.264.
  const scale = vertical ? `scale=${height}:-2` : `scale=-2:${height}`;

  const args = [
    '-y', '-i', abs,
    '-vf', `${scale},format=yuv420p`,
    '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '28',
    // Half-second GOP: the studio seeks constantly and long GOPs make that crawl.
    '-g', '15', '-keyint_min', '15', '-sc_threshold', '0',
    '-c:a', 'aac', '-b:a', '96k', '-ac', '2', '-ar', '48000',
    '-movflags', '+faststart',
    '-progress', 'pipe:1', '-nostats',
    out,
  ];
  if (!info?.hasAudio) args.splice(args.indexOf('-c:a'), 8, '-an');

  const total = info?.duration || 0;
  await runFFmpeg(args, {
    onProgress: onProgress
      ? ({ seconds, speed }) => onProgress({
        seconds,
        speed,
        fraction: total ? Math.min(1, seconds / total) : 0,
      })
      : undefined,
  });

  return { path: toRepoPath(out), bytes: fs.statSync(out).size, cached: false };
}

/** Delete proxies whose source is gone or has changed. Returns what it removed. */
export function pruneProxies(sources) {
  if (!fs.existsSync(PROXIES_DIR)) return [];
  const live = new Set();
  for (const rel of sources) {
    try {
      const p = proxyPathFor(rel);
      if (p) live.add(path.basename(p));
    } catch { /* source vanished mid-scan */ }
  }
  const removed = [];
  for (const f of fs.readdirSync(PROXIES_DIR)) {
    if (!f.endsWith('.mp4') || live.has(f)) continue;
    const abs = path.join(PROXIES_DIR, f);
    removed.push({ name: f, bytes: fs.statSync(abs).size });
    fs.unlinkSync(abs);
  }
  return removed;
}
