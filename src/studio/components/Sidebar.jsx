import React, { useRef, useState } from 'react';
import { api, fmtBytes } from '../lib/api.js';
import { STYLE_PRESETS } from '@core/project.js';

const TABS = [
  ['media', 'Media'],
  ['add', 'Add'],
  ['quotes', 'Quotes'],
  ['canva', 'Canva'],
  ['exports', 'Exports'],
  ['projects', 'Projects'],
];

export default function Sidebar({
  boot, project, onRefresh, onAddLayer, onPatchProject, onAddMusicTrack,
  onOpenProject, onNewProject, onDeleteProject, currentId, notify,
}) {
  const [tab, setTab] = useState('media');
  return (
    <div className="sidebar">
      <div className="tabs">
        {TABS.map(([id, label]) => (
          <button key={id} className={tab === id ? 'active' : ''} onClick={() => setTab(id)}>{label}</button>
        ))}
      </div>
      <div className="tab-body">
        {tab === 'media' && <MediaTab boot={boot} project={project} onRefresh={onRefresh} onPatchProject={onPatchProject} onAddMusicTrack={onAddMusicTrack} onAddLayer={onAddLayer} notify={notify} />}
        {tab === 'add' && <AddTab onAddLayer={onAddLayer} />}
        {tab === 'quotes' && <QuotesTab boot={boot} onAddLayer={onAddLayer} />}
        {tab === 'canva' && <CanvaTab boot={boot} onRefresh={onRefresh} onAddLayer={onAddLayer} onPatchProject={onPatchProject} notify={notify} />}
        {tab === 'exports' && <ExportsTab boot={boot} onRefresh={onRefresh} notify={notify} />}
        {tab === 'projects' && <ProjectsTab boot={boot} currentId={currentId} onOpenProject={onOpenProject} onNewProject={onNewProject} onDeleteProject={onDeleteProject} />}
      </div>
    </div>
  );
}

/* ------------------------------ media ------------------------------ */
function MediaTab({ boot, project, onRefresh, onPatchProject, onAddMusicTrack, onAddLayer, notify }) {
  const [kind, setKind] = useState('video');
  const [progress, setProgress] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [proxying, setProxying] = useState(null);
  const [proxyPct, setProxyPct] = useState(0);
  const inputRef = useRef(null);

  /** Build a preview proxy, following the job's progress over SSE. */
  const makeProxy = async (v) => {
    setProxying(v.path);
    setProxyPct(0);
    try {
      const res = await api.buildProxy(v.path);
      if (res.cached || !res.jobId) {
        await onRefresh();
        notify('Proxy ready');
        return;
      }
      await new Promise((resolve, reject) => {
        api.watchJob(res.jobId, {
          onProgress: (j) => setProxyPct(Math.round(j.percent || 0)),
          onDone: (j) => (j.status === 'done' ? resolve(j) : reject(new Error(j.error || 'proxy failed'))),
        });
      });
      await onRefresh();
      notify(`Proxy built for ${v.name} — previews are now instant`);
    } catch (err) {
      notify(`Proxy failed: ${err.message}`, 'error');
    } finally {
      setProxying(null);
    }
  };

  const accept = {
    video: 'video/*,.mp4,.mov,.webm,.mkv',
    music: 'audio/*,.mp3,.wav,.m4a,.aac,.ogg',
    image: 'image/*,.png,.jpg,.jpeg,.webp,.svg',
    font: '.ttf,.otf',
  }[kind];

  const doUpload = async (files) => {
    if (!files?.length) return;
    try {
      setProgress(0);
      const res = await api.upload(files, kind, setProgress);
      setProgress(null);
      await onRefresh();
      notify(`Uploaded ${res.files.length} file${res.files.length > 1 ? 's' : ''} to ${kind === 'font' ? 'assets/fonts' : `media/${kind === 'video' ? 'source' : kind}`}`);
      if (kind === 'video' && res.files[0] && !project?.source?.clip) {
        onPatchProject({ source: { ...project.source, clip: res.files[0].path } });
      }
    } catch (err) {
      setProgress(null);
      notify(`Upload failed: ${err.message}`, 'error');
    }
  };

  const media = boot?.media || {};
  return (
    <>
      <div className="seg-row">
        {['video', 'music', 'image', 'font'].map((k) => (
          <button key={k} className={kind === k ? 'chip active' : 'chip'} onClick={() => setKind(k)}>{k}</button>
        ))}
      </div>

      <div
        className={`dropzone${dragOver ? ' over' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); doUpload([...e.dataTransfer.files]); }}
        onClick={() => inputRef.current?.click()}
      >
        <input ref={inputRef} type="file" multiple accept={accept} hidden onChange={(e) => doUpload([...e.target.files])} />
        {progress == null ? (
          <>
            <strong>Drop {kind} files here</strong>
            <span>or click to browse · saved into the repo</span>
          </>
        ) : (
          <>
            <strong>Uploading… {Math.round(progress * 100)}%</strong>
            <div className="bar"><i style={{ width: `${progress * 100}%` }} /></div>
          </>
        )}
      </div>

      <h4>Clips <em>media/source</em></h4>
      <div className="list">
        {(media.videos || []).map((v) => {
          const heavy = v.bytes > 40 * 1024 * 1024;
          return (
            <div key={v.path} className={`item${project?.source?.clip === v.path ? ' active' : ''}`}>
              <button className="item-main" onClick={() => onPatchProject({ source: { ...project.source, clip: v.path } })}>
                <span className="nm">{v.name}</span>
                <span className="meta">{v.info?.width}×{v.info?.height} · {v.info?.duration ? `${v.info.duration.toFixed(1)}s` : '?'} · {fmtBytes(v.bytes)}</span>
                {(v.proxy || v.linked || (heavy && !v.proxy)) && (
                  <span className="media-badges">
                    {v.linked && <span className="media-badge link" title="Symlinked — the file lives outside the repo">link</span>}
                    {v.proxy && <span className="media-badge proxy" title="Previewing a small proxy; renders use the original">proxy</span>}
                    {heavy && !v.proxy && <span className="media-badge heavy" title="Large file — a proxy will make scrubbing smooth">heavy</span>}
                  </span>
                )}
              </button>
              {heavy && !v.proxy && (
                <button
                  className="icon-btn"
                  title="Build a 540p preview proxy"
                  disabled={proxying === v.path}
                  onClick={() => makeProxy(v)}
                >
                  {proxying === v.path ? `${proxyPct}%` : '⚡'}
                </button>
              )}
            </div>
          );
        })}
        {!(media.videos || []).length && <p className="muted small">No clips yet.</p>}
        {(media.videos || []).some((v) => v.bytes > 40 * 1024 * 1024 && !v.proxy) && (
          <p className="muted small">
            Large clips scrub badly in a browser. ⚡ builds a 540p stand-in for preview —
            renders always use the original.
          </p>
        )}
      </div>

      <h4>Music <em>media/music</em></h4>
      <div className="list">
        {(media.music || []).map((m) => (
          <div key={m.path} className="item">
            <button className="item-main" onClick={() => onAddMusicTrack(m.path)}>
              <span className="nm">{m.name}</span>
              <span className="meta">{m.info?.duration ? `${m.info.duration.toFixed(1)}s` : ''} · {fmtBytes(m.bytes)} · click to add</span>
            </button>
          </div>
        ))}
        {!(media.music || []).length && <p className="muted small">No music yet.</p>}
      </div>

      <h4>Images <em>media/images</em></h4>
      <div className="list">
        {(media.images || []).map((im) => (
          <div key={im.path} className="item">
            <button className="item-main" onClick={() => onAddLayer('image', { src: im.path })}>
              <span className="nm">{im.name}</span>
              <span className="meta">{fmtBytes(im.bytes)} · click to add as layer</span>
            </button>
          </div>
        ))}
        {!(media.images || []).length && <p className="muted small">No images yet.</p>}
      </div>
    </>
  );
}

/* ------------------------------ add ------------------------------ */
function AddTab({ onAddLayer }) {
  return (
    <>
      <h4>Text</h4>
      <div className="grid2">
        {Object.entries(STYLE_PRESETS).map(([id, p]) => (
          <button key={id} className="tile" onClick={() => onAddLayer(id === 'quote' || id === 'quote-card' ? 'quote' : 'text', { preset: id })}>
            <strong>{p.label}</strong>
            <span>{p.style.fontFamily} {p.style.fontWeight}</span>
          </button>
        ))}
      </div>
      <h4>Graphics</h4>
      <div className="grid2">
        <button className="tile" onClick={() => onAddLayer('shape', { shape: { kind: 'scrim-bottom', color: '#000000', opacity: 0.75, size: 0.4 } })}>
          <strong>Bottom fade</strong><span>readability behind captions</span>
        </button>
        <button className="tile" onClick={() => onAddLayer('shape', { shape: { kind: 'wash', color: '#000000', opacity: 0.25 } })}>
          <strong>Tint</strong><span>darken the whole frame</span>
        </button>
        <button className="tile" onClick={() => onAddLayer('shape', { shape: { kind: 'rect', color: '#ffffff', opacity: 1, radius: 0.3 }, box: { x: 0.5, y: 0.5, width: 0.5, height: 0.08, anchor: 'center' } })}>
          <strong>Bar</strong><span>solid block</span>
        </button>
        <button className="tile" onClick={() => onAddLayer('progress', {})}>
          <strong>Progress bar</strong><span>fills across the clip</span>
        </button>
      </div>
    </>
  );
}

/* ------------------------------ quotes ------------------------------ */
function QuotesTab({ boot, onAddLayer }) {
  const packs = boot?.quotes || [];
  const [packId, setPackId] = useState(packs[0]?.id || '');
  const pack = packs.find((p) => p.id === packId) || packs[0];
  const [filter, setFilter] = useState('');

  if (!packs.length) return <p className="muted small">No quote packs in content/quotes yet.</p>;

  const items = (pack?.quotes || []).filter((q) =>
    !filter || `${q.text} ${q.author || ''}`.toLowerCase().includes(filter.toLowerCase()));

  return (
    <>
      <div className="seg-row">
        {packs.map((p) => (
          <button key={p.id} className={p.id === pack?.id ? 'chip active' : 'chip'} onClick={() => setPackId(p.id)}>{p.name || p.id}</button>
        ))}
      </div>
      <input className="search" placeholder="Search quotes…" value={filter} onChange={(e) => setFilter(e.target.value)} />
      <div className="list">
        {items.map((q, i) => (
          <div key={i} className="item quote">
            <button className="item-main" onClick={() => onAddLayer('quote', { preset: 'quote', text: q.text, attribution: q.author || '' })}>
              <span className="nm">“{q.text}”</span>
              <span className="meta">{q.author || 'Unknown'} · click to add</span>
            </button>
          </div>
        ))}
      </div>
    </>
  );
}

/* ------------------------------ canva ------------------------------ */
function CanvaTab({ boot, onRefresh, onAddLayer, onPatchProject, notify }) {
  const [url, setUrl] = useState('');
  const [file, setFile] = useState('');
  const [busy, setBusy] = useState(false);
  const presets = boot?.canva || [];

  const run = async (body) => {
    setBusy(true);
    try {
      const res = await api.canvaImport(body);
      await onRefresh();
      notify(`Imported "${res.preset.name}" · ${res.preset.layers.length} text block(s)`);
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <h4>Import a design</h4>
      <p className="muted small">
        Best results: in Canva choose <strong>Share ▸ Download ▸ PDF Standard</strong>, drop the file into
        <code> imports/</code>, then give the path below. Fonts, sizes and positions come across exactly.
      </p>
      <div className="stack">
        <input className="search" placeholder="imports/my-design.pdf" value={file} onChange={(e) => setFile(e.target.value)} />
        <button className="btn" disabled={!file || busy} onClick={() => run({ file })}>Import file</button>
      </div>
      <div className="stack">
        <input className="search" placeholder="https://www.canva.com/design/…/view" value={url} onChange={(e) => setUrl(e.target.value)} />
        <button className="btn" disabled={!url || busy} onClick={() => run({ url })}>Import link</button>
      </div>

      <h4>Imported presets</h4>
      {!presets.length && <p className="muted small">Nothing imported yet.</p>}
      {presets.map((p) => (
        <div className="card" key={p.id}>
          <div className="card-head">
            <strong>{p.name}</strong>
            <span className="muted small">{p.design?.width}×{p.design?.height}</span>
          </div>
          <div className="chips">
            {(p.fonts || []).map((f, i) => (
              <span key={i} className={`chip tiny ${f.match}`} title={`${f.canvaFont} → ${f.familyName} (${f.match})`}>
                {f.familyName} <em>{f.usedFor?.join('/')}</em>
              </span>
            ))}
          </div>
          <div className="chips">
            {(p.palette || []).slice(0, 6).map((c) => <span key={c} className="swatch" style={{ background: c }} title={c} />)}
          </div>
          <div className="row">
            <button className="btn small" onClick={() => {
              for (const l of p.layers || []) onAddLayer(l.type, { ...l, id: undefined });
              if (p.design?.suggestedFormat) onPatchProject({ format: p.design.suggestedFormat });
              notify(`Added ${p.layers?.length || 0} layer(s) from ${p.name}`);
            }}>Apply layers
            </button>
          </div>
          {(p.notes || []).map((n, i) => <p key={i} className="muted small note">{n}</p>)}
        </div>
      ))}
    </>
  );
}

/* ------------------------------ exports ------------------------------ */
function ExportsTab({ boot, onRefresh, notify }) {
  const list = boot?.exports || [];
  return (
    <>
      <h4>Rendered files <em>media/exports</em></h4>
      {!list.length && <p className="muted small">Nothing rendered yet. Hit Render in the top bar.</p>}
      <div className="list">
        {list.map((f) => (
          <div key={f.path} className="item export">
            {f.poster && <img src={f.poster} alt="" />}
            <div className="ex-main">
              <span className="nm">{f.name}</span>
              <span className="meta">{f.info?.width}×{f.info?.height} · {f.info?.duration?.toFixed(1)}s · {fmtBytes(f.bytes)}</span>
              <div className="row">
                <a className="btn small primary" href={f.download}>Download</a>
                <a className="btn small" href={f.url} target="_blank" rel="noreferrer">Open</a>
                <button className="btn small danger" onClick={async () => { await api.deleteExport(f.name); await onRefresh(); notify('Deleted'); }}>Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

/* ------------------------------ projects ------------------------------ */
function ProjectsTab({ boot, currentId, onOpenProject, onNewProject, onDeleteProject }) {
  const [name, setName] = useState('');
  return (
    <>
      <div className="stack">
        <input className="search" placeholder="New project name…" value={name} onChange={(e) => setName(e.target.value)} />
        <button className="btn primary" disabled={!name} onClick={() => { onNewProject(name); setName(''); }}>Create</button>
      </div>
      <p className="muted small">Projects are plain JSON in <code>projects/</code> — commit them and the whole edit is reviewable.</p>
      <div className="list">
        {(boot?.projects || []).map((p) => (
          <div key={p.id} className={`item${p.id === currentId ? ' active' : ''}`}>
            <button className="item-main" onClick={() => onOpenProject(p.id)}>
              <span className="nm">{p.name}</span>
              <span className="meta">{p.format} · {p.layers} layers · {p.clip ? p.clip.split('/').pop() : 'no clip'}</span>
            </button>
            <button className="mini danger" onClick={() => onDeleteProject(p.id)}>✕</button>
          </div>
        ))}
      </div>
    </>
  );
}
