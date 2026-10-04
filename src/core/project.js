/**
 * The project file format.
 *
 * A project is one JSON file in projects/ — plain text, diffable, reviewable
 * in a pull request. It points at a clip in media/source, some music in
 * media/music, and a stack of layers. Nothing in here is binary, which is
 * the whole trick: the repo stays reviewable while the videos stay heavy.
 */
import { canvasOf, getFormat } from './formats.js';
import { contentDuration } from './timeline.js';

export const SPEC_VERSION = 1;

export const LAYER_TYPES = ['text', 'quote', 'image', 'shape', 'progress'];

/* ------------------------------------------------------------------ *
 * Text style presets — the vocabulary the studio and the Canva importer
 * both speak.
 * ------------------------------------------------------------------ */
export const STYLE_PRESETS = {
  hook: {
    label: 'Hook (big impact)',
    style: {
      fontFamily: 'anton', fontWeight: 400, fontSize: 0.075, color: '#ffffff',
      lineHeight: 1.05, letterSpacing: -0.005, textTransform: 'uppercase',
      stroke: { color: '#000000', width: 0.035, opacity: 1 },
      shadow: { color: '#000000', blur: 0.12, dx: 0, dy: 0.02, opacity: 0.45 },
    },
    box: { width: 0.86, align: 'center', anchor: 'center', x: 0.5, y: 0.34 },
  },
  caption: {
    label: 'Caption (subtitle style)',
    style: {
      fontFamily: 'montserrat', fontWeight: 700, fontSize: 0.038, color: '#ffffff',
      lineHeight: 1.25, letterSpacing: 0,
      shadow: { color: '#000000', blur: 0.18, dx: 0, dy: 0.03, opacity: 0.7 },
    },
    box: { width: 0.82, align: 'center', anchor: 'bottom-center', x: 0.5, y: 0.78 },
  },
  highlight: {
    label: 'Highlighted lines',
    style: {
      fontFamily: 'montserrat', fontWeight: 800, fontSize: 0.045, color: '#111111',
      lineHeight: 1.45, textTransform: 'uppercase',
      background: { mode: 'lines', color: '#f5e663', opacity: 1, paddingX: 0.3, paddingY: 0.18, radius: 0.1 },
    },
    box: { width: 0.8, align: 'center', anchor: 'center', x: 0.5, y: 0.5 },
  },
  quote: {
    label: 'Quote (serif)',
    style: {
      fontFamily: 'playfair-display', fontWeight: 400, italic: true, fontSize: 0.05,
      color: '#ffffff', lineHeight: 1.32,
      shadow: { color: '#000000', blur: 0.2, dx: 0, dy: 0.02, opacity: 0.55 },
      attribution: {
        fontFamily: 'montserrat', fontWeight: 600, italic: false, fontSize: 0.022,
        letterSpacing: 0.14, textTransform: 'uppercase', gap: 0.75, color: '#ffffff',
      },
    },
    box: { width: 0.8, align: 'center', anchor: 'center', x: 0.5, y: 0.46 },
  },
  'quote-card': {
    label: 'Quote card (plate)',
    style: {
      fontFamily: 'dm-serif-display', fontWeight: 400, fontSize: 0.046, color: '#101010',
      lineHeight: 1.3,
      background: { mode: 'content', color: '#ffffff', opacity: 0.94, paddingX: 0.8, paddingY: 0.7, radius: 0.3 },
      attribution: {
        fontFamily: 'montserrat', fontWeight: 600, fontSize: 0.02, letterSpacing: 0.16,
        textTransform: 'uppercase', gap: 0.8, color: '#6b6b6b',
      },
    },
    box: { width: 0.72, align: 'center', anchor: 'center', x: 0.5, y: 0.5 },
  },
  'lower-third': {
    label: 'Lower third',
    style: {
      fontFamily: 'inter', fontWeight: 600, fontSize: 0.028, color: '#ffffff',
      lineHeight: 1.25,
      background: { mode: 'content', color: '#000000', opacity: 0.55, paddingX: 0.6, paddingY: 0.4, radius: 0.25 },
    },
    box: { width: 0.7, align: 'left', anchor: 'bottom-left', x: 0.06, y: 0.88 },
  },
  handle: {
    label: 'Handle / watermark',
    style: {
      fontFamily: 'montserrat', fontWeight: 600, fontSize: 0.018, color: '#ffffff',
      letterSpacing: 0.1, opacity: 0.8, textTransform: 'uppercase',
      shadow: { color: '#000000', blur: 0.2, dx: 0, dy: 0.02, opacity: 0.5 },
    },
    box: { width: 0.6, align: 'center', anchor: 'top-center', x: 0.5, y: 0.08 },
  },
};

export const DEFAULT_TEXT_STYLE = {
  fontFamily: 'montserrat',
  fontWeight: 700,
  italic: false,
  fontSize: 0.05,
  color: '#ffffff',
  opacity: 1,
  lineHeight: 1.2,
  letterSpacing: 0,
  textTransform: 'none',
  maxLines: 0,
  stroke: null,
  shadow: null,
  background: null,
};

export const DEFAULT_BOX = {
  x: 0.5,
  y: 0.5,
  width: 0.8,
  height: 0.12,
  align: 'center',
  anchor: 'center',
};

let seq = 0;
export function newId(prefix = 'l') {
  seq = (seq + 1) % 100000;
  return `${prefix}${Date.now().toString(36).slice(-5)}${seq.toString(36)}`;
}

export function createLayer(type = 'text', patch = {}) {
  const base = {
    id: newId(type[0]),
    type,
    name: '',
    enabled: true,
    start: 0,
    end: 0, // 0 / null = until the end of the video
    animIn: { type: 'fade-up', duration: 0.45, easing: 'easeOut', distance: 0.035 },
    animOut: { type: 'fade', duration: 0.35, easing: 'easeOut', distance: 0.02 },
  };

  // Drop undefined keys so `{...patch}` can't blank out a generated id.
  patch = Object.fromEntries(Object.entries(patch || {}).filter(([, v]) => v !== undefined));

  if (type === 'text' || type === 'quote') {
    const preset = patch.preset && STYLE_PRESETS[patch.preset];
    return {
      ...base,
      text: type === 'quote' ? 'Discipline is choosing what you want most\nover what you want now.' : 'Your text here',
      attribution: type === 'quote' ? 'Unknown' : '',
      ...(preset ? { style: structuredClone(preset.style), box: { ...DEFAULT_BOX, ...preset.box } } : { style: structuredClone(DEFAULT_TEXT_STYLE), box: { ...DEFAULT_BOX } }),
      ...stripPreset(patch),
    };
  }
  if (type === 'image') {
    return { ...base, src: '', fit: 'contain', radius: 0, style: { opacity: 1 }, box: { ...DEFAULT_BOX, width: 0.3, height: 0.15, anchor: 'top-left', x: 0.06, y: 0.06 }, ...stripPreset(patch) };
  }
  if (type === 'shape') {
    return { ...base, shape: { kind: 'scrim-bottom', color: '#000000', opacity: 0.7, size: 0.35, radius: 0 }, box: { ...DEFAULT_BOX }, style: { opacity: 1 }, ...stripPreset(patch) };
  }
  if (type === 'progress') {
    return { ...base, progress: { color: '#ffffff', thickness: 0.005, y: 0.985, trackColor: '#ffffff', trackOpacity: 0.25, opacity: 1 }, animIn: { type: 'none' }, animOut: { type: 'none' }, ...stripPreset(patch) };
  }
  return { ...base, ...stripPreset(patch) };
}

function stripPreset(patch) {
  const { preset, ...rest } = patch || {};
  return rest;
}

export function createProject(patch = {}) {
  const format = patch.format || 'reel';
  const f = getFormat(format);
  return {
    specVersion: SPEC_VERSION,
    id: patch.id || newId('p'),
    name: patch.name || 'Untitled',
    format,
    canvas: { width: f.width, height: f.height, fps: f.fps, background: '#000000' },
    source: {
      clip: null,
      trim: { start: 0, end: null },
      fit: 'cover',
      backdrop: 'blur',
      zoom: 1,
      offsetX: 0,
      offsetY: 0,
      speed: 1,
      volume: 1,
      adjust: { brightness: 0, contrast: 1, saturation: 1 },
    },
    audio: { music: [] },
    layers: [],
    export: { preset: 'social-hq', suffix: '' },
    meta: { createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    ...patch,
  };
}

export function createMusicTrack(patch = {}) {
  return {
    id: newId('m'),
    src: '',
    enabled: true,
    start: 0,       // when it starts on the output timeline
    offset: 0,      // where to start inside the music file
    volume: 0.35,
    fadeIn: 1,
    fadeOut: 2,
    loop: true,
    duck: false,    // duck under the clip's own audio
    ...patch,
  };
}

/* ------------------------------------------------------------------ *
 * Normalisation: fill in everything the editor or renderer can assume.
 * ------------------------------------------------------------------ */
export function normalizeProject(raw) {
  const p = { ...createProject(), ...(raw || {}) };
  p.specVersion = SPEC_VERSION;
  p.canvas = { ...canvasOf(p) };
  p.source = {
    ...createProject().source,
    ...(raw?.source || {}),
    trim: { start: 0, end: null, ...(raw?.source?.trim || {}) },
    adjust: { brightness: 0, contrast: 1, saturation: 1, ...(raw?.source?.adjust || {}) },
  };
  p.audio = { music: (raw?.audio?.music || []).map((m) => ({ ...createMusicTrack(), ...m })) };
  p.layers = (raw?.layers || []).map((l) => normalizeLayer(l));
  p.export = { preset: 'social-hq', suffix: '', ...(raw?.export || {}) };
  p.meta = { createdAt: new Date().toISOString(), ...(raw?.meta || {}), updatedAt: new Date().toISOString() };
  return p;
}

export function normalizeLayer(l) {
  const base = createLayer(l.type || 'text');
  const merged = {
    ...base,
    ...l,
    animIn: { ...base.animIn, ...(l.animIn || {}) },
    animOut: { ...base.animOut, ...(l.animOut || {}) },
  };
  // Callers clone layers with `id: undefined` to request a fresh one
  // (duplicate, "apply Canva layers", batch) — make sure they get it.
  if (!merged.id) merged.id = base.id;
  if (merged.type === 'text' || merged.type === 'quote') {
    merged.style = { ...DEFAULT_TEXT_STYLE, ...(l.style || {}) };
    merged.box = { ...DEFAULT_BOX, ...(l.box || {}) };
  } else {
    merged.style = { opacity: 1, ...(l.style || {}) };
    merged.box = { ...DEFAULT_BOX, ...(l.box || {}) };
  }
  return merged;
}

/**
 * How long the output is.
 * `sourceDuration` comes from ffprobe (server) or the <video> element (browser).
 */
export function resolveDuration(project, sourceDuration = 0) {
  const t = project?.source?.trim || {};
  const speed = project?.source?.speed || 1;
  const start = Math.max(0, t.start || 0);
  const end = t.end && t.end > start ? t.end : sourceDuration || 0;
  const clipLen = Math.max(0, (end - start)) / speed;
  if (clipLen > 0) return clipLen;
  // No clip yet: fall back to whatever the layers need, so an empty project
  // still has a usable timeline to design against.
  return Math.max(contentDuration(project), 10);
}

export function projectSummary(p) {
  return {
    id: p.id,
    name: p.name,
    format: p.format,
    clip: p.source?.clip || null,
    layers: (p.layers || []).length,
    music: (p.audio?.music || []).length,
    updatedAt: p.meta?.updatedAt,
  };
}
