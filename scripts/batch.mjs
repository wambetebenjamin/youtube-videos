#!/usr/bin/env node
/**
 * Apply one design across many clips — the "same content across the
 * videos" workflow.
 *
 *   npm run batch -- --template sample-reel --clips "media/source/*.mp4"
 *   npm run batch -- --template sample-reel --clips "media/source/b-roll-*.mp4" --quotes stoic --render
 *   npm run batch -- --template sample-reel --clips "media/source/*.mp4" --texts "Line one|Line two|Line three"
 *
 * It clones the template's layer stack onto each clip, optionally rotating
 * a different quote into each one, and writes one project per clip. Add
 * --render to export them all in a single pass.
 */
import fs from 'node:fs';
import path from 'node:path';
import { PROJECTS_DIR, QUOTES_DIR, toRepoPath } from '../src/core/paths.js';
import { readProject, writeProject } from '../src/server/lib/library.js';
import { renderProject } from '../src/server/render/engine.js';
import { normalizeProject, newId } from '../src/core/project.js';
import { probe } from '../src/server/lib/ffmpeg.js';
import { parseArgs, expandGlob, c, bar, fmtBytes, die } from './lib/cli.mjs';

const { flags } = parseArgs();

if (flags.help || !flags.template) {
  console.log(`
  ${c.bold('npm run batch')} -- --template <project-id> --clips "<glob>" [options]

    --template <id>     project in projects/ to use as the design
    --clips "<glob>"    e.g. "media/source/*.mp4"
    --quotes <pack>     rotate quotes from content/quotes/<pack>.json
    --texts "a|b|c"     rotate these lines instead
    --prefix <name>     project id prefix (default: the template id)
    --trim <seconds>    cap every clip to this length
    --render            render each one after creating it
    --preset <id>       export preset for --render
    --dry               show what would happen, write nothing
`);
  process.exit(flags.template ? 0 : 1);
}

const template = readProject(flags.template);
if (!template) die(`no projects/${flags.template}.json`);

const clips = expandGlob(flags.clips || 'media/source/*.mp4');
if (!clips.length) die(`no clips matched ${flags.clips}`);

/* ---------- the rotating text pool ---------- */
let pool = [];
if (flags.texts) {
  pool = String(flags.texts).split('|').map((t) => ({ text: t.trim(), author: '' }));
} else if (flags.quotes) {
  const f = path.join(QUOTES_DIR, `${flags.quotes}.json`);
  if (!fs.existsSync(f)) die(`no quote pack at content/quotes/${flags.quotes}.json`);
  pool = JSON.parse(fs.readFileSync(f, 'utf8')).quotes || [];
}

const prefix = flags.prefix || flags.template;
console.log(`\n  template ${c.bold(template.name)}  ·  ${clips.length} clip(s)${pool.length ? `  ·  ${pool.length} line(s) in rotation` : ''}\n`);

const made = [];
for (const [i, clipAbs] of clips.entries()) {
  const clip = toRepoPath(clipAbs);
  const base = path.basename(clipAbs, path.extname(clipAbs)).toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const id = `${prefix}-${base}`.slice(0, 64);

  const info = await probe(clipAbs).catch(() => null);
  if (!info?.hasVideo) { console.log(`  ${c.yellow('skip')} ${clip} — not a video`); continue; }

  const project = normalizeProject({
    ...structuredClone(template),
    id,
    name: `${template.name} — ${base}`,
    layers: structuredClone(template.layers).map((l) => ({ ...l, id: newId(l.type[0]) })),
  });

  project.source = { ...project.source, clip };
  const cap = flags.trim ? Number(flags.trim) : null;
  project.source.trim = { start: 0, end: cap ? Math.min(cap, info.duration) : null };

  // Rotate a quote / line into the first quote layer (or the first text layer).
  if (pool.length) {
    const pick = pool[i % pool.length];
    const target = project.layers.find((l) => l.type === 'quote') || project.layers.find((l) => l.type === 'text');
    if (target) {
      target.text = pick.text;
      if (target.type === 'quote') target.attribution = pick.author || '';
      target.name = `line: ${pick.text.slice(0, 28)}`;
    }
  }

  // Keep every layer inside the new clip's length.
  const duration = (project.source.trim.end || info.duration) - (project.source.trim.start || 0);
  for (const l of project.layers) {
    if (l.end && l.end > duration) l.end = Math.round(duration * 100) / 100;
    if (l.start >= duration) l.start = Math.max(0, duration - 1);
  }

  if (flags.dry) {
    console.log(`  ${c.dim('would write')} projects/${id}.json  ← ${clip}`);
    continue;
  }

  writeProject(id, project);
  console.log(`  ${c.green('✓')} projects/${id}.json  ${c.dim(`← ${clip} (${duration.toFixed(1)}s)`)}`);
  made.push(id);
}

if (flags.render && made.length) {
  console.log(`\n  rendering ${made.length} project(s)…\n`);
  for (const id of made) {
    const project = readProject(id);
    let last = '';
    try {
      const result = await renderProject(project, {
        preset: flags.preset || project.export?.preset,
        onProgress: ({ percent }) => {
          last = `  ${bar(percent)} ${String(Math.round(percent)).padStart(3)}%  ${id}`;
          process.stdout.write(`\r${last}`);
        },
      });
      process.stdout.write(`\r${' '.repeat(last.length)}\r`);
      console.log(`  ${c.green('✓')} ${result.file}  ${c.dim(fmtBytes(result.bytes))}`);
    } catch (err) {
      process.stdout.write('\n');
      console.error(`  ${c.red('✗')} ${id}: ${err.message.split('\n').slice(-3).join(' ')}`);
    }
  }
}

console.log(`\n  ${made.length} project(s) in ${path.relative(process.cwd(), PROJECTS_DIR)}`);
if (!flags.render) console.log(`  ${c.dim('render them all with:')} npm run render -- --all`);
