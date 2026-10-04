#!/usr/bin/env node
/**
 * One-command setup for a fresh clone.
 *
 *   npm install && npm run setup
 *
 * Creates the folder structure, builds the font manifest, generates the
 * sample clip + audio bed, and writes an example project so the studio
 * has something to show immediately.
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import {
  ROOT, ensureDirs, SOURCE_DIR, MUSIC_DIR, FONTS_DIR, PROJECTS_DIR, IMPORTS_DIR,
  EXPORTS_DIR, IMAGES_DIR,
} from '../src/core/paths.js';

const execFileAsync = promisify(execFile);
const node = process.execPath;
const step = (s) => console.log(`\n\x1b[36m▸ ${s}\x1b[0m`);

ensureDirs();
step('folders ready');

// .gitkeep so empty media folders survive a clone
for (const dir of [SOURCE_DIR, MUSIC_DIR, IMAGES_DIR, EXPORTS_DIR, IMPORTS_DIR]) {
  const keep = path.join(dir, '.gitkeep');
  if (!fs.existsSync(keep)) fs.writeFileSync(keep, '');
}

/* ---------- fonts ---------- */
if (!fs.existsSync(path.join(FONTS_DIR, 'fonts.json'))) {
  step('downloading the font starter pack');
  await execFileAsync(node, ['scripts/fonts.mjs', '--starter-pack'], { cwd: ROOT, stdio: 'inherit' })
    .then(({ stdout }) => process.stdout.write(stdout || ''));
} else {
  step('rebuilding the font manifest');
  const { stdout } = await execFileAsync(node, ['scripts/fonts.mjs'], { cwd: ROOT });
  process.stdout.write(stdout);
}

/* ---------- demo media ---------- */
const sampleClip = path.join(SOURCE_DIR, 'sample-gradient-reel.mp4');
if (!fs.existsSync(sampleClip)) {
  step('generating sample clip + audio bed');
  const { stdout } = await execFileAsync(node, ['scripts/make-demo-assets.mjs'], { cwd: ROOT });
  process.stdout.write(stdout);
}

/* ---------- example project ---------- */
const { writeProject } = await import('../src/server/lib/library.js');
const examplePath = path.join(PROJECTS_DIR, 'sample-reel.json');
if (!fs.existsSync(examplePath)) {
  step('writing the example project');
  writeProject('sample-reel', makeExample());
  console.log('  projects/sample-reel.json');
}

step('done');
console.log(`
  Next:
    npm run dev          start the studio (live preview) + API
    npm run render -- sample-reel
    npm run download -- --latest
`);

/* ------------------------------------------------------------------ */

function makeExample() {
  return {
    id: 'sample-reel',
    name: 'Sample Reel',
    format: 'reel',
    source: {
      clip: 'media/source/sample-gradient-reel.mp4',
      trim: { start: 0, end: 12 },
      fit: 'cover',
      adjust: { brightness: 0, contrast: 1.02, saturation: 1.05 },
    },
    audio: {
      music: [{
        id: 'm1',
        src: 'media/music/sample-ambient-bed.mp3',
        volume: 0.32,
        start: 0,
        offset: 0,
        fadeIn: 1.5,
        fadeOut: 2.5,
        loop: true,
        duck: false,
      }],
    },
    layers: [
      {
        id: 'scrim', type: 'shape', name: 'Bottom fade', start: 0, end: 0,
        animIn: { type: 'none' }, animOut: { type: 'none' },
        shape: { kind: 'scrim-bottom', color: '#000000', opacity: 0.72, size: 0.42 },
      },
      {
        id: 'hook', type: 'text', name: 'Hook', start: 0.3, end: 4.4,
        text: 'you are not behind',
        animIn: { type: 'fade-up', duration: 0.5, easing: 'easeOut', distance: 0.04 },
        animOut: { type: 'fade', duration: 0.35, easing: 'easeOut' },
        box: { x: 0.5, y: 0.33, width: 0.84, align: 'center', anchor: 'center' },
        style: {
          fontFamily: 'anton', fontWeight: 400, fontSize: 0.082, color: '#ffffff',
          lineHeight: 1.02, letterSpacing: -0.005, textTransform: 'uppercase',
          stroke: { color: '#000000', width: 0.028, opacity: 0.9 },
          shadow: { color: '#000000', blur: 0.14, dx: 0, dy: 0.02, opacity: 0.5 },
        },
      },
      {
        id: 'quote', type: 'quote', name: 'Quote', start: 4.6, end: 9.6,
        text: 'The impediment to action advances action.\nWhat stands in the way becomes the way.',
        attribution: 'Marcus Aurelius',
        animIn: { type: 'fade-up', duration: 0.6, easing: 'easeOut', distance: 0.03 },
        animOut: { type: 'fade', duration: 0.45, easing: 'easeOut' },
        box: { x: 0.5, y: 0.44, width: 0.82, align: 'center', anchor: 'center' },
        style: {
          fontFamily: 'playfair-display', fontWeight: 400, italic: true, fontSize: 0.049,
          color: '#ffffff', lineHeight: 1.34,
          shadow: { color: '#000000', blur: 0.22, dx: 0, dy: 0.02, opacity: 0.55 },
          attribution: {
            fontFamily: 'montserrat', fontWeight: 600, italic: false, fontSize: 0.021,
            letterSpacing: 0.16, textTransform: 'uppercase', gap: 0.9, color: '#ffffff',
          },
        },
      },
      {
        id: 'cta', type: 'text', name: 'CTA', start: 9.7, end: 0,
        text: 'save this',
        animIn: { type: 'pop', duration: 0.4, easing: 'easeOutSnap' },
        animOut: { type: 'none' },
        box: { x: 0.5, y: 0.5, width: 0.7, align: 'center', anchor: 'center' },
        style: {
          fontFamily: 'montserrat', fontWeight: 800, fontSize: 0.046, color: '#101010',
          lineHeight: 1.4, letterSpacing: 0.02, textTransform: 'uppercase',
          background: { mode: 'lines', color: '#f5e663', opacity: 1, paddingX: 0.34, paddingY: 0.2, radius: 0.12 },
        },
      },
      {
        id: 'handle', type: 'text', name: 'Handle', start: 0, end: 0,
        text: '@yourhandle',
        animIn: { type: 'none' }, animOut: { type: 'none' },
        box: { x: 0.5, y: 0.085, width: 0.7, align: 'center', anchor: 'center' },
        style: {
          fontFamily: 'montserrat', fontWeight: 600, fontSize: 0.017, color: '#ffffff',
          letterSpacing: 0.12, opacity: 0.75, textTransform: 'uppercase',
          shadow: { color: '#000000', blur: 0.3, dx: 0, dy: 0.02, opacity: 0.5 },
        },
      },
      {
        id: 'bar', type: 'progress', name: 'Progress', start: 0, end: 0,
        animIn: { type: 'none' }, animOut: { type: 'none' },
        progress: { color: '#ffffff', thickness: 0.0045, y: 0.988, trackColor: '#ffffff', trackOpacity: 0.22, opacity: 0.95 },
      },
    ],
    export: { preset: 'social-hq', suffix: '' },
  };
}
