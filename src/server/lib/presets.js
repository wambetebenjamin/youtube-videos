import fs from 'node:fs';
import path from 'node:path';
import { PRESETS_DIR } from '../../core/paths.js';

export const BUILTIN_EXPORT_PRESETS = {
  draft: {
    id: 'draft', label: 'Draft (fast, half size)', crf: 30, speed: 'veryfast',
    scale: 0.5, fps: 24, audioBitrate: '128k',
    note: 'Quick proof render for checking timing.',
  },
  'social-hq': {
    id: 'social-hq', label: 'Social HQ (recommended)', crf: 20, speed: 'medium',
    scale: 1, audioBitrate: '192k',
    note: 'Instagram / TikTok / Shorts.',
  },
  'social-max': {
    id: 'social-max', label: 'Social max quality', crf: 17, speed: 'slow',
    scale: 1, audioBitrate: '256k',
    note: 'Bigger file, best for heavy motion.',
  },
  'youtube-hq': {
    id: 'youtube-hq', label: 'YouTube HQ', crf: 18, speed: 'slow',
    scale: 1, audioBitrate: '256k',
    note: 'Matches YouTube upload guidance.',
  },
};

function loadFile() {
  const f = path.join(PRESETS_DIR, 'export.json');
  if (!fs.existsSync(f)) return {};
  try {
    const data = JSON.parse(fs.readFileSync(f, 'utf8'));
    return data?.presets || {};
  } catch {
    return {};
  }
}

export function exportPresets() {
  return { ...BUILTIN_EXPORT_PRESETS, ...loadFile() };
}

export function getExportPreset(id) {
  const all = exportPresets();
  return all[id] || all['social-hq'];
}
