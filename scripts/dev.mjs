#!/usr/bin/env node
/**
 * Runs the API and the studio together.
 *
 *   npm run dev            # studio on :5173, API on :8787
 *   npm run dev -- --local # plain localhost HMR (no HTTPS proxy)
 *
 * The studio proxies /api, /media, /assets and /fonts to the API, so the
 * browser only ever needs one origin — which is what makes this work
 * behind a hosted HTTPS preview.
 */
import { spawn } from 'node:child_process';
import process from 'node:process';
import { ensureDirs } from '../src/core/paths.js';

ensureDirs();

const local = process.argv.includes('--local');
const API_PORT = process.env.API_PORT || '8787';
const STUDIO_PORT = process.env.STUDIO_PORT || '5173';

const env = {
  ...process.env,
  PORT: API_PORT,
  API_PORT,
  STUDIO_PORT,
  // Hosted previews terminate TLS on 443 and map the port into the hostname,
  // so the HMR socket has to be pointed there explicitly.
  ...(local ? {} : { HMR_CLIENT_PORT: process.env.HMR_CLIENT_PORT || '443', HMR_PROTOCOL: 'wss' }),
};

const procs = [];

function run(name, cmd, args, color) {
  const p = spawn(cmd, args, { env, stdio: ['ignore', 'pipe', 'pipe'] });
  const tag = `\x1b[${color}m${name.padEnd(6)}\x1b[0m`;
  const pipe = (stream) => {
    stream.on('data', (chunk) => {
      for (const line of chunk.toString().split('\n')) {
        if (line.trim()) console.log(`${tag} ${line}`);
      }
    });
  };
  pipe(p.stdout);
  pipe(p.stderr);
  p.on('exit', (code) => {
    if (code !== 0 && code !== null) console.log(`${tag} exited with ${code}`);
    shutdown();
  });
  procs.push(p);
  return p;
}

function shutdown() {
  for (const p of procs) {
    if (!p.killed) { try { p.kill('SIGTERM'); } catch { /* already gone */ } }
  }
  setTimeout(() => process.exit(0), 150);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

run('api', process.execPath, ['src/server/index.js'], '36');
run('studio', process.execPath, ['node_modules/vite/bin/vite.js'], '35');

console.log(`\n  Studio  http://localhost:${STUDIO_PORT}\n  API     http://localhost:${API_PORT}\n`);
