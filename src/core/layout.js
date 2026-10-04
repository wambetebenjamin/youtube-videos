/**
 * Text layout.
 *
 * This module decides where every line of text sits — and it runs in both
 * the browser and Node, off the same advance-width tables in
 * assets/fonts/metrics/metrics.json. That means the line breaks you see
 * while scrubbing are literally the line breaks that get burned into the
 * MP4; nothing is re-measured at render time.
 */

export const ANCHORS = [
  'top-left', 'top-center', 'top-right',
  'middle-left', 'center', 'middle-right',
  'bottom-left', 'bottom-center', 'bottom-right',
];

const FALLBACK_METRICS = {
  unitsPerEm: 1000,
  ascent: 800,
  descent: -200,
  lineGap: 0,
  capHeight: 700,
  xHeight: 500,
  defaultAdvance: 500,
  advances: {},
};

/** Key into the metrics table for a given style. */
export function faceKey(style = {}) {
  const family = style.fontFamily || 'montserrat';
  const weight = style.fontWeight || 400;
  return `${family}-${weight}${style.italic ? 'i' : ''}`;
}

/** Pick the closest available face if the exact weight is missing. */
export function resolveFace(metricsTable, style = {}) {
  const want = faceKey(style);
  if (metricsTable?.[want]) return want;

  const family = style.fontFamily || 'montserrat';
  const weight = style.fontWeight || 400;
  const italic = !!style.italic;
  const candidates = Object.keys(metricsTable || {})
    .filter((k) => k.startsWith(`${family}-`))
    .map((k) => {
      const m = /-(\d{3})(i?)$/.exec(k);
      return { key: k, weight: m ? Number(m[1]) : 400, italic: m ? m[2] === 'i' : false };
    });
  if (!candidates.length) return want;

  candidates.sort((a, b) => {
    const ai = a.italic === italic ? 0 : 1;
    const bi = b.italic === italic ? 0 : 1;
    if (ai !== bi) return ai - bi;
    return Math.abs(a.weight - weight) - Math.abs(b.weight - weight);
  });
  return candidates[0].key;
}

export function getMetrics(metricsTable, style) {
  return metricsTable?.[resolveFace(metricsTable, style)] || FALLBACK_METRICS;
}

export function applyCase(text, style = {}) {
  const t = String(text ?? '');
  if (style.textTransform === 'uppercase' || style.uppercase) return t.toUpperCase();
  if (style.textTransform === 'lowercase') return t.toLowerCase();
  return t;
}

/** Width of a string in pixels at `fontPx`, including letter-spacing. */
export function measureText(text, metrics, fontPx, letterSpacingEm = 0) {
  const upem = metrics.unitsPerEm || 1000;
  let units = 0;
  for (const ch of text) {
    const cp = ch.codePointAt(0);
    const adv = metrics.advances?.[cp];
    units += typeof adv === 'number' ? adv : metrics.defaultAdvance;
  }
  const count = [...text].length;
  return (units / upem) * fontPx + letterSpacingEm * fontPx * count;
}

/** Greedy word wrap that also honours explicit newlines and splits long words. */
export function wrapText(text, metrics, fontPx, maxWidth, letterSpacingEm = 0) {
  const out = [];
  const paragraphs = String(text ?? '').split(/\r?\n/);

  for (const para of paragraphs) {
    const words = para.split(/\s+/).filter((w) => w.length);
    if (!words.length) { out.push(''); continue; }

    let line = '';
    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;
      if (!line || measureText(candidate, metrics, fontPx, letterSpacingEm) <= maxWidth) {
        line = candidate;
        continue;
      }
      out.push(line);
      // A single word longer than the box: hard-break it by character.
      if (measureText(word, metrics, fontPx, letterSpacingEm) > maxWidth) {
        let chunk = '';
        for (const ch of word) {
          if (chunk && measureText(chunk + ch, metrics, fontPx, letterSpacingEm) > maxWidth) {
            out.push(chunk);
            chunk = ch;
          } else {
            chunk += ch;
          }
        }
        line = chunk;
      } else {
        line = word;
      }
    }
    out.push(line);
  }
  return out;
}

/**
 * Full layout for a text-ish layer.
 * Returns pixel geometry in canvas space, ready for SVG emission.
 */
export function layoutText(layer, canvas, metricsTable) {
  const style = layer.style || {};
  const box = layer.box || {};
  const metrics = getMetrics(metricsTable, style);

  const fontPx = (style.fontSize ?? 0.06) * canvas.height;
  const letterSpacing = style.letterSpacing ?? 0;
  const lineHeight = style.lineHeight ?? 1.18;
  const frameWidth = Math.max(1, (box.width ?? 0.8) * canvas.width);

  const body = applyCase(layer.text ?? '', style);
  let lines = wrapText(body, metrics, fontPx, frameWidth, letterSpacing);

  const maxLines = style.maxLines || 0;
  if (maxLines && lines.length > maxLines) {
    lines = lines.slice(0, maxLines);
    lines[maxLines - 1] = `${lines[maxLines - 1].replace(/[\s.,;:]+$/, '')}…`;
  }

  // Optional second line of text (quote attribution) in its own size.
  const attribution = layer.attribution ? applyCase(layer.attribution, style.attribution || {}) : '';
  const attrStyle = { ...style, ...(style.attribution || {}) };
  const attrMetrics = attribution ? getMetrics(metricsTable, attrStyle) : null;
  const attrFontPx = attribution ? (attrStyle.fontSize ?? (style.fontSize ?? 0.06) * 0.45) * canvas.height : 0;
  const attrLines = attribution
    ? wrapText(attribution, attrMetrics, attrFontPx, frameWidth, attrStyle.letterSpacing ?? 0)
    : [];
  const attrGap = attribution ? (style.attribution?.gap ?? 0.5) * fontPx : 0;

  const lineHeightPx = fontPx * lineHeight;
  const attrLineHeightPx = attrFontPx * (attrStyle.lineHeight ?? 1.2);

  const blockHeight = lines.length * lineHeightPx + (attribution ? attrGap + attrLines.length * attrLineHeightPx : 0);

  const anchor = box.anchor || 'center';
  const [vAnchor, hAnchor] = normalizeAnchor(anchor);
  const cx = (box.x ?? 0.5) * canvas.width;
  const cy = (box.y ?? 0.5) * canvas.height;

  let frameLeft = cx;
  if (hAnchor === 'center') frameLeft = cx - frameWidth / 2;
  else if (hAnchor === 'right') frameLeft = cx - frameWidth;

  let frameTop = cy;
  if (vAnchor === 'middle') frameTop = cy - blockHeight / 2;
  else if (vAnchor === 'bottom') frameTop = cy - blockHeight;

  const align = box.align || 'center';
  const upem = metrics.unitsPerEm || 1000;
  const scale = fontPx / upem;
  // Half-leading, the same model CSS uses, so the browser and resvg agree.
  const emBoxHeight = (metrics.ascent - metrics.descent) * scale;
  const baselineInLine = (lineHeightPx - emBoxHeight) / 2 + metrics.ascent * scale;

  const placed = lines.map((text, i) => {
    const width = measureText(text, metrics, fontPx, letterSpacing);
    return {
      text,
      width,
      fontPx,
      letterSpacing,
      x: alignX(frameLeft, frameWidth, width, align),
      baseline: frameTop + i * lineHeightPx + baselineInLine,
      top: frameTop + i * lineHeightPx,
      height: lineHeightPx,
      kind: 'body',
    };
  });

  if (attribution) {
    const aScale = attrFontPx / (attrMetrics.unitsPerEm || 1000);
    const aEmBox = (attrMetrics.ascent - attrMetrics.descent) * aScale;
    const aBaseline = (attrLineHeightPx - aEmBox) / 2 + attrMetrics.ascent * aScale;
    const offset = frameTop + lines.length * lineHeightPx + attrGap;
    attrLines.forEach((text, i) => {
      const width = measureText(text, attrMetrics, attrFontPx, attrStyle.letterSpacing ?? 0);
      placed.push({
        text,
        width,
        fontPx: attrFontPx,
        letterSpacing: attrStyle.letterSpacing ?? 0,
        x: alignX(frameLeft, frameWidth, width, align),
        baseline: offset + i * attrLineHeightPx + aBaseline,
        top: offset + i * attrLineHeightPx,
        height: attrLineHeightPx,
        kind: 'attribution',
      });
    });
  }

  const contentWidth = placed.reduce((m, l) => Math.max(m, l.width), 0);
  let contentLeft = frameLeft;
  if (align === 'center') contentLeft = frameLeft + (frameWidth - contentWidth) / 2;
  else if (align === 'right') contentLeft = frameLeft + frameWidth - contentWidth;

  return {
    lines: placed,
    frame: { left: frameLeft, top: frameTop, width: frameWidth, height: blockHeight },
    content: { left: contentLeft, top: frameTop, width: contentWidth, height: blockHeight },
    fontPx,
    lineHeightPx,
    align,
  };
}

function alignX(frameLeft, frameWidth, lineWidth, align) {
  if (align === 'center') return frameLeft + (frameWidth - lineWidth) / 2;
  if (align === 'right') return frameLeft + frameWidth - lineWidth;
  return frameLeft;
}

export function normalizeAnchor(anchor) {
  const a = String(anchor || 'center');
  if (a === 'center') return ['middle', 'center'];
  const [v, h] = a.split('-');
  const vert = ['top', 'middle', 'bottom'].includes(v) ? v : 'middle';
  const horiz = ['left', 'center', 'right'].includes(h) ? h : 'center';
  return [vert, horiz];
}

/** Pixel rect for a box-ish layer (image / shape), no text involved. */
export function layoutBox(layer, canvas) {
  const box = layer.box || {};
  const w = (box.width ?? 0.4) * canvas.width;
  const h = (box.height ?? 0.1) * canvas.height;
  const [vAnchor, hAnchor] = normalizeAnchor(box.anchor || 'center');
  const cx = (box.x ?? 0.5) * canvas.width;
  const cy = (box.y ?? 0.5) * canvas.height;
  let left = cx;
  if (hAnchor === 'center') left = cx - w / 2;
  else if (hAnchor === 'right') left = cx - w;
  let top = cy;
  if (vAnchor === 'middle') top = cy - h / 2;
  else if (vAnchor === 'bottom') top = cy - h;
  return { left, top, width: w, height: h };
}
