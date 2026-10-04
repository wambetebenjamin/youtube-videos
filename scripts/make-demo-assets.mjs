#!/usr/bin/env node
/**
 * Generates the sample clip and sample audio bed that ship with the repo,
 * so a fresh clone has something to preview before you upload anything.
 *
 *   npm run demo
 *
 * Everything here is synthesised by FFmpeg + resvg — no stock footage,
 * no licensing questions.
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { SOURCE_DIR, MUSIC_DIR, CACHE_DIR, ensureDirs } from '../src/core/paths.js';
import { svgToPng, makeRenderContext } from '../src/server/render/rasterize.js';
import { FFMPEG } from '../src/server/lib/ffmpeg.js';

const execFileAsync = promisify(execFile);
ensureDirs();

const tmp = path.join(CACHE_DIR, 'demo');
fs.mkdirSync(tmp, { recursive: true });

/* ---------- 1. an abstract gradient plate, rendered with resvg ---------- */
const W = 1700;
const H = 2900;
const plate = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="base" x1="0" y1="0" x2="0.4" y2="1">
      <stop offset="0" stop-color="#1b1033"/>
      <stop offset="0.45" stop-color="#3b1d53"/>
      <stop offset="1" stop-color="#0d1b36"/>
    </linearGradient>
    <radialGradient id="warm" cx="0.25" cy="0.22" r="0.55">
      <stop offset="0" stop-color="#ff8a4c" stop-opacity="0.85"/>
      <stop offset="1" stop-color="#ff8a4c" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="cool" cx="0.8" cy="0.7" r="0.6">
      <stop offset="0" stop-color="#3ec8ff" stop-opacity="0.6"/>
      <stop offset="1" stop-color="#3ec8ff" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="pink" cx="0.62" cy="0.38" r="0.4">
      <stop offset="0" stop-color="#ff5c9d" stop-opacity="0.5"/>
      <stop offset="1" stop-color="#ff5c9d" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#base)"/>
  <rect width="${W}" height="${H}" fill="url(#warm)"/>
  <rect width="${W}" height="${H}" fill="url(#cool)"/>
  <rect width="${W}" height="${H}" fill="url(#pink)"/>
  ${Array.from({ length: 26 }, (_, i) => {
    const y = (i / 26) * H;
    return `<rect x="0" y="${y.toFixed(1)}" width="${W}" height="2" fill="#ffffff" fill-opacity="0.035"/>`;
  }).join('')}
</svg>`;

const plateFile = path.join(tmp, 'plate.png');
fs.writeFileSync(plateFile, svgToPng(plate, makeRenderContext({ width: W, height: H })));
console.log('  plate rendered');

/* ---------- 2. slow push-in + grain → a 12s vertical clip ---------- */
const clip = path.join(SOURCE_DIR, 'sample-gradient-reel.mp4');
await execFileAsync(FFMPEG, [
  '-hide_banner', '-loglevel', 'error', '-y',
  '-loop', '1', '-framerate', '30', '-t', '12', '-i', plateFile,
  '-vf', [
    "zoompan=z='min(1.0008^on,1.22)':x='iw/2-(iw/zoom/2)+sin(on/180)*60':y='ih/2-(ih/zoom/2)+on*0.25':d=1:s=1080x1920:fps=30",
    'noise=alls=7:allf=t+u',
    'format=yuv420p',
  ].join(','),
  '-c:v', 'libx264', '-crf', '30', '-preset', 'medium', '-movflags', '+faststart',
  clip,
]);
console.log(`  ${path.relative(process.cwd(), clip)}  ${(fs.statSync(clip).size / 1e6).toFixed(2)} MB`);

/* ---------- 3. a simple ambient bed (synthetic, royalty-free by construction) ---------- */
const music = path.join(MUSIC_DIR, 'sample-ambient-bed.mp3');
const notes = [146.83, 220.0, 293.66, 369.99]; // Dm9-ish drone
await execFileAsync(FFMPEG, [
  '-hide_banner', '-loglevel', 'error', '-y',
  ...notes.flatMap((f) => ['-f', 'lavfi', '-t', '32', '-i', `sine=frequency=${f}:sample_rate=48000`]),
  '-filter_complex', [
    ...notes.map((_, i) => `[${i}:a]volume=${(0.22 - i * 0.03).toFixed(3)},tremolo=f=${(0.12 + i * 0.07).toFixed(2)}:d=0.35[n${i}]`),
    `${notes.map((_, i) => `[n${i}]`).join('')}amix=inputs=${notes.length}:duration=longest,` +
    'volume=3,lowpass=f=1100,aecho=0.8:0.85:320|540:0.28|0.18,' +
    'afade=t=in:st=0:d=3,afade=t=out:st=29:d=3,alimiter=limit=0.9[a]',
  ].join(';'),
  '-map', '[a]', '-c:a', 'libmp3lame', '-b:a', '112k', '-ar', '48000', '-ac', '2',
  music,
]);
console.log(`  ${path.relative(process.cwd(), music)}  ${(fs.statSync(music).size / 1e3).toFixed(0)} KB`);

fs.rmSync(tmp, { recursive: true, force: true });
console.log('\n  demo assets ready — reload the studio');
