/**
 * Canva → template importer.
 *
 * Three ways in, in descending order of how much we can learn:
 *
 *   1. PDF export   (Share ▸ Download ▸ PDF Standard)  — exact fonts,
 *      exact sizes, exact positions, fill colours. The good one.
 *   2. SVG export   (Share ▸ Download ▸ SVG)           — same, if your
 *      plan offers SVG.
 *   3. A share URL / saved HTML                        — title, canvas
 *      size and the preview image only; Canva keeps the document itself
 *      behind its API.
 *
 * Whatever comes in, the output is the same: a preset in presets/canva/
 * that maps every text block to a font in assets/fonts, a role
 * (hook / quote / caption / handle …) and a normalised position, plus a
 * ready-to-drop layer stack.
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { CANVA_DIR, IMPORTS_DIR, resolveRepoPath, toRepoPath, ensureDirs } from '../../core/paths.js';
import { loadFonts } from './fonts.js';
import { FFMPEG } from './ffmpeg.js';
import { createLayer } from '../../core/project.js';
import { getMetrics, measureText } from '../../core/layout.js';

const execFileAsync = promisify(execFile);

/* ------------------------------------------------------------------ *
 * Font matching
 * ------------------------------------------------------------------ */

/** Canva ships a lot of licensed faces we can't redistribute — map them. */
const SUBSTITUTIONS = {
  'canva sans': 'poppins',
  'canva sans display': 'poppins',
  'canva serif': 'lora',
  'glacial indifference': 'montserrat',
  'league spartan': 'montserrat',
  'open sans': 'inter',
  'source sans pro': 'inter',
  'roboto': 'inter',
  'helvetica': 'inter',
  'helvetica neue': 'inter',
  'arial': 'inter',
  'nunito': 'poppins',
  'quicksand': 'poppins',
  'raleway': 'montserrat',
  'futura': 'poppins',
  'avenir': 'montserrat',
  'gotham': 'montserrat',
  'proxima nova': 'montserrat',
  'garet': 'poppins',
  'mulish': 'inter',
  'bodoni': 'dm-serif-display',
  'didot': 'playfair-display',
  'georgia': 'lora',
  'times': 'lora',
  'times new roman': 'lora',
  'garamond': 'lora',
  'merriweather': 'lora',
  'brittany': 'caveat',
  'sacramento': 'caveat',
  'dancing script': 'caveat',
  'great vibes': 'caveat',
  'impact': 'anton',
  'haettenschweiler': 'anton',
  'bebas': 'bebas-neue',
  'oswald': 'oswald',
  'archivo': 'archivo-black',
};

const WEIGHT_WORDS = [
  [/(black|heavy|ultra ?bold|extra ?bold)/i, 800],
  [/(semi ?bold|demi ?bold)/i, 600],
  [/bold/i, 700],
  [/medium/i, 500],
  [/(light|thin|hairline)/i, 300],
];

const norm = (s) => String(s || '')
  .replace(/^[A-Z]{6}\+/, '')            // PDF subset prefix: ABCDEF+Montserrat
  .replace(/[_]/g, ' ')
  .replace(/\s*(MT|PS|Std|Pro)\b/gi, '')
  .trim();

/** "PlayfairDisplay" → "Playfair Display", "DMSerifDisplay" → "DM Serif Display". */
const decamel = (s) => String(s || '')
  .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
  .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
  .replace(/\s+/g, ' ')
  .trim();

/** Split "Montserrat-ExtraBoldItalic" into family + weight + italic. */
export function parseFontName(raw) {
  const cleaned = norm(raw);
  const [familyPart, stylePart = ''] = cleaned.split(/[-,]/);
  const styleText = `${stylePart} ${cleaned}`;
  let weight = 400;
  for (const [re, w] of WEIGHT_WORDS) {
    if (re.test(styleText)) { weight = w; break; }
  }
  const italic = /italic|oblique/i.test(styleText);

  // Keep both readings: "ArchivoBlack" is a family in its own right, while
  // "Montserrat-Black" is Montserrat at weight 900.
  const full = decamel(familyPart);
  const stripped = full
    .replace(/\b(black|heavy|ultra ?bold|extra ?bold|semi ?bold|demi ?bold|bold|medium|light|thin|regular|italic|oblique)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  return { family: stripped || full, fullFamily: full, weight, italic, raw };
}

/** Best available face in assets/fonts for a Canva font name. */
export function matchFont(rawName) {
  const fonts = loadFonts();
  const parsed = parseFontName(rawName);
  const byId = new Map(fonts.manifest.families.map((f) => [f.id, f]));
  const byName = new Map(fonts.manifest.families.map((f) => [f.name.toLowerCase(), f]));

  const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  // Try the whole name first ("Archivo Black" is its own family), then the
  // version with weight words removed ("Montserrat Black" → Montserrat).
  const keys = [parsed.fullFamily, parsed.family].filter(Boolean).map((k) => k.toLowerCase());

  let family = null;
  let match = 'exact';
  for (const key of keys) {
    family = byId.get(slug(key)) || byName.get(key);
    if (family) break;
  }
  if (!family) {
    for (const key of keys) {
      const sub = SUBSTITUTIONS[key] || SUBSTITUTIONS[slug(key)];
      if (sub && byId.get(sub)) { family = byId.get(sub); match = 'substitute'; break; }
    }
  }
  if (!family) {
    const key = keys[keys.length - 1] || '';
    // Last resort: guess by shape of the name.
    const serif = /(serif|roman|georgia|times|garamond|playfair|didot|bodoni|slab)/i.test(key);
    const script = /(script|hand|brush|signature|calligraph|cursive)/i.test(key);
    const display = /(display|condensed|impact|poster|headline|black)/i.test(key);
    const want = script ? 'script' : serif ? 'serif' : display ? 'display' : 'sans';
    family = fonts.manifest.families.find((f) => f.category === want) || byId.get('montserrat') || fonts.manifest.families[0];
    match = 'fallback';
  }
  if (!family) return { fontFamily: 'montserrat', fontWeight: 400, italic: false, match: 'none', requested: rawName };

  const available = family.faces.map((f) => f.weight);
  const weight = available.reduce((best, w) => (Math.abs(w - parsed.weight) < Math.abs(best - parsed.weight) ? w : best), available[0]);
  const italic = parsed.italic && family.faces.some((f) => f.style === 'italic' && f.weight === weight);

  return {
    fontFamily: family.id,
    familyName: family.name,
    fontWeight: weight,
    italic,
    match,
    requested: rawName,
    requestedWeight: parsed.weight,
  };
}

/* ------------------------------------------------------------------ *
 * Role inference — "organise fonts in said places"
 * ------------------------------------------------------------------ */
export function inferRole(block, blocks) {
  const sizes = blocks.map((b) => b.fontSize).sort((a, b) => b - a);
  const biggest = sizes[0] || 1;
  const rel = block.fontSize / biggest;
  const y = block.y;
  const len = (block.text || '').length;
  const upper = block.text === block.text.toUpperCase() && /[A-Z]/.test(block.text);

  if (rel < 0.45 && y < 0.18) return 'handle';
  if (rel < 0.5 && y > 0.82) return 'caption';
  if (rel >= 0.85 && len <= 42 && y < 0.5) return 'hook';
  if (rel >= 0.8 && len > 42) return 'quote';
  if (rel >= 0.85) return 'hook';
  if (rel < 0.55 && upper && len < 24) return 'cta';
  if (len > 80) return 'body';
  return 'subhead';
}

const ROLE_TO_PRESET = {
  hook: 'hook',
  quote: 'quote',
  caption: 'caption',
  handle: 'handle',
  cta: 'highlight',
  subhead: 'caption',
  body: 'caption',
};

/* ------------------------------------------------------------------ *
 * Source readers
 * ------------------------------------------------------------------ */

async function readPdf(file) {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const data = new Uint8Array(fs.readFileSync(file));
  const doc = await pdfjs.getDocument({ data, useSystemFonts: false, disableFontFace: true, verbosity: 0 }).promise;

  const pages = [];
  const palette = new Map();

  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const viewport = page.getViewport({ scale: 1 });
    const W = viewport.width;
    const H = viewport.height;

    // Walk the operator list to recover fill colours. Rather than trusting
    // index alignment with getTextContent (pdf.js merges and splits runs
    // differently), record the drawn string alongside its colour and match
    // on the text itself.
    let painted = [];
    try {
      const ops = await page.getOperatorList();
      const OPS = pdfjs.OPS;
      let current = null;
      for (let k = 0; k < ops.fnArray.length; k++) {
        const fn = ops.fnArray[k];
        const args = ops.argsArray[k];
        if (fn === OPS.setFillRGBColor) {
          current = rgbToHex(args[0], args[1], args[2]);
        } else if (fn === OPS.setFillGray) {
          const v = Math.round((args[0] ?? 0) * 255);
          current = rgbToHex(v, v, v);
        } else if (fn === OPS.setFillCMYKColor) {
          current = cmykToHex(args[0], args[1], args[2], args[3]);
        } else if (fn === OPS.showText || fn === OPS.showSpacedText) {
          const glyphs = Array.isArray(args?.[0]) ? args[0] : [];
          const str = glyphs.map((g) => (g && typeof g === 'object' ? (g.unicode ?? '') : '')).join('');
          painted.push({ text: str.replace(/\s+/g, ' ').trim(), color: current });
          if (current) palette.set(current, (palette.get(current) || 0) + 1);
        }
        if (current && (fn === OPS.fill || fn === OPS.eoFill)) {
          palette.set(current, (palette.get(current) || 0) + 1);
        }
      }
    } catch { painted = []; }

    let cursor = 0;
    const colorFor = (str) => {
      const want = String(str).replace(/\s+/g, ' ').trim();
      if (!want) return null;
      for (let k = cursor; k < Math.min(painted.length, cursor + 12); k++) {
        if (painted[k].text === want || (painted[k].text && want.startsWith(painted[k].text))) {
          cursor = k + 1;
          return painted[k].color;
        }
      }
      return painted[cursor]?.text === '' ? painted[cursor]?.color ?? null : null;
    };

    const content = await page.getTextContent({ includeMarkedContent: false });
    const blocks = [];

    for (const item of content.items) {
      if (!item.str || !item.str.trim()) continue;
      const tr = item.transform;
      const fontSizePx = Math.hypot(tr[2], tr[3]) || item.height || 0;
      let fontName = item.fontName;
      try {
        const f = page.commonObjs.get(item.fontName);
        fontName = f?.name || f?.fallbackName || item.fontName;
      } catch { /* keep the internal id */ }

      const x = tr[4];
      const yTop = H - tr[5]; // PDF origin is bottom-left
      blocks.push({
        page: i,
        text: item.str.trim(),
        rawFont: fontName,
        fontSizePx,
        xPx: x,
        yPx: yTop,
        widthPx: item.width || 0,
        color: colorFor(item.str),
      });
    }

    pages.push({ index: i, width: W, height: H, blocks: mergeLines(blocks) });
  }

  return {
    kind: 'pdf',
    pageCount: doc.numPages,
    width: pages[0]?.width || 0,
    height: pages[0]?.height || 0,
    pages,
    palette: [...palette.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([c]) => c),
  };
}

/** PDF text arrives as fragments; stitch ones that share a baseline. */
function mergeLines(blocks) {
  const out = [];
  const sorted = [...blocks].sort((a, b) => a.yPx - b.yPx || a.xPx - b.xPx);
  for (const b of sorted) {
    const prev = out[out.length - 1];
    if (
      prev &&
      Math.abs(prev.yPx - b.yPx) < Math.max(2, b.fontSizePx * 0.3) &&
      prev.rawFont === b.rawFont &&
      Math.abs(prev.fontSizePx - b.fontSizePx) < 0.5 &&
      b.xPx - (prev.xPx + prev.widthPx) < b.fontSizePx * 1.2
    ) {
      const gap = b.xPx - (prev.xPx + prev.widthPx) > b.fontSizePx * 0.18 ? ' ' : '';
      prev.text += gap + b.text;
      prev.widthPx = (b.xPx + b.widthPx) - prev.xPx;
      continue;
    }
    out.push({ ...b });
  }
  return out;
}

function readSvg(file) {
  const svg = fs.readFileSync(file, 'utf8');
  const sizeMatch = /viewBox\s*=\s*"([\d.\-\s]+)"/i.exec(svg);
  let width = Number(/width\s*=\s*"([\d.]+)/i.exec(svg)?.[1]) || 0;
  let height = Number(/height\s*=\s*"([\d.]+)/i.exec(svg)?.[1]) || 0;
  if (sizeMatch) {
    const [, , w, h] = sizeMatch[1].trim().split(/\s+/).map(Number);
    width = width || w;
    height = height || h;
  }

  const blocks = [];
  const textRe = /<text\b([^>]*)>([\s\S]*?)<\/text>/gi;
  let m;
  while ((m = textRe.exec(svg))) {
    const attrs = m[1];
    const inner = m[2];
    const text = inner.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    if (!text) continue;
    const attr = (name) => new RegExp(`${name}\\s*=\\s*"([^"]*)"`, 'i').exec(attrs)?.[1];
    const style = attr('style') || '';
    const styleProp = (name) => new RegExp(`${name}\\s*:\\s*([^;"]+)`, 'i').exec(style)?.[1]?.trim();
    const transform = attr('transform') || '';
    const mt = /matrix\(([^)]+)\)/.exec(transform);
    const tt = /translate\(([^)]+)\)/.exec(transform);
    let x = Number(attr('x')) || 0;
    let y = Number(attr('y')) || 0;
    let scale = 1;
    if (mt) {
      const n = mt[1].split(/[\s,]+/).map(Number);
      x += n[4] || 0; y += n[5] || 0; scale = Math.hypot(n[2] || 0, n[3] || 1) || 1;
    } else if (tt) {
      const n = tt[1].split(/[\s,]+/).map(Number);
      x += n[0] || 0; y += n[1] || 0;
    }
    const fontSize = (parseFloat(attr('font-size') || styleProp('font-size') || '0') || 0) * scale;
    blocks.push({
      page: 1,
      text,
      rawFont: (attr('font-family') || styleProp('font-family') || '').replace(/['"]/g, ''),
      fontSizePx: fontSize,
      xPx: x,
      yPx: y,
      widthPx: null, // measured later, with the matched font's own metrics
      anchor: attr('text-anchor') || styleProp('text-anchor') || 'start',
      color: attr('fill') || styleProp('fill') || null,
      weightHint: attr('font-weight') || styleProp('font-weight') || null,
    });
  }

  const palette = [...new Set((svg.match(/#[0-9a-f]{6}/gi) || []).map((c) => c.toLowerCase()))].slice(0, 8);
  return { kind: 'svg', pageCount: 1, width, height, pages: [{ index: 1, width, height, blocks }], palette };
}

function readHtml(html, url) {
  const meta = (prop) =>
    new RegExp(`<meta[^>]+(?:property|name)=["']${prop}["'][^>]+content=["']([^"']+)["']`, 'i').exec(html)?.[1] ||
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${prop}["']`, 'i').exec(html)?.[1] ||
    null;

  const title = meta('og:title') || /<title>([^<]+)<\/title>/i.exec(html)?.[1] || null;
  const image = meta('og:image');
  const width = Number(meta('og:image:width')) || 0;
  const height = Number(meta('og:image:height')) || 0;

  // Canva sometimes leaves font names in the embedded state blob.
  const fontMentions = [...new Set(
    (html.match(/"fontFamily"\s*:\s*"([^"]{2,40})"/g) || [])
      .map((s) => /"fontFamily"\s*:\s*"([^"]+)"/.exec(s)?.[1])
      .filter(Boolean),
  )].slice(0, 20);

  return {
    kind: 'html',
    pageCount: 1,
    width,
    height,
    title,
    previewImage: image,
    fontMentions,
    pages: [{ index: 1, width, height, blocks: [] }],
    palette: [],
  };
}

/** Dominant colours straight out of FFmpeg's palettegen — no image decoder needed. */
async function imagePalette(file, max = 6) {
  try {
    const { stdout } = await execFileAsync(FFMPEG, [
      '-hide_banner', '-loglevel', 'error', '-i', file,
      '-vf', `palettegen=max_colors=${max}:stats_mode=full`,
      '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-',
    ], { encoding: 'buffer', maxBuffer: 1024 * 1024 });
    const seen = new Set();
    for (let i = 0; i + 2 < stdout.length; i += 3) {
      seen.add(rgbToHex(stdout[i], stdout[i + 1], stdout[i + 2]));
      if (seen.size >= max) break;
    }
    return [...seen];
  } catch {
    return [];
  }
}

function rgbToHex(r, g, b) {
  const h = (v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
  return `#${h(r)}${h(g)}${h(b)}`;
}
function cmykToHex(c, m, y, k) {
  return rgbToHex(255 * (1 - c) * (1 - k), 255 * (1 - m) * (1 - k), 255 * (1 - y) * (1 - k));
}

/* ------------------------------------------------------------------ *
 * Analysis → preset
 * ------------------------------------------------------------------ */
function toTemplate(analysis, { format }) {
  const page = analysis.pages?.[0];
  const W = page?.width || analysis.width || 1080;
  const H = page?.height || analysis.height || 1920;
  const fonts = loadFonts();

  // Both PDF and SVG give a baseline position, and SVG may anchor the run
  // at its middle or end. Normalise everything to a centre point so the
  // layer lands where the eye expects it.
  const blocks = (page?.blocks || []).map((b) => {
    const font = matchFont(b.rawFont);
    const style = { fontFamily: font.fontFamily, fontWeight: font.fontWeight, italic: font.italic };
    const metrics = getMetrics(fonts.metrics, style);
    const widthPx = b.widthPx || measureText(b.text, metrics, b.fontSizePx, 0);

    let left = b.xPx;
    if (b.anchor === 'middle') left = b.xPx - widthPx / 2;
    else if (b.anchor === 'end') left = b.xPx - widthPx;

    const capHalf = ((metrics.capHeight || metrics.unitsPerEm * 0.7) / (metrics.unitsPerEm || 1000)) * b.fontSizePx * 0.5;

    return {
      ...b,
      font,
      widthPx,
      x: W ? (left + widthPx / 2) / W : 0.5,
      y: H ? (b.yPx - capHalf) / H : 0.5,
      fontSize: H ? b.fontSizePx / H : 0.05,
      width: W ? Math.min(0.92, Math.max(0.25, (widthPx / W) * 1.12)) : 0.8,
    };
  });

  const withRoles = blocks.map((b) => ({ ...b, role: inferRole(b, blocks) }));

  const layers = withRoles.map((b, i) => {
    const font = b.font;
    const preset = ROLE_TO_PRESET[b.role] || 'caption';
    const layer = createLayer(b.role === 'quote' ? 'quote' : 'text', { preset });
    layer.name = `${b.role}: ${b.text.slice(0, 24)}`;
    layer.text = b.text;
    if (b.role === 'quote') layer.attribution = '';
    layer.start = Math.round(i * 0.25 * 100) / 100;
    layer.end = 0;
    layer.box = {
      ...layer.box,
      x: round3(Math.min(0.95, Math.max(0.05, b.x))),
      y: round3(Math.min(0.97, Math.max(0.03, b.y))),
      width: round3(b.width),
      anchor: 'center',
      align: 'center',
    };
    layer.style = {
      ...layer.style,
      fontFamily: font.fontFamily,
      fontWeight: font.fontWeight,
      italic: font.italic,
      fontSize: round3(Math.min(0.14, Math.max(0.012, b.fontSize))),
      color: b.color || layer.style.color,
    };
    layer.meta = { canvaRole: b.role, canvaFont: b.rawFont, fontMatch: font.match, page: b.page };
    return layer;
  });

  const fontReport = [];
  const seen = new Map();
  for (const b of withRoles) {
    const key = b.rawFont || 'unknown';
    if (!seen.has(key)) {
      seen.set(key, { canvaFont: key, ...b.font, usedFor: [] });
      fontReport.push(seen.get(key));
    }
    const entry = seen.get(key);
    if (!entry.usedFor.includes(b.role)) entry.usedFor.push(b.role);
  }

  return { layers, fontReport, blocks: withRoles, canvas: { width: W, height: H }, format };
}

const round3 = (v) => Math.round(v * 1000) / 1000;

function guessFormat(w, h) {
  if (!w || !h) return 'reel';
  const r = w / h;
  if (r < 0.65) return 'reel';
  if (r > 1.5) return 'youtube';
  if (Math.abs(r - 1) < 0.08) return 'square';
  return 'portrait45';
}

/**
 * Main entry point.
 * @param {object} input {url, html, file, name}
 */
export async function importCanva(input = {}) {
  ensureDirs();
  const { url, html, name } = input;
  let file = input.file ? resolveRepoPath(input.file) : null;

  let analysis;
  let sourceRef = null;

  if (file) {
    if (!fs.existsSync(file)) throw new Error(`file not found: ${input.file}`);
    sourceRef = toRepoPath(file);
    const ext = path.extname(file).toLowerCase();
    if (ext === '.pdf') analysis = await readPdf(file);
    else if (ext === '.svg') analysis = readSvg(file);
    else if (ext === '.html' || ext === '.htm') analysis = readHtml(fs.readFileSync(file, 'utf8'), url);
    else if (['.png', '.jpg', '.jpeg', '.webp'].includes(ext)) {
      const { probe } = await import('./ffmpeg.js');
      const info = await probe(file).catch(() => ({ width: 0, height: 0 }));
      analysis = {
        kind: 'image', pageCount: 1, width: info.width, height: info.height,
        pages: [{ index: 1, width: info.width, height: info.height, blocks: [] }],
        palette: await imagePalette(file),
      };
    } else throw new Error(`unsupported file type: ${ext} (use .pdf, .svg, .html, .png or .jpg)`);
  } else if (html) {
    analysis = readHtml(html, url);
    sourceRef = url || 'inline-html';
  } else if (url) {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36' },
      redirect: 'follow',
    }).catch((err) => { throw new Error(`could not reach Canva (${err.message}). Save the page HTML or export the design as PDF and pass --file instead.`); });
    if (!res.ok) throw new Error(`Canva returned HTTP ${res.status}. A share link must be set to "anyone with the link can view".`);
    const body = await res.text();
    analysis = readHtml(body, url);
    sourceRef = url;
    const cached = path.join(IMPORTS_DIR, `${slugOf(name || analysis.title || 'canva')}.html`);
    fs.mkdirSync(IMPORTS_DIR, { recursive: true });
    fs.writeFileSync(cached, body);
    analysis.cachedHtml = toRepoPath(cached);
  } else {
    throw new Error('nothing to import: pass a url, a file (pdf/svg/html/png) or raw html');
  }

  const format = input.format || guessFormat(analysis.width, analysis.height);
  const template = toTemplate(analysis, { format });
  const id = slugOf(name || analysis.title || path.basename(sourceRef || 'canva-design', path.extname(sourceRef || '')));

  const preset = {
    id,
    name: name || analysis.title || id,
    importedAt: new Date().toISOString(),
    source: { type: analysis.kind, ref: sourceRef, url: url || null, cachedHtml: analysis.cachedHtml || null },
    design: {
      width: analysis.width,
      height: analysis.height,
      pages: analysis.pageCount,
      suggestedFormat: format,
      previewImage: analysis.previewImage || null,
    },
    palette: analysis.palette || [],
    fonts: template.fontReport,
    textBlocks: template.blocks.map((b) => ({
      text: b.text, role: b.role, canvaFont: b.rawFont, mappedFont: b.font?.fontFamily,
      x: round3(b.x), y: round3(b.y), width: round3(b.width),
      fontSize: round3(b.fontSize), color: b.color,
    })),
    layers: template.layers,
    notes: buildNotes(analysis, template),
  };

  fs.mkdirSync(CANVA_DIR, { recursive: true });
  const out = path.join(CANVA_DIR, `${id}.json`);
  fs.writeFileSync(out, `${JSON.stringify(preset, null, 2)}\n`);
  return { preset, file: toRepoPath(out) };
}

function buildNotes(analysis, template) {
  const notes = [];
  if (analysis.kind === 'html') {
    notes.push('Imported from a share link: Canva only exposes the title, canvas size and preview image. For exact fonts and positions, export the design as PDF and re-import with --file.');
    if (analysis.fontMentions?.length) notes.push(`Font names mentioned in the page: ${analysis.fontMentions.join(', ')}`);
  }
  if (analysis.kind === 'image') {
    notes.push('Imported from an image: canvas size and palette only. Text positions cannot be read from a flat image.');
  }
  const subs = template.fontReport.filter((f) => f.match !== 'exact');
  if (subs.length) {
    notes.push(`Substituted ${subs.length} font(s) not in assets/fonts: ${subs.map((s) => `${s.canvaFont} → ${s.familyName}`).join(', ')}. Drop the real .ttf into assets/fonts and run "npm run fonts" to use the original.`);
  }
  return notes;
}

function slugOf(s) {
  return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 60) || 'canva-design';
}
