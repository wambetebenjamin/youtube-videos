import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';

const here = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(here, '..', '..');

export const ASSETS_DIR = path.join(ROOT, 'assets');
export const FONTS_DIR = path.join(ASSETS_DIR, 'fonts');
export const BRAND_DIR = path.join(ASSETS_DIR, 'brand');
export const GRAPHICS_DIR = path.join(ASSETS_DIR, 'graphics');

export const MEDIA_DIR = path.join(ROOT, 'media');
export const SOURCE_DIR = path.join(MEDIA_DIR, 'source');
export const MUSIC_DIR = path.join(MEDIA_DIR, 'music');
export const IMAGES_DIR = path.join(MEDIA_DIR, 'images');
export const EXPORTS_DIR = path.join(MEDIA_DIR, 'exports');

export const PROJECTS_DIR = path.join(ROOT, 'projects');
export const TEMPLATES_DIR = path.join(ROOT, 'templates');
export const PRESETS_DIR = path.join(ROOT, 'presets');
export const CANVA_DIR = path.join(PRESETS_DIR, 'canva');
export const CONTENT_DIR = path.join(ROOT, 'content');
export const QUOTES_DIR = path.join(CONTENT_DIR, 'quotes');
export const IMPORTS_DIR = path.join(ROOT, 'imports');
export const CACHE_DIR = path.join(ROOT, '.cache');

export const ALL_DIRS = [
  ASSETS_DIR, FONTS_DIR, BRAND_DIR, GRAPHICS_DIR,
  MEDIA_DIR, SOURCE_DIR, MUSIC_DIR, IMAGES_DIR, EXPORTS_DIR,
  PROJECTS_DIR, TEMPLATES_DIR, PRESETS_DIR, CANVA_DIR, CONTENT_DIR, QUOTES_DIR,
  IMPORTS_DIR, CACHE_DIR,
];

export function ensureDirs() {
  for (const d of ALL_DIRS) fs.mkdirSync(d, { recursive: true });
}

/** Resolve a repo-relative path ("media/source/a.mp4") to an absolute one, safely. */
export function resolveRepoPath(rel) {
  if (!rel) return null;
  const abs = path.resolve(ROOT, rel);
  if (!abs.startsWith(ROOT)) throw new Error(`path escapes repository: ${rel}`);
  return abs;
}

/** Inverse of resolveRepoPath. */
export function toRepoPath(abs) {
  return path.relative(ROOT, abs).split(path.sep).join('/');
}
