#!/usr/bin/env node
/**
 * Bring media into the repo from anywhere on disk.
 *
 *   npm run import -- ~/Movies/*.mp4                 copy into media/source
 *   npm run import -- ~/Movies/*.mp4 --link          symlink instead (0 bytes)
 *   npm run import -- ~/Music/bed.mp3                auto-routed to media/music
 *   npm run import -- /Volumes/SSD/footage --link --proxy
 *
 * --link is the answer for large footage: the repo gets a pointer, the bytes
 * stay on your drive, and everything (preview, probe, render) works the same.
 */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {
  SOURCE_DIR, MUSIC_DIR, IMAGES_DIR, ROOT, toRepoPath, ensureDirs,
} from '../src/core/paths.js';
import { VIDEO_EXT, AUDIO_EXT, IMAGE_EXT } from '../src/server/lib/library.js';
import { buildProxy, proxyWorthwhile } from '../src/server/lib/proxy.js';
import { probe } from '../src/server/lib/ffmpeg.js';
import { parseArgs, c, fmtBytes, die, header } from './lib/cli.mjs';

const { flags, _: positional } = parseArgs(process.argv.slice(2));

if (flags.help || !positional.length) {
  console.log(`
${c.bold('npm run import')} -- <files|folders...> [options]

  --link        symlink instead of copying (instant, no extra disk)
  --move        move the file in (frees the original location)
  --to <dir>    force a destination (default: by file type)
  --proxy       build a preview proxy for big clips afterwards
  --force       overwrite an existing file of the same name
  --dry         show what would happen

Examples
  npm run import -- ~/Movies/interview.mov --link --proxy
  npm run import -- ~/Downloads/*.mp4
  npm run import -- /Volumes/Rush/day-1 --link
`);
  process.exit(0);
}

function expand(input) {
  const abs = path.resolve(input.replace(/^~(?=\/|$)/, os.homedir()));
  if (!fs.existsSync(abs)) return [];
  if (fs.statSync(abs).isDirectory()) {
    return fs.readdirSync(abs)
      .filter((f) => !f.startsWith('.'))
      .map((f) => path.join(abs, f))
      .filter((f) => fs.statSync(f).isFile());
  }
  return [abs];
}

function destFor(file) {
  if (flags.to) return path.resolve(ROOT, flags.to);
  const ext = path.extname(file).toLowerCase();
  if (VIDEO_EXT.has(ext)) return SOURCE_DIR;
  if (AUDIO_EXT.has(ext)) return MUSIC_DIR;
  if (IMAGE_EXT.has(ext)) return IMAGES_DIR;
  return null;
}

ensureDirs();

const files = positional.flatMap(expand);
if (!files.length) die('nothing matched — check the path');

header('import', `${files.length} file(s)`);

const imported = [];
let skipped = 0;

for (const src of files) {
  const dir = destFor(src);
  const name = path.basename(src).replace(/[^a-zA-Z0-9._-]+/g, '-');
  if (!dir) {
    console.log(`  ${c.dim('skip')}  ${path.basename(src)} ${c.dim('(unsupported type)')}`);
    skipped += 1;
    continue;
  }
  const dest = path.join(dir, name);
  const size = fs.statSync(src).size;

  if (fs.existsSync(dest) && !flags.force) {
    console.log(`  ${c.dim('skip')}  ${name} ${c.dim('(already here — use --force)')}`);
    skipped += 1;
    continue;
  }

  const how = flags.link ? 'link' : flags.move ? 'move' : 'copy';
  if (flags.dry) {
    console.log(`  ${c.dim(how)}  ${name}  ${c.dim(`${fmtBytes(size)} → ${toRepoPath(dest)}`)}`);
    continue;
  }

  fs.mkdirSync(dir, { recursive: true });
  if (fs.existsSync(dest)) fs.rmSync(dest);
  if (flags.link) fs.symlinkSync(src, dest);
  else if (flags.move) fs.renameSync(src, dest);
  else fs.copyFileSync(src, dest);

  const tag = flags.link ? c.cyan('linked') : flags.move ? c.cyan('moved ') : c.green('copied');
  console.log(`  ${tag}  ${name}  ${c.dim(fmtBytes(size))}`);
  imported.push(dest);
}

if (flags.dry) process.exit(0);

if (flags.proxy && imported.length) {
  console.log('');
  for (const dest of imported) {
    const ext = path.extname(dest).toLowerCase();
    if (!VIDEO_EXT.has(ext)) continue;
    const info = await probe(dest).catch(() => null);
    if (!await proxyWorthwhile(dest, info)) continue;
    process.stdout.write(`  ${c.dim('proxy')} ${path.basename(dest)} … `);
    const r = await buildProxy(dest);
    console.log(c.green(`${fmtBytes(r.bytes)}`));
  }
}

console.log('');
console.log(`  ${c.green('✓')} ${imported.length} imported${skipped ? c.dim(`, ${skipped} skipped`) : ''}`);
if (flags.link && imported.length) {
  console.log(c.dim('  linked files point outside the repo — keep the originals where they are'));
}
