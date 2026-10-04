import fs from 'node:fs';
import path from 'node:path';
import {
  SOURCE_DIR, MUSIC_DIR, IMAGES_DIR, EXPORTS_DIR, PROJECTS_DIR, QUOTES_DIR,
  CANVA_DIR, CACHE_DIR, ROOT, toRepoPath, ensureDirs,
} from '../../core/paths.js';
import { probe } from './ffmpeg.js';
import { normalizeProject, projectSummary } from '../../core/project.js';

const VIDEO_EXT = new Set(['.mp4', '.mov', '.m4v', '.webm', '.mkv', '.avi']);
const AUDIO_EXT = new Set(['.mp3', '.m4a', '.aac', '.wav', '.ogg', '.flac', '.opus']);
const IMAGE_EXT = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg']);

const INDEX_FILE = path.join(CACHE_DIR, 'media-index.json');
let index = null;

function loadIndex() {
  if (index) return index;
  try {
    index = JSON.parse(fs.readFileSync(INDEX_FILE, 'utf8'));
  } catch {
    index = {};
  }
  return index;
}

function saveIndex() {
  try {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
    fs.writeFileSync(INDEX_FILE, JSON.stringify(index || {}));
  } catch { /* cache is best-effort */ }
}

/** ffprobe with an mtime+size cache so listing a big library stays instant. */
async function probeCached(abs) {
  const idx = loadIndex();
  const stat = fs.statSync(abs);
  const key = toRepoPath(abs);
  const sig = `${stat.mtimeMs}:${stat.size}`;
  if (idx[key]?.sig === sig) return idx[key].data;
  let data = null;
  try {
    data = await probe(abs);
  } catch (err) {
    data = { error: err.message };
  }
  idx[key] = { sig, data };
  saveIndex();
  return data;
}

async function listDir(dir, extensions, { withProbe = true } = {}) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isFile() || entry.name.startsWith('.')) continue;
    const ext = path.extname(entry.name).toLowerCase();
    if (!extensions.has(ext)) continue;
    const abs = path.join(dir, entry.name);
    const stat = fs.statSync(abs);
    out.push({
      name: entry.name,
      path: toRepoPath(abs),
      url: `/${toRepoPath(abs)}`,
      bytes: stat.size,
      modified: stat.mtimeMs,
      ext,
      info: withProbe ? await probeCached(abs) : null,
    });
  }
  return out.sort((a, b) => b.modified - a.modified);
}

export async function listMedia() {
  ensureDirs();
  const [videos, music, images] = await Promise.all([
    listDir(SOURCE_DIR, VIDEO_EXT),
    listDir(MUSIC_DIR, AUDIO_EXT),
    listDir(IMAGES_DIR, IMAGE_EXT, { withProbe: false }),
  ]);
  return { videos, music, images };
}

export async function listExports() {
  if (!fs.existsSync(EXPORTS_DIR)) return [];
  const files = fs.readdirSync(EXPORTS_DIR)
    .filter((f) => VIDEO_EXT.has(path.extname(f).toLowerCase()));
  const out = [];
  for (const f of files) {
    const abs = path.join(EXPORTS_DIR, f);
    const stat = fs.statSync(abs);
    const poster = abs.replace(/\.[^.]+$/, '.jpg');
    out.push({
      name: f,
      path: toRepoPath(abs),
      url: `/${toRepoPath(abs)}`,
      download: `/api/download/${encodeURIComponent(f)}`,
      bytes: stat.size,
      modified: stat.mtimeMs,
      poster: fs.existsSync(poster) ? `/${toRepoPath(poster)}` : null,
      info: await probeCached(abs),
    });
  }
  return out.sort((a, b) => b.modified - a.modified);
}

/* ------------------------------ projects ------------------------------ */

export function projectPath(id) {
  const safe = String(id).replace(/[^a-zA-Z0-9._-]/g, '');
  if (!safe) throw new Error('invalid project id');
  return path.join(PROJECTS_DIR, `${safe}.json`);
}

export function listProjects() {
  if (!fs.existsSync(PROJECTS_DIR)) return [];
  return fs.readdirSync(PROJECTS_DIR)
    .filter((f) => f.endsWith('.json') && !f.startsWith('_'))
    .map((f) => {
      try {
        const data = JSON.parse(fs.readFileSync(path.join(PROJECTS_DIR, f), 'utf8'));
        return projectSummary(normalizeProject(data));
      } catch (err) {
        return { id: f.replace(/\.json$/, ''), name: f, error: err.message };
      }
    })
    .sort((a, b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')));
}

export function readProject(id) {
  const f = projectPath(id);
  if (!fs.existsSync(f)) return null;
  return normalizeProject(JSON.parse(fs.readFileSync(f, 'utf8')));
}

export function writeProject(id, project) {
  fs.mkdirSync(PROJECTS_DIR, { recursive: true });
  const normalized = normalizeProject({ ...project, id });
  fs.writeFileSync(projectPath(id), `${JSON.stringify(normalized, null, 2)}\n`);
  return normalized;
}

export function deleteProject(id) {
  const f = projectPath(id);
  if (fs.existsSync(f)) fs.unlinkSync(f);
}

/* ------------------------------ content ------------------------------ */

export function listQuotePacks() {
  if (!fs.existsSync(QUOTES_DIR)) return [];
  return fs.readdirSync(QUOTES_DIR)
    .filter((f) => f.endsWith('.json'))
    .map((f) => {
      try {
        const data = JSON.parse(fs.readFileSync(path.join(QUOTES_DIR, f), 'utf8'));
        return { id: f.replace(/\.json$/, ''), ...data };
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

export function listCanvaPresets() {
  if (!fs.existsSync(CANVA_DIR)) return [];
  return fs.readdirSync(CANVA_DIR)
    .filter((f) => f.endsWith('.json'))
    .map((f) => {
      try {
        return JSON.parse(fs.readFileSync(path.join(CANVA_DIR, f), 'utf8'));
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

export { VIDEO_EXT, AUDIO_EXT, IMAGE_EXT, ROOT };
