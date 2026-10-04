import React from 'react';
import { Section, Field, Num, Select, Text, Area, Color, Toggle, Segmented, AnchorPad } from './controls.jsx';
import { STYLE_PRESETS } from '@core/project.js';

export default function Inspector({
  project, boot, selected, duration, sourceDuration,
  onPatchProject, onPatchLayer, onDeleteLayer, onDuplicateLayer, onAddMusic, onPatchMusic, onRemoveMusic,
}) {
  if (!selected) {
    return (
      <ProjectPanel
        project={project} boot={boot} duration={duration} sourceDuration={sourceDuration}
        onPatchProject={onPatchProject}
        onAddMusic={onAddMusic} onPatchMusic={onPatchMusic} onRemoveMusic={onRemoveMusic}
      />
    );
  }
  return (
    <LayerPanel
      layer={selected} project={project} boot={boot} duration={duration}
      onPatch={(patch, opts) => onPatchLayer(selected.id, patch, opts)}
      onDelete={() => onDeleteLayer(selected.id)}
      onDuplicate={() => onDuplicateLayer(selected.id)}
    />
  );
}

/* ================================================================== *
 * Project
 * ================================================================== */
function ProjectPanel({ project, boot, duration, sourceDuration, onPatchProject, onAddMusic, onPatchMusic, onRemoveMusic }) {
  const src = project.source || {};
  const patchSource = (patch) => onPatchProject({ source: { ...src, ...patch } });
  const patchTrim = (patch) => patchSource({ trim: { ...src.trim, ...patch } });
  const patchAdjust = (patch) => patchSource({ adjust: { ...src.adjust, ...patch } });

  const videos = boot?.media?.videos || [];
  const music = boot?.media?.music || [];

  return (
    <div className="inspector">
      <div className="insp-head">
        <h3>Project</h3>
        <span className="muted">nothing selected</span>
      </div>

      <Section title="Canvas">
        <Field label="Format">
          <Select
            value={project.format}
            onChange={(v) => {
              const f = (boot?.formats || []).find((x) => x.id === v);
              onPatchProject({ format: v, canvas: f ? { width: f.width, height: f.height, fps: f.fps, background: project.canvas?.background || '#000000' } : project.canvas });
            }}
            options={(boot?.formats || []).map((f) => ({ value: f.id, label: `${f.label} · ${f.width}×${f.height}` }))}
          />
        </Field>
        <Field label="Backdrop"><Color value={project.canvas?.background} onChange={(v) => onPatchProject({ canvas: { ...project.canvas, background: v } })} /></Field>
      </Section>

      <Section title="Clip">
        <Field label="Source">
          <Select
            value={src.clip || ''}
            placeholder="— none (plain background) —"
            onChange={(v) => patchSource({ clip: v || null })}
            options={videos.map((v) => ({ value: v.path, label: v.name }))}
          />
        </Field>
        {src.clip && (
          <>
            <Field label="Fit">
              <Segmented
                value={src.fit || 'cover'}
                onChange={(v) => patchSource({ fit: v })}
                options={[
                  { value: 'cover', label: 'Fill', title: 'Crop to fill the frame' },
                  { value: 'contain', label: 'Fit', title: 'Letterbox the whole frame' },
                ]}
              />
            </Field>
            {src.fit === 'contain' && (
              <Field label="Bars">
                <Segmented
                  value={src.backdrop || 'blur'}
                  onChange={(v) => patchSource({ backdrop: v })}
                  options={[{ value: 'blur', label: 'Blurred' }, { value: 'color', label: 'Solid' }]}
                />
              </Field>
            )}
            <Field label="Zoom"><Num value={src.zoom ?? 1} min={1} max={3} step={0.01} onChange={(v) => patchSource({ zoom: v })} /></Field>
            <Field label="Pan X"><Num value={src.offsetX ?? 0} min={-0.5} max={0.5} step={0.005} onChange={(v) => patchSource({ offsetX: v })} /></Field>
            <Field label="Pan Y"><Num value={src.offsetY ?? 0} min={-0.5} max={0.5} step={0.005} onChange={(v) => patchSource({ offsetY: v })} /></Field>
            <Field label="Trim in" hint={`clip is ${sourceDuration ? sourceDuration.toFixed(2) : '?'}s`}>
              <Num value={src.trim?.start ?? 0} min={0} max={Math.max(1, sourceDuration)} step={0.05} precision={2} suffix="s" onChange={(v) => patchTrim({ start: v })} />
            </Field>
            <Field label="Trim out">
              <Num value={src.trim?.end ?? sourceDuration ?? 0} min={0} max={Math.max(1, sourceDuration)} step={0.05} precision={2} suffix="s" onChange={(v) => patchTrim({ end: v || null })} />
            </Field>
            <Field label="Speed"><Num value={src.speed ?? 1} min={0.25} max={4} step={0.05} precision={2} suffix="×" onChange={(v) => patchSource({ speed: v })} /></Field>
            <Field label="Clip volume"><Num value={src.volume ?? 1} min={0} max={2} step={0.05} precision={2} onChange={(v) => patchSource({ volume: v })} /></Field>
          </>
        )}
      </Section>

      {src.clip && (
        <Section title="Colour" defaultOpen={false}>
          <Field label="Brightness"><Num value={src.adjust?.brightness ?? 0} min={-0.5} max={0.5} step={0.01} precision={2} onChange={(v) => patchAdjust({ brightness: v })} /></Field>
          <Field label="Contrast"><Num value={src.adjust?.contrast ?? 1} min={0.5} max={2} step={0.01} precision={2} onChange={(v) => patchAdjust({ contrast: v })} /></Field>
          <Field label="Saturation"><Num value={src.adjust?.saturation ?? 1} min={0} max={3} step={0.01} precision={2} onChange={(v) => patchAdjust({ saturation: v })} /></Field>
          <Field label="Vignette"><Toggle value={!!src.adjust?.vignette} onChange={(v) => patchAdjust({ vignette: v })} /></Field>
          <Field label="Sharpen"><Toggle value={!!src.adjust?.sharpen} onChange={(v) => patchAdjust({ sharpen: v })} /></Field>
        </Section>
      )}

      <Section title="Music" right={<button className="mini primary" onClick={onAddMusic}>+ add</button>}>
        {!(project.audio?.music || []).length && <p className="muted small">No music yet. Upload tracks in the Media panel, then add one here.</p>}
        {(project.audio?.music || []).map((m, i) => (
          <div className="card" key={m.id || i}>
            <div className="card-head">
              <strong>Track {i + 1}</strong>
              <button className="mini danger" onClick={() => onRemoveMusic(m.id)}>remove</button>
            </div>
            <Field label="File">
              <Select
                value={m.src || ''} placeholder="— choose —"
                onChange={(v) => onPatchMusic(m.id, { src: v })}
                options={music.map((x) => ({ value: x.path, label: x.name }))}
              />
            </Field>
            <Field label="Volume"><Num value={m.volume ?? 0.35} min={0} max={1.5} step={0.01} precision={2} onChange={(v) => onPatchMusic(m.id, { volume: v })} /></Field>
            <Field label="Starts at"><Num value={m.start ?? 0} min={0} max={Math.max(1, duration)} step={0.1} precision={2} suffix="s" onChange={(v) => onPatchMusic(m.id, { start: v })} /></Field>
            <Field label="Skip into"><Num value={m.offset ?? 0} min={0} max={300} step={0.5} precision={2} suffix="s" onChange={(v) => onPatchMusic(m.id, { offset: v })} /></Field>
            <Field label="Fade in"><Num value={m.fadeIn ?? 1} min={0} max={10} step={0.1} precision={1} suffix="s" onChange={(v) => onPatchMusic(m.id, { fadeIn: v })} /></Field>
            <Field label="Fade out"><Num value={m.fadeOut ?? 2} min={0} max={10} step={0.1} precision={1} suffix="s" onChange={(v) => onPatchMusic(m.id, { fadeOut: v })} /></Field>
            <Field label="Loop"><Toggle value={m.loop !== false} onChange={(v) => onPatchMusic(m.id, { loop: v })} /></Field>
            <Field label="Duck under clip" hint="lowers music when the clip's own audio is loud">
              <Toggle value={!!m.duck} onChange={(v) => onPatchMusic(m.id, { duck: v })} />
            </Field>
          </div>
        ))}
      </Section>

      <Section title="Export" defaultOpen={false}>
        <Field label="Preset">
          <Select
            value={project.export?.preset || 'social-hq'}
            onChange={(v) => onPatchProject({ export: { ...project.export, preset: v } })}
            options={(boot?.exportPresets || []).map((p) => ({ value: p.id, label: p.label }))}
          />
        </Field>
        <Field label="Filename tag" hint="appended to the export filename">
          <Text value={project.export?.suffix || ''} onChange={(v) => onPatchProject({ export: { ...project.export, suffix: v } })} placeholder="v2, ig, yt…" />
        </Field>
      </Section>
    </div>
  );
}

/* ================================================================== *
 * Layer
 * ================================================================== */
function LayerPanel({ layer, project, boot, duration, onPatch, onDelete, onDuplicate }) {
  const isText = layer.type === 'text' || layer.type === 'quote';
  const style = layer.style || {};
  const box = layer.box || {};
  const families = boot?.fonts?.families || [];
  const family = families.find((f) => f.id === style.fontFamily);
  const weights = family ? [...new Set(family.faces.map((f) => f.weight))].sort((a, b) => a - b) : [400];
  const hasItalic = family?.faces.some((f) => f.style === 'italic' && f.weight === style.fontWeight);

  const patchStyle = (patch) => onPatch({ style: { ...style, ...patch } });
  const patchBox = (patch) => onPatch({ box: { ...box, ...patch } });
  const patchAnim = (which, patch) => onPatch({ [which]: { ...(layer[which] || {}), ...patch } });

  return (
    <div className="inspector">
      <div className="insp-head">
        <h3>{layer.type === 'quote' ? 'Quote' : layer.type[0].toUpperCase() + layer.type.slice(1)}</h3>
        <div className="insp-actions">
          <button className="mini" onClick={onDuplicate}>duplicate</button>
          <button className="mini danger" onClick={onDelete}>delete</button>
        </div>
      </div>

      <Field label="Name"><Text value={layer.name} placeholder="(auto)" onChange={(v) => onPatch({ name: v })} /></Field>

      {isText && (
        <>
          <Section title="Content">
            <Field wide><Area value={layer.text} rows={4} onChange={(v) => onPatch({ text: v })} placeholder="Type your line…" /></Field>
            {layer.type === 'quote' && (
              <Field label="Credit"><Text value={layer.attribution} onChange={(v) => onPatch({ attribution: v })} placeholder="— Marcus Aurelius" /></Field>
            )}
            <Field label="Style preset" hint="replaces type + colour settings">
              <Select
                value="" placeholder="— apply a preset —"
                onChange={(v) => {
                  const p = STYLE_PRESETS[v];
                  if (p) onPatch({ style: structuredClone(p.style), box: { ...box, ...p.box, x: box.x, y: box.y } });
                }}
                options={Object.entries(STYLE_PRESETS).map(([id, p]) => ({ value: id, label: p.label }))}
              />
            </Field>
          </Section>

          <Section title="Type">
            <Field label="Font">
              <Select
                value={style.fontFamily}
                onChange={(v) => {
                  const f = families.find((x) => x.id === v);
                  const w = f ? [...new Set(f.faces.map((x) => x.weight))] : [400];
                  patchStyle({ fontFamily: v, fontWeight: w.includes(style.fontWeight) ? style.fontWeight : w[0] });
                }}
                options={families.map((f) => ({ value: f.id, label: `${f.name} · ${f.category}` }))}
              />
            </Field>
            <Field label="Weight">
              <Select value={String(style.fontWeight)} onChange={(v) => patchStyle({ fontWeight: Number(v) })} options={weights.map((w) => ({ value: String(w), label: String(w) }))} />
            </Field>
            {hasItalic && <Field label="Italic"><Toggle value={!!style.italic} onChange={(v) => patchStyle({ italic: v })} /></Field>}
            <Field label="Size" hint="share of frame height"><Num value={style.fontSize ?? 0.05} min={0.012} max={0.2} step={0.001} onChange={(v) => patchStyle({ fontSize: v })} /></Field>
            <Field label="Line height"><Num value={style.lineHeight ?? 1.2} min={0.8} max={2.2} step={0.01} precision={2} onChange={(v) => patchStyle({ lineHeight: v })} /></Field>
            <Field label="Tracking"><Num value={style.letterSpacing ?? 0} min={-0.05} max={0.4} step={0.005} onChange={(v) => patchStyle({ letterSpacing: v })} /></Field>
            <Field label="Case">
              <Segmented
                value={style.textTransform || 'none'}
                onChange={(v) => patchStyle({ textTransform: v })}
                options={[{ value: 'none', label: 'Aa' }, { value: 'uppercase', label: 'AA' }, { value: 'lowercase', label: 'aa' }]}
              />
            </Field>
            <Field label="Align">
              <Segmented value={box.align || 'center'} onChange={(v) => patchBox({ align: v })} options={[{ value: 'left', label: '⯇' }, { value: 'center', label: '≡' }, { value: 'right', label: '⯈' }]} />
            </Field>
            <Field label="Max lines" hint="0 = no limit"><Num value={style.maxLines ?? 0} min={0} max={8} step={1} precision={0} onChange={(v) => patchStyle({ maxLines: v })} /></Field>
          </Section>

          <Section title="Colour & effects">
            <Field label="Colour"><Color value={style.color} onChange={(v) => patchStyle({ color: v })} /></Field>
            <Field label="Opacity"><Num value={style.opacity ?? 1} min={0} max={1} step={0.01} precision={2} onChange={(v) => patchStyle({ opacity: v })} /></Field>

            <Field label="Plate">
              <Segmented
                value={style.background?.mode || 'none'}
                onChange={(v) => patchStyle({ background: v === 'none' ? null : { ...(style.background || { color: '#000000', opacity: 0.6, paddingX: 0.4, paddingY: 0.25, radius: 0.15 }), mode: v } })}
                options={[{ value: 'none', label: 'off' }, { value: 'content', label: 'box' }, { value: 'lines', label: 'lines' }, { value: 'frame', label: 'full' }]}
              />
            </Field>
            {style.background?.mode && style.background.mode !== 'none' && (
              <div className="sub">
                <Field label="Plate colour"><Color value={style.background.color} onChange={(v) => patchStyle({ background: { ...style.background, color: v } })} /></Field>
                <Field label="Plate opacity"><Num value={style.background.opacity ?? 1} min={0} max={1} step={0.01} precision={2} onChange={(v) => patchStyle({ background: { ...style.background, opacity: v } })} /></Field>
                <Field label="Pad X"><Num value={style.background.paddingX ?? 0.4} min={0} max={2} step={0.01} precision={2} onChange={(v) => patchStyle({ background: { ...style.background, paddingX: v } })} /></Field>
                <Field label="Pad Y"><Num value={style.background.paddingY ?? 0.25} min={0} max={2} step={0.01} precision={2} onChange={(v) => patchStyle({ background: { ...style.background, paddingY: v } })} /></Field>
                <Field label="Corner"><Num value={style.background.radius ?? 0.15} min={0} max={1} step={0.01} precision={2} onChange={(v) => patchStyle({ background: { ...style.background, radius: v } })} /></Field>
              </div>
            )}

            <Field label="Outline">
              <Toggle value={!!style.stroke} onChange={(v) => patchStyle({ stroke: v ? { color: '#000000', width: 0.03, opacity: 1 } : null })} />
            </Field>
            {style.stroke && (
              <div className="sub">
                <Field label="Outline colour"><Color value={style.stroke.color} onChange={(v) => patchStyle({ stroke: { ...style.stroke, color: v } })} /></Field>
                <Field label="Thickness"><Num value={style.stroke.width ?? 0.03} min={0} max={0.12} step={0.002} onChange={(v) => patchStyle({ stroke: { ...style.stroke, width: v } })} /></Field>
              </div>
            )}

            <Field label="Shadow">
              <Toggle value={!!style.shadow} onChange={(v) => patchStyle({ shadow: v ? { color: '#000000', blur: 0.15, dx: 0, dy: 0.03, opacity: 0.6 } : null })} />
            </Field>
            {style.shadow && (
              <div className="sub">
                <Field label="Shadow colour"><Color value={style.shadow.color} onChange={(v) => patchStyle({ shadow: { ...style.shadow, color: v } })} /></Field>
                <Field label="Blur"><Num value={style.shadow.blur ?? 0.15} min={0} max={0.6} step={0.005} onChange={(v) => patchStyle({ shadow: { ...style.shadow, blur: v } })} /></Field>
                <Field label="Offset Y"><Num value={style.shadow.dy ?? 0.03} min={-0.2} max={0.2} step={0.005} onChange={(v) => patchStyle({ shadow: { ...style.shadow, dy: v } })} /></Field>
                <Field label="Strength"><Num value={style.shadow.opacity ?? 0.6} min={0} max={1} step={0.01} precision={2} onChange={(v) => patchStyle({ shadow: { ...style.shadow, opacity: v } })} /></Field>
              </div>
            )}
          </Section>
        </>
      )}

      {layer.type === 'image' && (
        <Section title="Image">
          <Field label="File">
            <Select
              value={layer.src || ''} placeholder="— choose —"
              onChange={(v) => onPatch({ src: v })}
              options={[...(boot?.media?.images || []).map((i) => ({ value: i.path, label: i.name }))]}
            />
          </Field>
          <Field label="Fit"><Segmented value={layer.fit || 'contain'} onChange={(v) => onPatch({ fit: v })} options={[{ value: 'contain', label: 'Fit' }, { value: 'cover', label: 'Fill' }]} /></Field>
          <Field label="Corner"><Num value={layer.radius ?? 0} min={0} max={0.5} step={0.01} precision={2} onChange={(v) => onPatch({ radius: v })} /></Field>
          <Field label="Opacity"><Num value={style.opacity ?? 1} min={0} max={1} step={0.01} precision={2} onChange={(v) => patchStyle({ opacity: v })} /></Field>
        </Section>
      )}

      {layer.type === 'shape' && (
        <Section title="Shape">
          <Field label="Kind">
            <Select
              value={layer.shape?.kind || 'rect'}
              onChange={(v) => onPatch({ shape: { ...layer.shape, kind: v } })}
              options={[
                { value: 'scrim-bottom', label: 'Bottom fade (readability)' },
                { value: 'scrim-top', label: 'Top fade' },
                { value: 'wash', label: 'Full-frame tint' },
                { value: 'rect', label: 'Rectangle' },
                { value: 'ellipse', label: 'Ellipse' },
              ]}
            />
          </Field>
          <Field label="Colour"><Color value={layer.shape?.color} onChange={(v) => onPatch({ shape: { ...layer.shape, color: v } })} /></Field>
          <Field label="Opacity"><Num value={layer.shape?.opacity ?? 1} min={0} max={1} step={0.01} precision={2} onChange={(v) => onPatch({ shape: { ...layer.shape, opacity: v } })} /></Field>
          {(layer.shape?.kind === 'scrim-bottom' || layer.shape?.kind === 'scrim-top') && (
            <Field label="Height"><Num value={layer.shape?.size ?? 0.35} min={0.05} max={1} step={0.01} precision={2} onChange={(v) => onPatch({ shape: { ...layer.shape, size: v } })} /></Field>
          )}
          {(layer.shape?.kind === 'rect' || layer.shape?.kind === 'ellipse') && (
            <>
              <Field label="Width"><Num value={box.width ?? 0.4} min={0.02} max={1} step={0.01} precision={2} onChange={(v) => patchBox({ width: v })} /></Field>
              <Field label="Height"><Num value={box.height ?? 0.1} min={0.01} max={1} step={0.01} precision={2} onChange={(v) => patchBox({ height: v })} /></Field>
              <Field label="Corner"><Num value={layer.shape?.radius ?? 0} min={0} max={0.5} step={0.01} precision={2} onChange={(v) => onPatch({ shape: { ...layer.shape, radius: v } })} /></Field>
            </>
          )}
        </Section>
      )}

      {layer.type === 'progress' && (
        <Section title="Progress bar">
          <Field label="Colour"><Color value={layer.progress?.color} onChange={(v) => onPatch({ progress: { ...layer.progress, color: v } })} /></Field>
          <Field label="Track"><Color value={layer.progress?.trackColor} allowNone onChange={(v) => onPatch({ progress: { ...layer.progress, trackColor: v } })} /></Field>
          <Field label="Thickness"><Num value={layer.progress?.thickness ?? 0.005} min={0.001} max={0.05} step={0.001} onChange={(v) => onPatch({ progress: { ...layer.progress, thickness: v } })} /></Field>
          <Field label="Y position"><Num value={layer.progress?.y ?? 0.985} min={0} max={1} step={0.005} onChange={(v) => onPatch({ progress: { ...layer.progress, y: v } })} /></Field>
        </Section>
      )}

      {layer.type !== 'progress' && (
        <Section title="Position">
          <Field label="X"><Num value={box.x ?? 0.5} min={0} max={1} step={0.005} onChange={(v) => patchBox({ x: v })} /></Field>
          <Field label="Y"><Num value={box.y ?? 0.5} min={0} max={1} step={0.005} onChange={(v) => patchBox({ y: v })} /></Field>
          {(isText || layer.type === 'image') && (
            <Field label="Box width"><Num value={box.width ?? 0.8} min={0.1} max={1} step={0.01} precision={2} onChange={(v) => patchBox({ width: v })} /></Field>
          )}
          <Field label="Anchor"><AnchorPad value={box.anchor || 'center'} onChange={(v) => patchBox({ anchor: v })} /></Field>
        </Section>
      )}

      <Section title="Timing & motion">
        <Field label="In at"><Num value={layer.start ?? 0} min={0} max={Math.max(1, duration)} step={0.05} precision={2} suffix="s" onChange={(v) => onPatch({ start: v })} /></Field>
        <Field label="Out at" hint="0 = until the end">
          <Num value={layer.end ?? 0} min={0} max={Math.max(1, duration)} step={0.05} precision={2} suffix="s" onChange={(v) => onPatch({ end: v })} />
        </Field>
        <div className="sub">
          <Field label="Enter">
            <Select value={layer.animIn?.type || 'fade'} onChange={(v) => patchAnim('animIn', { type: v })} options={(boot?.animations || []).map((a) => ({ value: a.id, label: a.label + (a.previewOnly ? ' (preview only)' : '') }))} />
          </Field>
          <Field label="Enter time"><Num value={layer.animIn?.duration ?? 0.45} min={0} max={3} step={0.05} precision={2} suffix="s" onChange={(v) => patchAnim('animIn', { duration: v })} /></Field>
          <Field label="Ease"><Select value={layer.animIn?.easing || 'easeOut'} onChange={(v) => patchAnim('animIn', { easing: v })} options={(boot?.easings || []).map((e) => ({ value: e.id, label: e.label }))} /></Field>
          <Field label="Travel"><Num value={layer.animIn?.distance ?? 0.035} min={0} max={0.3} step={0.005} onChange={(v) => patchAnim('animIn', { distance: v })} /></Field>
        </div>
        <div className="sub">
          <Field label="Exit">
            <Select value={layer.animOut?.type || 'fade'} onChange={(v) => patchAnim('animOut', { type: v })} options={(boot?.animations || []).map((a) => ({ value: a.id, label: a.label + (a.previewOnly ? ' (preview only)' : '') }))} />
          </Field>
          <Field label="Exit time"><Num value={layer.animOut?.duration ?? 0.35} min={0} max={3} step={0.05} precision={2} suffix="s" onChange={(v) => patchAnim('animOut', { duration: v })} /></Field>
          <Field label="Ease"><Select value={layer.animOut?.easing || 'easeOut'} onChange={(v) => patchAnim('animOut', { easing: v })} options={(boot?.easings || []).map((e) => ({ value: e.id, label: e.label }))} /></Field>
          <Field label="Travel"><Num value={layer.animOut?.distance ?? 0.02} min={0} max={0.3} step={0.005} onChange={(v) => patchAnim('animOut', { distance: v })} /></Field>
        </div>
      </Section>

      {layer.meta?.canvaFont && (
        <Section title="From Canva" defaultOpen={false}>
          <p className="small muted">
            Role <strong>{layer.meta.canvaRole}</strong> · original font <strong>{layer.meta.canvaFont}</strong>
            {layer.meta.fontMatch !== 'exact' && <> · <em>{layer.meta.fontMatch}</em> match</>}
          </p>
        </Section>
      )}
    </div>
  );
}
