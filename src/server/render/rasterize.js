import fs from 'node:fs';
import path from 'node:path';
import { Resvg } from '@resvg/resvg-js';
import { layerToSvg } from '../../core/svg.js';
import { loadFonts } from '../lib/fonts.js';
import { resolveRepoPath } from '../../core/paths.js';

const MIME = {
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.webp': 'image/webp', '.gif': 'image/gif', '.svg': 'image/svg+xml',
};

/** Images get inlined as data URIs so resvg never has to touch the network. */
export function makeImageResolver() {
  const seen = new Map();
  return (src) => {
    if (!src) return null;
    if (src.startsWith('data:')) return src;
    if (seen.has(src)) return seen.get(src);
    try {
      const abs = resolveRepoPath(src);
      if (!abs || !fs.existsSync(abs)) return null;
      const ext = path.extname(abs).toLowerCase();
      const uri = `data:${MIME[ext] || 'image/png'};base64,${fs.readFileSync(abs).toString('base64')}`;
      seen.set(src, uri);
      return uri;
    } catch {
      return null;
    }
  };
}

export function makeRenderContext(canvas) {
  const fonts = loadFonts();
  return {
    canvas,
    metrics: fonts.metrics,
    familyName: fonts.familyName,
    imageHref: makeImageResolver(),
    _fonts: fonts,
  };
}

/** SVG string → PNG buffer, with the repo's own fonts (never system fonts). */
export function svgToPng(svg, ctx) {
  const fonts = ctx?._fonts || loadFonts();
  const resvg = new Resvg(svg, {
    background: 'rgba(0,0,0,0)',
    fitTo: { mode: 'original' },
    font: {
      loadSystemFonts: false,
      fontFiles: fonts.files,
      defaultFontFamily: fonts.defaultFamily,
    },
    logLevel: 'error',
  });
  return resvg.render().asPng();
}

/** Rasterise one layer to a transparent full-canvas PNG on disk. */
export function rasterizeLayer(layer, ctx, outPath, opts = {}) {
  const svg = layerToSvg(layer, ctx, opts);
  const png = svgToPng(svg, ctx);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, png);
  return outPath;
}
