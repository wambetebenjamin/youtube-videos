#!/usr/bin/env node
/** List everything in media/exports with the details that matter. */
import { listExports } from '../src/server/lib/library.js';
import { c, fmtBytes } from './lib/cli.mjs';

const list = await listExports();
if (!list.length) {
  console.log('  nothing rendered yet — try: npm run render -- sample-reel');
  process.exit(0);
}

let total = 0;
console.log('');
for (const f of list) {
  total += f.bytes;
  const i = f.info || {};
  console.log(`  ${c.bold(f.name)}`);
  console.log(`    ${c.dim(`${i.width || '?'}×${i.height || '?'} · ${i.duration ? `${i.duration.toFixed(1)}s` : '?'} · ${fmtBytes(f.bytes)} · ${new Date(f.modified).toLocaleString()}`)}`);
}
console.log(`\n  ${list.length} file(s), ${fmtBytes(total)} total`);
console.log(`  ${c.dim('npm run download -- --latest --to ~/Desktop')}\n`);
