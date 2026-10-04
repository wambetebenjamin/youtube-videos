import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const API = `http://127.0.0.1:${process.env.API_PORT || 8787}`;

// When the studio is viewed through an HTTPS preview proxy (Arena, Codespaces,
// ngrok…) the HMR socket has to be told which port the *browser* should use.
const hmrClientPort = process.env.HMR_CLIENT_PORT ? Number(process.env.HMR_CLIENT_PORT) : null;

export default defineConfig({
  root: path.join(root, 'src/studio'),
  publicDir: false,
  plugins: [react()],
  resolve: {
    alias: {
      '@core': path.join(root, 'src/core'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: Number(process.env.STUDIO_PORT || 5173),
    strictPort: true,
    allowedHosts: true,
    fs: { allow: [root] },
    hmr: hmrClientPort ? { clientPort: hmrClientPort, protocol: process.env.HMR_PROTOCOL || 'wss' } : true,
    proxy: Object.fromEntries(
      ['/api', '/media', '/assets', '/fonts'].map((p) => [p, { target: API, changeOrigin: false }]),
    ),
  },
  build: {
    outDir: path.join(root, 'dist'),
    emptyOutDir: true,
  },
});
