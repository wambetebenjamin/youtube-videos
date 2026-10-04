/**
 * Easing curves that exist twice: once as JavaScript (used by the live
 * preview) and once as an FFmpeg expression (used by the renderer).
 * `P` is replaced by the clamped 0..1 progress expression.
 *
 * Keeping both in one table is what stops the preview and the export
 * from drifting apart.
 */
export const EASINGS = {
  linear: {
    label: 'Linear',
    js: (p) => p,
    ff: '(P)',
  },
  easeOut: {
    label: 'Ease out',
    js: (p) => 1 - Math.pow(1 - p, 3),
    ff: '(1-pow(1-(P),3))',
  },
  easeOutSoft: {
    label: 'Ease out (soft)',
    js: (p) => 1 - Math.pow(1 - p, 2),
    ff: '(1-pow(1-(P),2))',
  },
  easeOutSnap: {
    label: 'Ease out (snappy)',
    js: (p) => 1 - Math.pow(1 - p, 5),
    ff: '(1-pow(1-(P),5))',
  },
  easeInOut: {
    label: 'Ease in-out',
    js: (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2),
    ff: 'if(lt((P),0.5), 4*pow((P),3), 1-pow(-2*(P)+2,3)/2)',
  },
};

export const EASING_IDS = Object.keys(EASINGS);

export function ease(id, p) {
  const e = EASINGS[id] || EASINGS.easeOut;
  return e.js(Math.max(0, Math.min(1, p)));
}

/** Build an FFmpeg expression for an eased value, given a progress expression. */
export function easeExpr(id, progressExpr) {
  const e = EASINGS[id] || EASINGS.easeOut;
  return e.ff.replaceAll('P', progressExpr);
}
