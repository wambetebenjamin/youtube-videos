import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from '../../src/core/paths.js';

/** Minimal flag parser: --key value, --flag, and positional args. */
export function parseArgs(argv = process.argv.slice(2)) {
  const flags = {};
  const positional = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next && !next.startsWith('--')) { flags[key] = next; i++; } else { flags[key] = true; }
    } else {
      positional.push(a);
    }
  }
  return { flags, positional, _: positional };
}

/** Tiny glob: supports * and ? inside one directory level. */
export function expandGlob(pattern) {
  const abs = path.resolve(ROOT, pattern);
  if (!/[*?]/.test(abs)) return fs.existsSync(abs) ? [abs] : [];
  const dir = path.dirname(abs);
  const base = path.basename(abs);
  if (!fs.existsSync(dir)) return [];
  const re = new RegExp(`^${base.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\?/g, '.')}$`, 'i');
  return fs.readdirSync(dir).filter((f) => re.test(f)).map((f) => path.join(dir, f)).sort();
}

export const c = {
  dim: (s) => `\x1b[2m${s}\x1b[0m`,
  bold: (s) => `\x1b[1m${s}\x1b[0m`,
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  cyan: (s) => `\x1b[36m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  red: (s) => `\x1b[31m${s}\x1b[0m`,
};

export function bar(pct, width = 28) {
  const filled = Math.round((pct / 100) * width);
  return `${'█'.repeat(Math.max(0, filled))}${'░'.repeat(Math.max(0, width - filled))}`;
}

export function fmtBytes(n) {
  if (!Number.isFinite(n) || n === 0) return '0 B';
  const sign = n < 0 ? '-' : '';
  const abs = Math.abs(n);
  const u = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.min(u.length - 1, Math.floor(Math.log(abs) / Math.log(1024)));
  return `${sign}${(abs / 1024 ** i).toFixed(i ? 1 : 0)} ${u[i]}`;
}

export function die(msg) {
  console.error(`${c.red('error')} ${msg}`);
  process.exit(1);
}

/** Section heading shared by the CLI tools: `verb  subject`. */
export function header(verb, subject = '') {
  console.log(`${c.cyan(verb)} ${subject ? c.bold(subject) : ''}`);
}
