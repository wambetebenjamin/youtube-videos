/**
 * Layer → SVG.
 *
 * This is the single source of truth for how a layer looks. The browser
 * drops the same SVG straight into the DOM on top of the <video>; the
 * renderer hands it to resvg to get a PNG that FFmpeg composites. One
 * generator, two consumers — so the preview is not an approximation.
 */
import { layoutText, layoutBox, normalizeAnchor } from './layout.js';
import { stateAt } from './timeline.js';

export function escapeXml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

const n = (v) => (Math.round(Number(v) * 100) / 100 || 0).toString();

/**
 * ctx = {
 *   canvas: {width,height},
 *   metrics: metricsTable,
 *   familyName: (familyId) => 'Montserrat',
 *   imageHref: (repoPath) => url or data: URI,
 * }
 */

function textStyleAttrs(style, ctx, fontPx, letterSpacing) {
  const family = ctx.familyName ? ctx.familyName(style.fontFamily) : style.fontFamily;
  const attrs = [
    `font-family="${escapeXml(family)}"`,
    `font-size="${n(fontPx)}"`,
    `font-weight="${style.fontWeight || 400}"`,
  ];
  if (style.italic) attrs.push('font-style="italic"');
  if (letterSpacing) attrs.push(`letter-spacing="${n(letterSpacing * fontPx)}"`);
  return attrs.join(' ');
}

function dropShadowFilter(id, shadow, fontPx) {
  if (!shadow || shadow.enabled === false) return '';
  const blur = (shadow.blur ?? 0.08) * fontPx;
  const dx = (shadow.dx ?? 0) * fontPx;
  const dy = (shadow.dy ?? 0.03) * fontPx;
  return (
    `<filter id="${id}" x="-30%" y="-30%" width="160%" height="160%" color-interpolation-filters="sRGB">` +
    `<feDropShadow dx="${n(dx)}" dy="${n(dy)}" stdDeviation="${n(blur / 2)}" ` +
    `flood-color="${escapeXml(shadow.color || '#000000')}" flood-opacity="${shadow.opacity ?? 0.5}"/>` +
    `</filter>`
  );
}

/* ------------------------------------------------------------------ *
 * Text / quote layers
 * ------------------------------------------------------------------ */
function textLayerBody(layer, ctx, uid) {
  const style = layer.style || {};
  const L = layoutText(layer, ctx.canvas, ctx.metrics);
  const defs = [];
  const body = [];

  const shadowId = `sh-${uid}`;
  const shadow = dropShadowFilter(shadowId, style.shadow, L.fontPx);
  if (shadow) defs.push(shadow);

  // Background plate(s)
  const bg = style.background;
  if (bg && bg.mode && bg.mode !== 'none' && bg.color) {
    const padX = (bg.paddingX ?? bg.padding ?? 0.35) * L.fontPx;
    const padY = (bg.paddingY ?? bg.padding ?? 0.22) * L.fontPx;
    const radius = (bg.radius ?? 0.12) * L.fontPx;
    const opacity = bg.opacity ?? 1;
    if (bg.mode === 'lines') {
      for (const line of L.lines) {
        if (!line.text.trim()) continue;
        body.push(
          `<rect x="${n(line.x - padX)}" y="${n(line.top + (line.height - line.fontPx * 1.16) / 2 - padY * 0.2)}" ` +
          `width="${n(line.width + padX * 2)}" height="${n(line.fontPx * 1.16 + padY * 1.2)}" ` +
          `rx="${n(radius)}" fill="${escapeXml(bg.color)}" fill-opacity="${opacity}"/>`,
        );
      }
    } else {
      const r = bg.mode === 'frame' ? L.frame : L.content;
      body.push(
        `<rect x="${n(r.left - padX)}" y="${n(r.top - padY)}" width="${n(r.width + padX * 2)}" ` +
        `height="${n(r.height + padY * 2)}" rx="${n(radius)}" ` +
        `fill="${escapeXml(bg.color)}" fill-opacity="${opacity}"/>`,
      );
    }
  }

  // Lines: stroke pass underneath, fill pass on top.
  const stroke = style.stroke;
  const textNodes = [];
  for (const line of L.lines) {
    if (!line.text) continue;
    const lineStyle = line.kind === 'attribution' ? { ...style, ...(style.attribution || {}) } : style;
    const attrs = textStyleAttrs(lineStyle, ctx, line.fontPx, line.letterSpacing);
    const common = `x="${n(line.x)}" y="${n(line.baseline)}" ${attrs}`;
    if (stroke && stroke.width > 0 && stroke.color) {
      textNodes.push(
        `<text ${common} fill="none" stroke="${escapeXml(stroke.color)}" ` +
        `stroke-width="${n(stroke.width * line.fontPx)}" stroke-linejoin="round" ` +
        `stroke-opacity="${stroke.opacity ?? 1}">${escapeXml(line.text)}</text>`,
      );
    }
    const fill = lineStyle.color || '#ffffff';
    textNodes.push(
      `<text ${common} fill="${escapeXml(fill)}" fill-opacity="${lineStyle.fillOpacity ?? 1}">${escapeXml(line.text)}</text>`,
    );
  }

  body.push(shadow ? `<g filter="url(#${shadowId})">${textNodes.join('')}</g>` : textNodes.join(''));
  return { defs: defs.join(''), body: body.join(''), layout: L };
}

/* ------------------------------------------------------------------ *
 * Shape layers
 * ------------------------------------------------------------------ */
function shapeLayerBody(layer, ctx, uid) {
  const { canvas } = ctx;
  const s = layer.shape || {};
  const kind = s.kind || 'rect';
  const fill = s.color || '#000000';
  const opacity = s.opacity ?? 1;
  const defs = [];
  let body = '';

  if (kind === 'scrim-bottom' || kind === 'scrim-top') {
    const id = `grad-${uid}`;
    const height = (s.size ?? 0.35) * canvas.height;
    const top = kind === 'scrim-bottom' ? canvas.height - height : 0;
    const stops =
      kind === 'scrim-bottom'
        ? `<stop offset="0" stop-color="${escapeXml(fill)}" stop-opacity="0"/><stop offset="1" stop-color="${escapeXml(fill)}" stop-opacity="${opacity}"/>`
        : `<stop offset="0" stop-color="${escapeXml(fill)}" stop-opacity="${opacity}"/><stop offset="1" stop-color="${escapeXml(fill)}" stop-opacity="0"/>`;
    defs.push(`<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">${stops}</linearGradient>`);
    body = `<rect x="0" y="${n(top)}" width="${n(canvas.width)}" height="${n(height)}" fill="url(#${id})"/>`;
  } else if (kind === 'wash') {
    body = `<rect x="0" y="0" width="${n(canvas.width)}" height="${n(canvas.height)}" fill="${escapeXml(fill)}" fill-opacity="${opacity}"/>`;
  } else if (kind === 'ellipse') {
    const r = layoutBox(layer, canvas);
    body = `<ellipse cx="${n(r.left + r.width / 2)}" cy="${n(r.top + r.height / 2)}" rx="${n(r.width / 2)}" ry="${n(r.height / 2)}" fill="${escapeXml(fill)}" fill-opacity="${opacity}"/>`;
  } else {
    const r = layoutBox(layer, canvas);
    const radius = (s.radius ?? 0) * Math.min(r.width, r.height);
    body = `<rect x="${n(r.left)}" y="${n(r.top)}" width="${n(r.width)}" height="${n(r.height)}" rx="${n(radius)}" fill="${escapeXml(fill)}" fill-opacity="${opacity}"/>`;
  }
  return { defs: defs.join(''), body };
}

/* ------------------------------------------------------------------ *
 * Image layers
 * ------------------------------------------------------------------ */
function imageLayerBody(layer, ctx, uid) {
  const href = ctx.imageHref ? ctx.imageHref(layer.src) : layer.src;
  if (!href) return { defs: '', body: '' };
  const r = layoutBox(layer, ctx.canvas);
  const fit = layer.fit === 'cover' ? 'xMidYMid slice' : 'xMidYMid meet';
  const radius = (layer.radius ?? 0) * Math.min(r.width, r.height);
  const defs = [];
  let clip = '';
  if (radius > 0) {
    const id = `clip-${uid}`;
    defs.push(`<clipPath id="${id}"><rect x="${n(r.left)}" y="${n(r.top)}" width="${n(r.width)}" height="${n(r.height)}" rx="${n(radius)}"/></clipPath>`);
    clip = ` clip-path="url(#${id})"`;
  }
  const body =
    `<image href="${escapeXml(href)}" xlink:href="${escapeXml(href)}" x="${n(r.left)}" y="${n(r.top)}" ` +
    `width="${n(r.width)}" height="${n(r.height)}" preserveAspectRatio="${fit}" ` +
    `opacity="${layer.style?.opacity ?? 1}"${clip}/>`;
  return { defs: defs.join(''), body };
}

/* ------------------------------------------------------------------ *
 * Progress bar — a solid bar the renderer can animate by sliding.
 * ------------------------------------------------------------------ */
function progressLayerBody(layer, ctx, progress = 1) {
  const { canvas } = ctx;
  const p = layer.progress || {};
  const height = (p.thickness ?? 0.006) * canvas.height;
  const y = (p.y ?? 0.985) * canvas.height - height / 2;
  const track = p.trackColor
    ? `<rect x="0" y="${n(y)}" width="${n(canvas.width)}" height="${n(height)}" fill="${escapeXml(p.trackColor)}" fill-opacity="${p.trackOpacity ?? 0.25}"/>`
    : '';
  const barWidth = canvas.width * Math.max(0, Math.min(1, progress));
  const bar = `<rect x="0" y="${n(y)}" width="${n(barWidth)}" height="${n(height)}" fill="${escapeXml(p.color || '#ffffff')}" fill-opacity="${p.opacity ?? 1}"/>`;
  return { defs: '', body: track + bar };
}

/* ------------------------------------------------------------------ *
 * Public API
 * ------------------------------------------------------------------ */
export function layerBody(layer, ctx, opts = {}) {
  const uid = (layer.id || 'l').replace(/[^a-zA-Z0-9_-]/g, '');
  switch (layer.type) {
    case 'text':
    case 'quote':
      return textLayerBody(layer, ctx, uid);
    case 'shape':
      return shapeLayerBody(layer, ctx, uid);
    case 'image':
      return imageLayerBody(layer, ctx, uid);
    case 'progress':
      return progressLayerBody(layer, ctx, opts.progress ?? 1);
    default:
      return { defs: '', body: '' };
  }
}

function wrap(canvas, defs, body) {
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" ` +
    `width="${canvas.width}" height="${canvas.height}" viewBox="0 0 ${canvas.width} ${canvas.height}">` +
    (defs ? `<defs>${defs}</defs>` : '') +
    body +
    `</svg>`
  );
}

/**
 * One layer, at rest (no animation offsets) — what the renderer rasterises.
 * The layer's own static opacity is baked in here; animated opacity is
 * applied later by FFmpeg's alpha fade.
 */
export function layerToSvg(layer, ctx, opts = {}) {
  const { defs, body } = layerBody(layer, ctx, opts);
  const op = layer.style?.opacity ?? 1;
  const inner = op < 1 ? `<g opacity="${Math.round(op * 1000) / 1000}">${body}</g>` : body;
  return wrap(ctx.canvas, defs, inner);
}

/** Every visible layer at time t, with animation applied — the live preview. */
export function compositeSvg(project, t, ctx, duration) {
  const defs = [];
  const parts = [];
  const layers = (project.layers || []).filter((l) => l.enabled !== false);

  for (const layer of layers) {
    const st = stateAt(layer, t, ctx.canvas, duration);
    if (!st.visible || st.opacity <= 0.001) continue;
    const progress = duration > 0 ? t / duration : 0;
    const { defs: d, body } = layerBody(layer, ctx, { progress });
    if (!body) continue;
    if (d) defs.push(d);

    const transforms = [];
    if (st.dx || st.dy) transforms.push(`translate(${n(st.dx)} ${n(st.dy)})`);
    if (st.scale !== 1) {
      const cx = ctx.canvas.width / 2;
      const cy = ctx.canvas.height / 2;
      transforms.push(`translate(${n(cx)} ${n(cy)}) scale(${n(st.scale)}) translate(${n(-cx)} ${n(-cy)})`);
    }
    const tAttr = transforms.length ? ` transform="${transforms.join(' ')}"` : '';
    parts.push(`<g opacity="${Math.round(st.opacity * 1000) / 1000}"${tAttr}>${body}</g>`);
  }
  return wrap(ctx.canvas, defs.join(''), parts.join(''));
}

export { layoutText, layoutBox, normalizeAnchor };
