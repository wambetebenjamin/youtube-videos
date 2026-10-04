#!/usr/bin/env node
/**
 * The quote library.
 *
 *   npm run quotes                                  list packs
 *   npm run quotes -- --pack stoic                  show one
 *   npm run quotes -- --pack stoic --random         pick one
 *   npm run quotes -- --add "Text here" --author "Name" --pack mine
 */
import fs from 'node:fs';
import path from 'node:path';
import { QUOTES_DIR } from '../src/core/paths.js';
import { parseArgs, c } from './lib/cli.mjs';

const { flags } = parseArgs();
fs.mkdirSync(QUOTES_DIR, { recursive: true });

const packFile = (id) => path.join(QUOTES_DIR, `${id}.json`);
const readPack = (id) => (fs.existsSync(packFile(id)) ? JSON.parse(fs.readFileSync(packFile(id), 'utf8')) : null);

if (flags.add) {
  const id = typeof flags.pack === 'string' ? flags.pack : 'mine';
  const pack = readPack(id) || { name: id[0].toUpperCase() + id.slice(1), description: '', quotes: [] };
  pack.quotes.push({ text: String(flags.add), author: typeof flags.author === 'string' ? flags.author : '' });
  fs.writeFileSync(packFile(id), `${JSON.stringify(pack, null, 2)}\n`);
  console.log(`  ${c.green('✓')} added to content/quotes/${id}.json (${pack.quotes.length} total)`);
  process.exit(0);
}

const packs = fs.readdirSync(QUOTES_DIR).filter((f) => f.endsWith('.json')).map((f) => f.replace(/\.json$/, ''));

if (typeof flags.pack === 'string') {
  const pack = readPack(flags.pack);
  if (!pack) { console.error(`  no pack "${flags.pack}". Available: ${packs.join(', ')}`); process.exit(1); }
  const list = flags.random ? [pack.quotes[Math.floor(Math.random() * pack.quotes.length)]] : pack.quotes;
  console.log(`\n  ${c.bold(pack.name)} ${c.dim(`· ${pack.quotes.length} quotes`)}\n`);
  for (const q of list) console.log(`  “${q.text}”\n    ${c.dim(`— ${q.author || 'Unknown'}`)}\n`);
  process.exit(0);
}

console.log('');
for (const id of packs) {
  const pack = readPack(id);
  console.log(`  ${c.bold(id.padEnd(14))} ${String(pack.quotes.length).padStart(3)} quotes  ${c.dim(pack.description || '')}`);
}
console.log(`\n  ${c.dim('npm run quotes -- --pack stoic')}\n`);
