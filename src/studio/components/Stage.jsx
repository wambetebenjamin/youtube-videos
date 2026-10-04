import React, { useMemo, useRef, useState, useEffect, useCallback } from 'react';
import { compositeSvg } from '@core/svg.js';
import { layoutText, layoutBox } from '@core/layout.js';
import { stateAt } from '@core/timeline.js';

/** Hit/outline rectangles in canvas pixels for a layer. */
function layerRects(layer, canvas, metrics) {
  if (layer.type === 'text' || layer.type === 'quote') {
    const L = layoutText(layer, canvas, metrics);
    const pad = L.fontPx * 0.3;
    return {
      outline: L.content,
      hit: { left: L.content.left - pad, top: L.content.top - pad, width: L.content.width + pad * 2, height: L.content.height + pad * 2 },
    };
  }
  if (layer.type === 'image') {
    const r = layoutBox(layer, canvas);
    return { outline: r, hit: r };
  }
  if (layer.type === 'shape') {
    const kind = layer.shape?.kind || 'rect';
    if (kind === 'rect' || kind === 'ellipse') {
      const r = layoutBox(layer, canvas);
      return { outline: r, hit: r };
    }
    return null; // scrims and washes cover the frame — never grab the pointer
  }
  return null;
}

export default function Stage({
  project, canvas, duration, time, metrics, familyName,
  selectedId, onSelect, onPatchLayer, videoRef, guides, zoomToFit = true,
}) {
  const wrapRef = useRef(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const dragRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      const scale = Math.min(width / canvas.width, height / canvas.height);
      setSize({ w: canvas.width * scale, h: canvas.height * scale, scale });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [canvas.width, canvas.height]);

  const ctx = useMemo(
    () => ({ canvas, metrics, familyName, imageHref: (src) => (src ? `/${src}` : null) }),
    [canvas, metrics, familyName],
  );

  const svg = useMemo(
    () => compositeSvg(project, time, ctx, duration),
    [project, time, ctx, duration],
  );

  const src = project.source?.clip ? `/${project.source.clip}` : null;
  const fit = project.source?.fit || 'cover';
  const zoom = project.source?.zoom || 1;
  // The renderer shifts the crop window; on screen that moves the image the
  // other way, hence the negative sign.
  const tx = -(project.source?.offsetX || 0) * 100;
  const ty = -(project.source?.offsetY || 0) * 100;
  const adj = project.source?.adjust || {};
  const cssFilter = [
    adj.brightness ? `brightness(${1 + adj.brightness})` : '',
    adj.contrast && adj.contrast !== 1 ? `contrast(${adj.contrast})` : '',
    adj.saturation && adj.saturation !== 1 ? `saturate(${adj.saturation})` : '',
  ].filter(Boolean).join(' ');

  /* ---------------- dragging layers ---------------- */
  const pickLayer = useCallback((px, py) => {
    const list = (project.layers || []).filter((l) => l.enabled !== false);
    for (let i = list.length - 1; i >= 0; i--) {
      const layer = list[i];
      const st = stateAt(layer, time, canvas, duration);
      if (!st.visible) continue;
      const rects = layerRects(layer, canvas, metrics);
      if (!rects) continue;
      const { hit } = rects;
      if (px >= hit.left && px <= hit.left + hit.width && py >= hit.top && py <= hit.top + hit.height) return layer;
    }
    return null;
  }, [project.layers, time, canvas, duration, metrics]);

  const toCanvas = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * canvas.width,
      y: ((e.clientY - rect.top) / rect.height) * canvas.height,
    };
  };

  const onPointerDown = (e) => {
    const p = toCanvas(e);
    const layer = pickLayer(p.x, p.y);
    onSelect(layer ? layer.id : null);
    if (!layer) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = {
      id: layer.id,
      startX: p.x,
      startY: p.y,
      originX: layer.box?.x ?? 0.5,
      originY: layer.box?.y ?? 0.5,
      moved: false,
    };
  };

  const onPointerMove = (e) => {
    const d = dragRef.current;
    if (!d) return;
    const p = toCanvas(e);
    const dx = (p.x - d.startX) / canvas.width;
    const dy = (p.y - d.startY) / canvas.height;
    if (!d.moved && Math.abs(dx) + Math.abs(dy) < 0.002) return;
    d.moved = true;
    setDragging(true);
    let x = d.originX + dx;
    let y = d.originY + dy;
    if (!e.altKey) { // snap to centre / thirds unless Alt is held
      for (const g of [0.5, 1 / 3, 2 / 3, 0.25, 0.75]) {
        if (Math.abs(x - g) < 0.012) x = g;
        if (Math.abs(y - g) < 0.012) y = g;
      }
    }
    onPatchLayer(d.id, { box: { x: clamp01(x), y: clamp01(y) } }, { silent: true });
  };

  const onPointerUp = (e) => {
    if (dragRef.current?.moved) onPatchLayer(dragRef.current.id, {}, { commit: true });
    dragRef.current = null;
    setDragging(false);
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch { /* ignore */ }
  };

  const selected = (project.layers || []).find((l) => l.id === selectedId);
  const selRects = selected ? layerRects(selected, canvas, metrics) : null;
  const selState = selected ? stateAt(selected, time, canvas, duration) : null;
  const pct = (v, total) => `${(v / total) * 100}%`;

  return (
    <div className="stage-wrap" ref={wrapRef}>
      <div
        className="stage"
        style={{ width: size.w || 10, height: size.h || 10, background: canvas.background }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        {src && fit === 'contain' && project.source?.backdrop === 'blur' && (
          <video
            className="stage-video backdrop"
            src={src}
            muted
            playsInline
            preload="auto"
            ref={(el) => { if (el && videoRef.current) el.currentTime = videoRef.current.currentTime; }}
            data-backdrop="1"
          />
        )}
        {src ? (
          <video
            ref={videoRef}
            className="stage-video"
            src={src}
            playsInline
            preload="auto"
            style={{
              objectFit: fit === 'contain' ? 'contain' : 'cover',
              transform: `scale(${zoom}) translate(${tx}%, ${ty}%)`,
              filter: cssFilter || undefined,
            }}
          />
        ) : (
          <div className="stage-empty">
            <div>
              <strong>No clip yet</strong>
              <p>Drop a video in the Media panel — or render text + music on a plain background.</p>
            </div>
          </div>
        )}

        <div className="stage-overlay" dangerouslySetInnerHTML={{ __html: svg }} />

        {guides && (
          <div className="stage-guides">
            <div className="safe" style={{
              left: pct(canvas.safe.left * canvas.width, canvas.width),
              right: pct(canvas.safe.right * canvas.width, canvas.width),
              top: pct(canvas.safe.top * canvas.height, canvas.height),
              bottom: pct(canvas.safe.bottom * canvas.height, canvas.height),
            }} />
            <div className="third v" style={{ left: '33.333%' }} />
            <div className="third v" style={{ left: '66.666%' }} />
            <div className="third h" style={{ top: '33.333%' }} />
            <div className="third h" style={{ top: '66.666%' }} />
          </div>
        )}

        {selRects && selState?.visible && (
          <div
            className={`sel-box${dragging ? ' dragging' : ''}`}
            style={{
              left: pct(selRects.outline.left + (selState.dx || 0), canvas.width),
              top: pct(selRects.outline.top + (selState.dy || 0), canvas.height),
              width: pct(selRects.outline.width, canvas.width),
              height: pct(selRects.outline.height, canvas.height),
            }}
          />
        )}
      </div>
    </div>
  );
}

const clamp01 = (v) => Math.max(0, Math.min(1, v));
