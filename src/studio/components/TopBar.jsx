import React from 'react';

export default function TopBar({
  project, boot, saveState, guides, setGuides, onPatchProject, onRender, job, onCancel, lastExport,
}) {
  const fmt = (boot?.formats || []).find((f) => f.id === project?.format);
  const rendering = job && (job.status === 'rendering' || job.status === 'queued');

  return (
    <header className="topbar">
      <div className="brand">
        <span className="dot" />
        <strong>Reelsmith</strong>
      </div>

      <input
        className="proj-name"
        value={project?.name || ''}
        onChange={(e) => onPatchProject({ name: e.target.value })}
        placeholder="Project name"
      />

      <span className="badge">{fmt ? `${fmt.label} · ${fmt.width}×${fmt.height}` : project?.format}</span>
      <span className={`save-state ${saveState}`}>{saveState === 'saving' ? 'saving…' : saveState === 'dirty' ? 'unsaved' : 'saved'}</span>

      <div className="spacer" />

      <button className={`btn ghost${guides ? ' active' : ''}`} onClick={() => setGuides(!guides)} title="Safe-area guides">
        Guides
      </button>

      <select
        className="preset-select"
        value={project?.export?.preset || 'social-hq'}
        onChange={(e) => onPatchProject({ export: { ...project.export, preset: e.target.value } })}
      >
        {(boot?.exportPresets || []).map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
      </select>

      {rendering ? (
        <div className="render-progress">
          <div className="bar"><i style={{ width: `${job.percent || 0}%` }} /></div>
          <span className="mono">{Math.round(job.percent || 0)}%</span>
          <button className="btn small danger" onClick={onCancel}>stop</button>
        </div>
      ) : (
        <button className="btn primary" onClick={onRender}>Render</button>
      )}

      {lastExport && !rendering && (
        <a className="btn success" href={lastExport.download || `/api/download/${encodeURIComponent(lastExport.name)}`}>
          ↓ {lastExport.name.length > 22 ? `${lastExport.name.slice(0, 20)}…` : lastExport.name}
        </a>
      )}
    </header>
  );
}
