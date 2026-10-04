/**
 * When a layer is on screen, and what it's doing while it gets there.
 *
 * Opacity ramps are deliberately LINEAR: FFmpeg's `fade` filter is linear,
 * so keeping the preview linear too means the fades match frame for frame.
 * Movement is eased, because there we control the expression on both sides.
 */
import { ease } from './easing.js';

export const ANIM_TYPES = {
  none: { label: 'None', dx: 0, dy: 0, fade: false },
  fade: { label: 'Fade', dx: 0, dy: 0, fade: true },
  'fade-up': { label: 'Rise up', dx: 0, dy: 1, fade: true },
  'fade-down': { label: 'Drop down', dx: 0, dy: -1, fade: true },
  'slide-left': { label: 'Slide from right', dx: 1, dy: 0, fade: true },
  'slide-right': { label: 'Slide from left', dx: -1, dy: 0, fade: true },
  'rise': { label: 'Rise (no fade)', dx: 0, dy: 1, fade: false },
  'pop': { label: 'Pop', dx: 0, dy: 0, fade: true, scale: 0.86, previewOnly: true },
};

export const ANIM_IDS = Object.keys(ANIM_TYPES);

export function animSpec(a) {
  const type = ANIM_TYPES[a?.type] ? a.type : 'fade';
  return {
    type,
    duration: a?.duration ?? 0.45,
    easing: a?.easing || 'easeOut',
    distance: a?.distance ?? 0.035, // fraction of canvas height
    ...ANIM_TYPES[type],
  };
}

export function layerTimes(layer, duration) {
  const start = Math.max(0, layer.start ?? 0);
  const end = layer.end == null || layer.end <= 0 ? duration : Math.min(layer.end, duration);
  return { start, end: Math.max(start, end) };
}

/**
 * Visual state of a layer at time t (seconds on the output timeline).
 */
export function stateAt(layer, t, canvas, duration) {
  const { start, end } = layerTimes(layer, duration);
  if (t < start || t > end) {
    return { visible: false, opacity: 0, dx: 0, dy: 0, scale: 1 };
  }

  const inA = animSpec(layer.animIn);
  const outA = animSpec(layer.animOut);
  const span = Math.max(0.0001, end - start);
  const inDur = Math.min(inA.duration, span / 2);
  const outDur = Math.min(outA.duration, span / 2);

  const pIn = inDur > 0 ? Math.min(1, (t - start) / inDur) : 1;
  const pOut = outDur > 0 ? Math.min(1, (end - t) / outDur) : 1;

  const opacity =
    (inA.fade && inA.type !== 'none' ? pIn : 1) *
    (outA.fade && outA.type !== 'none' ? pOut : 1) *
    (layer.style?.opacity ?? 1);

  const dist = canvas.height;
  const eIn = 1 - ease(inA.easing, pIn);
  const eOut = 1 - ease(outA.easing, pOut);

  const dx = inA.dx * inA.distance * dist * eIn - outA.dx * outA.distance * dist * eOut;
  const dy = inA.dy * inA.distance * dist * eIn - outA.dy * outA.distance * dist * eOut;

  let scale = 1;
  if (inA.scale) scale *= inA.scale + (1 - inA.scale) * ease(inA.easing, pIn);
  if (outA.scale) scale *= outA.scale + (1 - outA.scale) * ease(outA.easing, pOut);

  return { visible: true, opacity, dx, dy, scale, pIn, pOut };
}

/** Longest point in time the project needs to cover. */
export function contentDuration(project) {
  let max = 0;
  for (const l of project.layers || []) {
    if (l.enabled === false) continue;
    if (l.end != null && l.end > 0) max = Math.max(max, l.end);
  }
  return max;
}
