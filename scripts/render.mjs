#!/usr/bin/env node
/**
 * Render projects to MP4 from the command line.
 *
 *   npm run render -- sample-reel
 *   npm run render -- sample-reel --preset draft
 *   npm run render -- --all
 *   npm run render -- sample-reel other-reel --preset youtube-hq
 *
 * No server needed — this is the same engine the studio's Render button
 * calls, so the output is identical.
 */
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, EXPORTS_DIR } from '../src/core/paths.js';
import { listProjects, readProject } from '../src/server/lib/library.js';
import { renderProject } from '../src/server/render/engine.js';
import { exportPresets } from '../src/server/lib/presets.js';
import { parseArgs, c, bar, fmtBytes, die } from './lib/cli.mjs';

const { flags, positional } = parseArgs();

if (flags.help) {
  console.log(`
  ${c.bold('npm run render')} -- <project…> [options]

    --all               render every project in projects/
    --preset <id>       ${Object.keys(exportPresets()).join(' | ')}
    --out <name.mp4>    output filename (single project only)
    --quiet             no progress bar

  Output lands in media/exports/ alongside a .json sidecar recording the
  exact project that produced it.
`);
  process.exit(0);
}

const ids = flags.all ? listProjects().map((p) => p.id) : positional;
if (!ids.length) die('nothing to render. Pass a project id or --all. Try: npm run render -- --help');

const results = [];
for (const id of ids) {
  const project = readProject(id);
  if (!project) { console.error(`${c.yellow('skip')} ${id} — no projects/${id}.json`); continue; }

  const preset = flags.preset || project.export?.preset || 'social-hq';
  process.stdout.write(`${c.cyan('render')} ${c.bold(project.name)} ${c.dim(`(${id}, ${preset})`)}\n`);

  let lastLine = '';
  const t0 = Date.now();
  try {
    const result = await renderProject(project, {
      preset,
      outName: ids.length === 1 && typeof flags.out === 'string' ? flags.out : undefined,
      onLog: (msg) => console.log(`  ${c.dim(msg)}`),
      onProgress: ({ percent, seconds, duration, speed }) => {
        if (flags.quiet) return;
        lastLine = `  ${bar(percent)} ${String(Math.round(percent)).padStart(3)}%  ${seconds.toFixed(1)}/${duration.toFixed(1)}s  ${speed}`;
        process.stdout.write(`\r${lastLine}`);
      },
    });
    if (lastLine) process.stdout.write(`\r${' '.repeat(lastLine.length)}\r`);
    const secs = ((Date.now() - t0) / 1000).toFixed(1);
    console.log(`  ${c.green('✓')} ${result.file}  ${c.dim(`${fmtBytes(result.bytes)} · ${result.duration.toFixed(1)}s · took ${secs}s`)}`);
    results.push(result);
  } catch (err) {
    if (lastLine) process.stdout.write('\n');
    console.error(`  ${c.red('✗')} ${err.message.split('\n').slice(-6).join('\n')}`);
    process.exitCode = 1;
  }
}

if (results.length) {
  console.log(`\n  ${results.length} file(s) in ${c.bold(path.relative(ROOT, EXPORTS_DIR))}`);
  console.log(`  ${c.dim('download them with:')} npm run download -- --latest --to ~/Desktop`);
}
