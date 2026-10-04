import fs from 'node:fs';
import path from 'node:path';
import { FONTS_DIR, ROOT } from '../../core/paths.js';

let cache = null;

export function loadFonts({ force = false } = {}) {
  if (cache && !force) return cache;

  const manifestPath = path.join(FONTS_DIR, 'fonts.json');
  const metricsPath = path.join(FONTS_DIR, 'metrics', 'metrics.json');

  const manifest = fs.existsSync(manifestPath)
    ? JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
    : { families: [] };
  const metrics = fs.existsSync(metricsPath)
    ? JSON.parse(fs.readFileSync(metricsPath, 'utf8'))
    : {};

  const nameById = new Map(manifest.families.map((f) => [f.id, f.name]));
  const files = [];
  for (const fam of manifest.families) {
    for (const face of fam.faces) files.push(path.resolve(ROOT, face.file));
  }

  cache = {
    manifest,
    metrics,
    files,
    familyName: (id) => nameById.get(id) || id || 'Montserrat',
    defaultFamily: nameById.get('montserrat') || manifest.families[0]?.name || 'sans-serif',
  };
  return cache;
}

export function invalidateFonts() {
  cache = null;
}
