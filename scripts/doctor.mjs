#!/usr/bin/env node
/** Checks the toolchain and tells you exactly what to run if something's missing. */
import fs from 'node:fs';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { ROOT, FONTS_DIR, SOURCE_DIR, MUSIC_DIR, EXPORTS_DIR, PROJECTS_DIR } from '../src/core/paths.js';
import { c } from './lib/cli.mjs';

const execFileAsync = promisify(execFile);
const rows = [];
const add = (ok, label, detail, fix) => rows.push({ ok, label, detail, fix });

/* node */
const major = Number(process.versions.node.split('.')[0]);
add(major >= 20, 'Node', process.version, 'needs Node 20 or newer');

/* ffmpeg + ffprobe */
try {
  const { FFMPEG, FFPROBE } = await import('../src/server/lib/ffmpeg.js');
  const { stdout } = await execFileAsync(FFMPEG, ['-hide_banner', '-version']);
  add(true, 'FFmpeg', stdout.split('\n')[0].replace('ffmpeg version ', '').slice(0, 48));
  const { stdout: p } = await execFileAsync(FFPROBE, ['-hide_banner', '-version']);
  add(true, 'ffprobe', p.split('\n')[0].replace('ffprobe version ', '').slice(0, 48));

  const { stdout: filters } = await execFileAsync(FFMPEG, ['-hide_banner', '-filters']);
  const need = ['overlay', 'fade', 'amix', 'afade', 'adelay', 'sidechaincompress', 'gblur', 'eq', 'alimiter'];
  const missing = need.filter((f) => !new RegExp(`\\b${f}\\b`).test(filters));
  add(!missing.length, 'Filters', missing.length ? `missing: ${missing.join(', ')}` : `${need.length} required filters present`);
} catch (err) {
  add(false, 'FFmpeg', err.message, 'npm install');
}

/* resvg */
try {
  const { Resvg } = await import('@resvg/resvg-js');
  const png = new Resvg('<svg xmlns="http://www.w3.org/2000/svg" width="4" height="4"><rect width="4" height="4" fill="#fff"/></svg>').render().asPng();
  add(png.length > 0, 'resvg', 'text rasteriser working');
} catch (err) {
  add(false, 'resvg', err.message, 'npm install');
}

/* fonts */
const manifestPath = path.join(FONTS_DIR, 'fonts.json');
if (fs.existsSync(manifestPath)) {
  const m = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const faces = m.families.reduce((n, f) => n + f.faces.length, 0);
  const metrics = fs.existsSync(path.join(FONTS_DIR, 'metrics', 'metrics.json'));
  add(faces > 0 && metrics, 'Fonts', `${m.families.length} families / ${faces} faces${metrics ? '' : ' — metrics missing'}`, 'npm run fonts');
} else {
  add(false, 'Fonts', 'no assets/fonts/fonts.json', 'npm run fonts -- --starter-pack');
}

/* content */
const count = (dir, re) => (fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => re.test(f)).length : 0);
add(true, 'Clips', `${count(SOURCE_DIR, /\.(mp4|mov|webm|mkv|m4v)$/i)} in media/source`);
add(true, 'Music', `${count(MUSIC_DIR, /\.(mp3|wav|m4a|aac|ogg|flac)$/i)} in media/music`);
add(true, 'Projects', `${count(PROJECTS_DIR, /\.json$/)} in projects`);
add(true, 'Exports', `${count(EXPORTS_DIR, /\.(mp4|mov|webm)$/i)} in media/exports`);

/* media health: dangling links and clips that want a proxy */
try {
  const { listMedia } = await import('../src/server/lib/library.js');
  const { videos } = await listMedia();
  const dangling = fs.existsSync(SOURCE_DIR)
    ? fs.readdirSync(SOURCE_DIR).filter((f) => {
      const abs = path.join(SOURCE_DIR, f);
      return fs.lstatSync(abs).isSymbolicLink() && !fs.existsSync(abs);
    })
    : [];
  if (dangling.length) {
    add(false, 'Links', `${dangling.length} dangling: ${dangling.join(', ')}`, 'reconnect the drive, or delete the links in media/source');
  } else {
    const linked = videos.filter((v) => v.linked).length;
    if (linked) add(true, 'Links', `${linked} linked clip(s), all reachable`);
  }
  const heavy = videos.filter((v) => v.bytes > 40 * 1024 * 1024 && !v.proxy);
  const proxied = videos.filter((v) => v.proxy).length;
  if (heavy.length) {
    add(true, 'Proxies', `${proxied} built · ${heavy.length} big clip(s) would scrub better with one → npm run proxy`);
  } else if (videos.length) {
    add(true, 'Proxies', proxied ? `${proxied} built` : 'none needed');
  }
} catch (err) {
  add(false, 'Media', err.message, 'npm run setup');
}

console.log('');
for (const r of rows) {
  const mark = r.ok ? c.green('✓') : c.red('✗');
  console.log(`  ${mark} ${r.label.padEnd(9)} ${c.dim(r.detail)}`);
  if (!r.ok && r.fix) console.log(`      ${c.yellow('fix:')} ${r.fix}`);
}
const bad = rows.filter((r) => !r.ok).length;
console.log(`\n  ${bad ? c.red(`${bad} problem(s)`) : c.green('all good')} — studio: npm run dev\n`);
process.exit(bad ? 1 : 0);
