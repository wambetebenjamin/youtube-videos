#!/usr/bin/env node
/**
 * Build small preview copies of big clips.
 *
 *   npm run proxy                 proxy every clip that needs one
 *   npm run proxy -- --all        proxy everything, regardless of size
 *   npm run proxy -- hero.mp4     one file
 *   npm run proxy -- --clean      drop proxies whose source changed or left
 *   npm run proxy -- --status     what exists, and what it's saving you
 *
 * The studio previews these; renders always use the original.
 */
import fs from 'node:fs';
import path from 'node:path';
import { SOURCE_DIR, toRepoPath, resolveRepoPath, ensureDirs } from '../src/core/paths.js';
import { VIDEO_EXT } from '../src/server/lib/library.js';
import {
  buildProxy, proxyWorthwhile, findProxy, pruneProxies, PROXY_HEIGHT,
} from '../src/server/lib/proxy.js';
import { probe } from '../src/server/lib/ffmpeg.js';
import { parseArgs, c, fmtBytes, header, bar, die } from './lib/cli.mjs';

const { flags, _: positional } = parseArgs(process.argv.slice(2));

if (flags.help) {
  console.log(`
${c.bold('npm run proxy')} -- [files...] [options]

  --all         include clips that are already small enough
  --force       rebuild even if a current proxy exists
  --height <n>  proxy short-edge height (default ${PROXY_HEIGHT})
  --clean       remove stale proxies
  --status      list proxies and the space they take

Why: a 4K clip scrubs badly in a browser. Proxies are ~540p stand-ins used
only for preview — every render reads the original file.
`);
  process.exit(0);
}

ensureDirs();

function sourceFiles() {
  if (!fs.existsSync(SOURCE_DIR)) return [];
  return fs.readdirSync(SOURCE_DIR)
    .filter((f) => !f.startsWith('.') && VIDEO_EXT.has(path.extname(f).toLowerCase()))
    .map((f) => path.join(SOURCE_DIR, f));
}

/* ------------------------------- status ------------------------------- */
if (flags.status) {
  const files = sourceFiles();
  header('proxies', `${files.length} clip(s) in media/source`);
  let proxied = 0;
  let srcTotal = 0;
  let proxyTotal = 0;
  for (const abs of files) {
    const rel = toRepoPath(abs);
    const p = findProxy(rel);
    const srcBytes = fs.statSync(abs).size;
    srcTotal += srcBytes;
    const link = fs.lstatSync(abs).isSymbolicLink() ? c.cyan(' ↗link') : '';
    if (p) {
      const pb = fs.statSync(resolveRepoPath(p)).size;
      proxyTotal += pb;
      proxied += 1;
      console.log(`  ${c.green('●')} ${path.basename(abs).padEnd(34)} ${c.dim(fmtBytes(srcBytes).padStart(9))} → ${c.bold(fmtBytes(pb).padStart(9))}${link}`);
    } else {
      console.log(`  ${c.dim('○')} ${path.basename(abs).padEnd(34)} ${c.dim(fmtBytes(srcBytes).padStart(9))} ${c.dim('   no proxy')}${link}`);
    }
  }
  console.log('');
  console.log(`  ${proxied}/${files.length} proxied · sources ${fmtBytes(srcTotal)} · proxies ${fmtBytes(proxyTotal)}`);
  if (!proxied && files.length) console.log(c.dim('  build them with: npm run proxy'));
  process.exit(0);
}

/* -------------------------------- clean ------------------------------- */
if (flags.clean) {
  const removed = pruneProxies(sourceFiles().map(toRepoPath));
  header('proxies', 'clean');
  if (!removed.length) console.log(c.dim('  nothing stale'));
  for (const r of removed) console.log(`  ${c.dim('removed')} ${r.name} ${c.dim(fmtBytes(r.bytes))}`);
  process.exit(0);
}

/* -------------------------------- build ------------------------------- */
let targets = sourceFiles();
if (positional.length) {
  targets = positional.map((a) => {
    const direct = path.resolve(a);
    if (fs.existsSync(direct) && fs.statSync(direct).isFile()) return direct;
    const inSource = path.join(SOURCE_DIR, a);
    if (fs.existsSync(inSource)) return inSource;
    return die(`not found: ${a}`);
  });
}

if (!targets.length) {
  header('proxies', 'nothing to do');
  console.log(c.dim('  media/source is empty — add clips with npm run import'));
  process.exit(0);
}

const height = Number(flags.height) || PROXY_HEIGHT;
header('proxies', `${targets.length} candidate(s) · ${height}p`);

let built = 0;
let skipped = 0;
let saved = 0;

for (const abs of targets) {
  const name = path.basename(abs);
  const info = await probe(abs).catch(() => null);

  if (!flags.all && !positional.length && !await proxyWorthwhile(abs, info)) {
    skipped += 1;
    continue;
  }
  const existing = findProxy(toRepoPath(abs));
  if (existing && !flags.force) {
    console.log(`  ${c.dim('cached')} ${name}`);
    skipped += 1;
    continue;
  }

  const srcBytes = fs.statSync(abs).size;
  const label = `  ${name.slice(0, 30).padEnd(30)}`;
  const r = await buildProxy(abs, {
    height,
    force: flags.force,
    onProgress: ({ fraction, speed }) => {
      process.stdout.write(`\r${label} ${bar(fraction * 100)} ${c.dim(speed)}   `);
    },
  });
  process.stdout.write(`\r${' '.repeat(80)}\r`);

  // A proxy that isn't meaningfully smaller just costs disk and confusion.
  if (r.bytes >= srcBytes * 0.9) {
    fs.unlinkSync(resolveRepoPath(r.path));
    console.log(`  ${c.dim('skip')}   ${name.padEnd(32)} ${c.dim(`already small enough (${fmtBytes(srcBytes)})`)}`);
    skipped += 1;
    continue;
  }

  const pct = Math.round((1 - r.bytes / srcBytes) * 100);
  console.log(`  ${c.green('✓')} ${name.padEnd(32)} ${c.dim(fmtBytes(srcBytes))} → ${c.bold(fmtBytes(r.bytes))} ${c.green(`(${pct}% smaller)`)}`);
  saved += srcBytes - r.bytes;
  built += 1;
}

console.log('');
if (built) {
  console.log(`  ${built} proxy/proxies in ${c.bold('media/proxies')} ${c.dim(`· previews now read ${fmtBytes(saved)} less`)}`);
  console.log(c.dim('  renders still use the originals'));
} else {
  console.log(c.dim(`  nothing to build${skipped ? ` (${skipped} already fine)` : ''}`));
  console.log(c.dim('  force it for every clip with: npm run proxy -- --all'));
}
