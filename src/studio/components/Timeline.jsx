import React, { useRef, useCallback } from 'react';
import { layerTimes } from '@core/timeline.js';
import { fmtTime } from '../lib/api.js';

const TYPE_ICON = { text: 'T', quote: '❝', image: '▣', shape: '▤', progress: '▬' };

export default function Timeline({
  project, duration, time, onSeek, selectedId, onSelect, onPatchLayer, playing, onTogglePlay,
}) {
  const trackRef = useRef(null);
  const dragRef = useRef(null);

  const pxToTime = useCallback((clientX) => {
    const el = trackRef.current;
    if (!el) return 0;
    const rect = el.getBoundingClientRect();
    return Math.max(0, Math.min(duration, ((clientX - rect.left) / rect.width) * duration));
  }, [duration]);

  const onRulerDown = (e) => {
    onSeek(pxToTime(e.clientX));
    const move = (ev) => onSeek(pxToTime(ev.clientX));
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  const startBarDrag = (e, layer, mode) => {
    e.stopPropagation();
    onSelect(layer.id);
    const { start, end } = layerTimes(layer, duration);
    dragRef.current = { id: layer.id, mode, t0: pxToTime(e.clientX), start, end };

    const move = (ev) => {
      const d = dragRef.current;
      if (!d) return;
      const dt = pxToTime(ev.clientX) - d.t0;
      let next = {};
      if (d.mode === 'move') {
        const len = d.end - d.start;
        const start = Math.max(0, Math.min(duration - len, d.start + dt));
        next = { start: round2(start), end: round2(start + len) };
      } else if (d.mode === 'l') {
        const start = Math.max(0, Math.min(d.end - 0.2, d.start + dt));
        next = { start: round2(start) };
      } else {
        const end = Math.min(duration, Math.max(d.start + 0.2, d.end + dt));
        next = { end: round2(end) };
      }
      onPatchLayer(d.id, next, { silent: true });
    };
    const up = () => {
      if (dragRef.current) onPatchLayer(dragRef.current.id, {}, { commit: true });
      dragRef.current = null;
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  const ticks = buildTicks(duration);
  const layers = project.layers || [];

  return (
    <div className="timeline">
      <div className="tl-toolbar">
        <button className="play" onClick={onTogglePlay}>{playing ? '❚❚' : '▶'}</button>
        <span className="tl-time mono">{fmtTime(time)} <em>/ {fmtTime(duration)}</em></span>
        <span className="tl-hint">drag bars to retime · drag edges to trim</span>
      </div>

      <div className="tl-body">
        <div className="tl-labels">
          <div className="tl-label ruler-label">Timeline</div>
          {layers.map((l) => (
            <div
              key={l.id}
              className={`tl-label${l.id === selectedId ? ' active' : ''}${l.enabled === false ? ' off' : ''}`}
              onClick={() => onSelect(l.id)}
            >
              <span className="ic">{TYPE_ICON[l.type] || '•'}</span>
              <span className="nm">{l.name || preview(l)}</span>
              <button
                className="eye"
                title={l.enabled === false ? 'Show' : 'Hide'}
                onClick={(e) => { e.stopPropagation(); onPatchLayer(l.id, { enabled: l.enabled === false }); }}
              >{l.enabled === false ? '○' : '●'}</button>
            </div>
          ))}
          {!layers.length && <div className="tl-label empty">No layers yet</div>}
        </div>

        <div className="tl-tracks" ref={trackRef}>
          <div className="tl-ruler" onPointerDown={onRulerDown}>
            {ticks.map((tk) => (
              <span key={tk} className="tick" style={{ left: `${(tk / duration) * 100}%` }}>
                <i />{fmtShort(tk)}
              </span>
            ))}
          </div>

          {layers.map((l) => {
            const { start, end } = layerTimes(l, duration);
            return (
              <div key={l.id} className="tl-row" onPointerDown={() => onSelect(l.id)}>
                <div
                  className={`tl-bar type-${l.type}${l.id === selectedId ? ' active' : ''}${l.enabled === false ? ' off' : ''}`}
                  style={{ left: `${(start / duration) * 100}%`, width: `${((end - start) / duration) * 100}%` }}
                  onPointerDown={(e) => startBarDrag(e, l, 'move')}
                >
                  <span className="handle l" onPointerDown={(e) => startBarDrag(e, l, 'l')} />
                  <span className="bar-text">{l.name || preview(l)}</span>
                  <span className="handle r" onPointerDown={(e) => startBarDrag(e, l, 'r')} />
                </div>
              </div>
            );
          })}

          <div className="playhead" style={{ left: `${(time / duration) * 100}%` }} />
        </div>
      </div>
    </div>
  );
}

function preview(l) {
  if (l.type === 'text' || l.type === 'quote') return (l.text || '').split('\n')[0].slice(0, 28) || 'Text';
  if (l.type === 'image') return l.src ? l.src.split('/').pop() : 'Image';
  if (l.type === 'shape') return l.shape?.kind || 'Shape';
  return l.type;
}

function buildTicks(duration) {
  const target = 8;
  const raw = duration / target;
  const steps = [0.5, 1, 2, 5, 10, 15, 30, 60];
  const step = steps.find((s) => s >= raw) || 60;
  const out = [];
  for (let t = 0; t <= duration + 0.001; t += step) out.push(Math.round(t * 100) / 100);
  return out;
}

const fmtShort = (t) => (t >= 60 ? `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}` : `${t}s`);
const round2 = (v) => Math.round(v * 100) / 100;
