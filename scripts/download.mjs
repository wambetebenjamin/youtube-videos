#!/usr/bin/env node
/**
 * Get finished videos out of the repo.
 *
 *   npm run download -- --latest                 # newest export
 *   npm run download -- --latest --to ~/Desktop  # copy it somewhere
 *   npm run download -- --all --to ./out
 *   npm run download -- sample-reel-reel-2026.mp4
 *   npm run download -- --latest --serve         # one-off HTTP link
 *
 * Every export already lives in media/exports/ — this just copies it out,
 * or hands you a URL when the repo is running on a remote machine.
 */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
import { EXPORTS_DIR, toRepoPath } from '../src/core/paths.js';
import { parseArgs, c, fmtBytes, die } from './lib/cli.mjs';

const { flags, positional } = parseArgs();

if (flags.help) {
  console.log(`
  ${c.bold('npm run download')} -- [name…] [options]

    --latest         the most recent export
    --all            every export
    --to <dir>       copy there (accepts ~)
    --serve [port]   serve the selection over HTTP and print the links
    --list           just list what's available
`);
  process.exit(0);
}

if (!fs.existsSync(EXPORTS_DIR)) die('no media/exports yet — render something first.');

const all = fs.readdirSync(EXPORTS_DIR)
  .filter((f) => /\.(mp4|mov|webm|mkv)$/i.test(f))
  .map((f) => ({ name: f, abs: path.join(EXPORTS_DIR, f), stat: fs.statSync(path.join(EXPORTS_DIR, f)) }))
  .sort((a, b) => b.stat.mtimeMs - a.stat.mtimeMs);

if (!all.length) die('no renders found in media/exports. Run: npm run render -- --all');

if (flags.list) {
  for (const f of all) {
    console.log(`  ${f.name}  ${c.dim(`${fmtBytes(f.stat.size)} · ${new Date(f.stat.mtimeMs).toLocaleString()}`)}`);
  }
  process.exit(0);
}

let picked;
if (flags.all) picked = all;
else if (flags.latest) picked = [all[0]];
else if (positional.length) {
  picked = positional.map((n) => {
    const hit = all.find((f) => f.name === n || f.name.startsWith(n));
    if (!hit) die(`no export matching "${n}". Try: npm run download -- --list`);
    return hit;
  });
} else picked = [all[0]];

/* ---------------- copy ---------------- */
if (flags.to) {
  const dest = path.resolve(String(flags.to).replace(/^~(?=$|\/)/, os.homedir()));
  fs.mkdirSync(dest, { recursive: true });
  for (const f of picked) {
    const target = path.join(dest, f.name);
    fs.copyFileSync(f.abs, target);
    console.log(`  ${c.green('✓')} ${target}  ${c.dim(fmtBytes(f.stat.size))}`);
  }
  process.exit(0);
}

/* ---------------- serve ---------------- */
if (flags.serve) {
  const port = Number(flags.serve === true ? 8899 : flags.serve);
  const server = http.createServer((req, res) => {
    const name = decodeURIComponent(req.url.replace(/^\//, ''));
    const file = picked.find((f) => f.name === name);
    if (!file) {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(`<meta name="viewport" content="width=device-width,initial-scale=1"><body style="font:15px system-ui;background:#111;color:#eee;padding:24px">
        <h2>Renders</h2>${picked.map((f) => `<p><a style="color:#6ea8fe" href="/${encodeURIComponent(f.name)}">${f.name}</a> <small>${fmtBytes(f.stat.size)}</small></p>`).join('')}</body>`);
      return;
    }
    res.writeHead(200, {
      'Content-Type': 'video/mp4',
      'Content-Length': file.stat.size,
      'Content-Disposition': `attachment; filename="${file.name}"`,
    });
    fs.createReadStream(file.abs).pipe(res);
  });
  server.listen(port, '0.0.0.0', () => {
    console.log(`\n  Serving ${picked.length} file(s) on ${c.cyan(`http://localhost:${port}/`)}`);
    for (const f of picked) console.log(`    http://localhost:${port}/${encodeURIComponent(f.name)}`);
    console.log(`\n  ${c.dim('Ctrl-C to stop.')}`);
  });
} else {
  /* ---------------- just tell me where it is ---------------- */
  for (const f of picked) {
    console.log(`  ${c.bold(f.name)}`);
    console.log(`    path  ${f.abs}`);
    console.log(`    repo  ${toRepoPath(f.abs)}`);
    console.log(`    url   http://localhost:8787/api/download/${encodeURIComponent(f.name)}  ${c.dim('(while npm run dev is up)')}`);
    console.log(`    size  ${fmtBytes(f.stat.size)}\n`);
  }
  console.log(`  ${c.dim('copy it out with')} --to ~/Desktop  ${c.dim('or share it with')} --serve`);
}
