import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { api } from './lib/api.js';
import { injectFontFaces, makeFamilyLookup } from './lib/fonts.js';
import { canvasOf } from '@core/formats.js';
import { resolveDuration, createLayer, createMusicTrack, normalizeLayer } from '@core/project.js';
import TopBar from './components/TopBar.jsx';
import Sidebar from './components/Sidebar.jsx';
import Stage from './components/Stage.jsx';
import Timeline from './components/Timeline.jsx';
import Inspector from './components/Inspector.jsx';

export default function App() {
  const [boot, setBoot] = useState(null);
  const [project, setProject] = useState(null);
  const [projectId, setProjectId] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [sourceDuration, setSourceDuration] = useState(0);
  const [guides, setGuides] = useState(true);
  const [saveState, setSaveState] = useState('saved');
  const [job, setJob] = useState(null);
  const [lastExport, setLastExport] = useState(null);
  const [toast, setToast] = useState(null);
  const [error, setError] = useState(null);

  const videoRef = useRef(null);
  const audioRefs = useRef(new Map());
  const historyRef = useRef({ past: [], future: [] });
  const skipSaveRef = useRef(true);
  const saveTimer = useRef(null);

  const notify = useCallback((message, kind = 'ok') => {
    setToast({ message, kind, id: Date.now() });
    setTimeout(() => setToast((t) => (t && Date.now() - t.id > 3400 ? null : t)), 3600);
  }, []);

  /* ------------------------------ boot ------------------------------ */
  const refresh = useCallback(async () => {
    const data = await api.bootstrap();
    setBoot(data);
    injectFontFaces(data.fonts);
    return data;
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const data = await refresh();
        const wanted = new URLSearchParams(location.search).get('project')
          || localStorage.getItem('reelsmith:last')
          || data.projects[0]?.id;
        if (wanted && data.projects.some((p) => p.id === wanted)) {
          await openProject(wanted, false);
        } else if (data.projects[0]) {
          await openProject(data.projects[0].id, false);
        } else {
          const created = await api.createProject({ name: 'My first reel', format: 'reel' });
          await refresh();
          setProject(created);
          setProjectId(created.id);
          skipSaveRef.current = true;
        }
      } catch (err) {
        setError(err.message);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openProject = useCallback(async (id, announce = true) => {
    const p = await api.project(id);
    skipSaveRef.current = true;
    setProject(p);
    setProjectId(id);
    setSelectedId(null);
    setTime(0);
    setPlaying(false);
    historyRef.current = { past: [], future: [] };
    localStorage.setItem('reelsmith:last', id);
    setSaveState('saved');
    if (announce) notify(`Opened ${p.name}`);
  }, [notify]);

  /* ------------------------------ editing ------------------------------ */
  const pushHistory = useCallback((snapshot) => {
    const h = historyRef.current;
    h.past.push(JSON.stringify(snapshot));
    if (h.past.length > 80) h.past.shift();
    h.future.length = 0;
  }, []);

  const patchProject = useCallback((patch, opts = {}) => {
    setProject((prev) => {
      if (!prev) return prev;
      if (!opts.silent) pushHistory(prev);
      return { ...prev, ...(typeof patch === 'function' ? patch(prev) : patch) };
    });
    setSaveState('dirty');
  }, [pushHistory]);

  const patchLayer = useCallback((id, patch, opts = {}) => {
    setProject((prev) => {
      if (!prev) return prev;
      if (!opts.silent && !opts.commit) pushHistory(prev);
      return {
        ...prev,
        layers: prev.layers.map((l) => {
          if (l.id !== id) return l;
          const next = { ...l, ...patch };
          if (patch.box) next.box = { ...l.box, ...patch.box };
          if (patch.style) next.style = { ...l.style, ...patch.style };
          return next;
        }),
      };
    });
    setSaveState('dirty');
  }, [pushHistory]);

  const addLayer = useCallback((type, patch = {}) => {
    const layer = normalizeLayer(createLayer(type, patch));
    if (!patch.start && !patch.end) {
      layer.start = 0;
      layer.end = 0;
    }
    patchProject((prev) => ({ layers: [...prev.layers, layer] }));
    setSelectedId(layer.id);
    return layer;
  }, [patchProject]);

  const deleteLayer = useCallback((id) => {
    patchProject((prev) => ({ layers: prev.layers.filter((l) => l.id !== id) }));
    setSelectedId(null);
  }, [patchProject]);

  const duplicateLayer = useCallback((id) => {
    patchProject((prev) => {
      const src = prev.layers.find((l) => l.id === id);
      if (!src) return {};
      const copy = normalizeLayer({ ...structuredClone(src), id: undefined, name: `${src.name || 'layer'} copy` });
      copy.box = { ...copy.box, y: Math.min(0.97, (copy.box?.y ?? 0.5) + 0.06) };
      return { layers: [...prev.layers, copy] };
    });
  }, [patchProject]);

  const addMusicTrack = useCallback((src = '') => {
    const track = createMusicTrack({ src });
    patchProject((prev) => ({ audio: { ...prev.audio, music: [...(prev.audio?.music || []), track] } }));
    notify(src ? `Added ${src.split('/').pop()}` : 'Added a music slot');
  }, [patchProject, notify]);

  const patchMusic = useCallback((id, patch) => {
    patchProject((prev) => ({
      audio: { ...prev.audio, music: prev.audio.music.map((m) => (m.id === id ? { ...m, ...patch } : m)) },
    }));
  }, [patchProject]);

  const removeMusic = useCallback((id) => {
    patchProject((prev) => ({ audio: { ...prev.audio, music: prev.audio.music.filter((m) => m.id !== id) } }));
  }, [patchProject]);

  const undo = useCallback(() => {
    const h = historyRef.current;
    if (!h.past.length) return;
    const prev = h.past.pop();
    setProject((cur) => {
      h.future.push(JSON.stringify(cur));
      return JSON.parse(prev);
    });
    setSaveState('dirty');
  }, []);

  /* ------------------------------ autosave ------------------------------ */
  useEffect(() => {
    if (!project || !projectId) return;
    if (skipSaveRef.current) { skipSaveRef.current = false; return; }
    clearTimeout(saveTimer.current);
    setSaveState('dirty');
    saveTimer.current = setTimeout(async () => {
      try {
        setSaveState('saving');
        await api.saveProject(projectId, project);
        setSaveState('saved');
      } catch (err) {
        setSaveState('dirty');
        notify(`Save failed: ${err.message}`, 'error');
      }
    }, 600);
    return () => clearTimeout(saveTimer.current);
  }, [project, projectId, notify]);

  /* ------------------------------ derived ------------------------------ */
  const canvas = useMemo(() => (project ? canvasOf(project) : null), [project]);
  const duration = useMemo(() => (project ? resolveDuration(project, sourceDuration) : 10), [project, sourceDuration]);
  const familyName = useMemo(() => makeFamilyLookup(boot?.fonts), [boot?.fonts]);
  const selected = useMemo(() => project?.layers?.find((l) => l.id === selectedId) || null, [project, selectedId]);
  const trimStart = project?.source?.trim?.start || 0;

  /* ------------------------------ playback ------------------------------ */
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return undefined;
    const onMeta = () => setSourceDuration(v.duration || 0);
    v.addEventListener('loadedmetadata', onMeta);
    if (v.readyState >= 1) onMeta();
    return () => v.removeEventListener('loadedmetadata', onMeta);
  }, [project?.source?.clip]);

  useEffect(() => {
    const v = videoRef.current;
    if (v) v.volume = Math.min(1, project?.source?.volume ?? 1);
  }, [project?.source?.volume, project?.source?.clip]);

  // Drive `time` from the video element while playing; fall back to a clock
  // when the project has no clip yet.
  useEffect(() => {
    if (!playing) return undefined;
    let raf;
    const v = videoRef.current;
    let last = performance.now();
    const tick = (now) => {
      if (v && project?.source?.clip) {
        const t = v.currentTime - trimStart;
        if (t >= duration - 0.02) {
          v.pause();
          setPlaying(false);
          setTime(duration);
          return;
        }
        setTime(Math.max(0, t));
      } else {
        const dt = (now - last) / 1000;
        last = now;
        setTime((prev) => {
          const next = prev + dt;
          if (next >= duration) { setPlaying(false); return duration; }
          return next;
        });
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, duration, trimStart, project?.source?.clip]);

  const seek = useCallback((t) => {
    const clamped = Math.max(0, Math.min(duration, t));
    setTime(clamped);
    const v = videoRef.current;
    if (v && project?.source?.clip) v.currentTime = trimStart + clamped;
  }, [duration, trimStart, project?.source?.clip]);

  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    setPlaying((p) => {
      const next = !p;
      if (v && project?.source?.clip) {
        if (next) {
          if (Math.abs(v.currentTime - (trimStart + time)) > 0.3) v.currentTime = trimStart + time;
          if (time >= duration - 0.05) { v.currentTime = trimStart; setTime(0); }
          v.play().catch(() => {});
        } else {
          v.pause();
        }
      }
      return next;
    });
  }, [time, duration, trimStart, project?.source?.clip]);

  /* --------- music preview: keep <audio> elements in step with t --------- */
  useEffect(() => {
    const tracks = (project?.audio?.music || []).filter((m) => m.src && m.enabled !== false);
    const map = audioRefs.current;

    for (const [src, el] of map) {
      if (!tracks.some((t) => t.src === src)) { el.pause(); map.delete(src); }
    }
    for (const t of tracks) {
      if (!map.has(t.src)) {
        const el = new Audio(`/${t.src}`);
        el.preload = 'auto';
        el.loop = t.loop !== false;
        map.set(t.src, el);
      }
    }
    for (const t of tracks) {
      const el = map.get(t.src);
      if (!el) continue;
      el.loop = t.loop !== false;
      const local = time - (t.start || 0);
      const fadeIn = t.fadeIn ? Math.min(1, Math.max(0, local / t.fadeIn)) : 1;
      const remaining = duration - (t.start || 0) - local;
      const fadeOut = t.fadeOut ? Math.min(1, Math.max(0, remaining / t.fadeOut)) : 1;
      el.volume = Math.max(0, Math.min(1, (t.volume ?? 0.35) * fadeIn * fadeOut));

      if (!playing || local < 0) {
        if (!el.paused) el.pause();
        continue;
      }
      const want = (t.offset || 0) + local;
      const target = el.duration && t.loop !== false ? want % el.duration : want;
      if (Math.abs(el.currentTime - target) > 0.35) el.currentTime = Math.max(0, target);
      if (el.paused) el.play().catch(() => {});
    }
    return undefined;
  }, [project?.audio?.music, playing, time, duration]);

  useEffect(() => () => { for (const [, el] of audioRefs.current) el.pause(); }, []);

  /* ------------------------------ render ------------------------------ */
  const startRender = useCallback(async () => {
    if (!projectId) return;
    try {
      await api.saveProject(projectId, project);
      setSaveState('saved');
      const { jobId } = await api.render({ projectId, preset: project.export?.preset });
      setJob({ id: jobId, status: 'rendering', percent: 0 });
      api.watchJob(jobId, {
        onProgress: (j) => setJob(j),
        onDone: async (j) => {
          setJob(j);
          if (j.status === 'done') {
            notify(`Rendered ${j.result?.name}`);
            const data = await refresh();
            const match = data.exports.find((e) => e.name === j.result?.name);
            setLastExport(match || { name: j.result?.name });
          } else if (j.status === 'error') {
            notify(`Render failed: ${j.error}`, 'error');
          }
        },
      });
    } catch (err) {
      notify(`Render failed: ${err.message}`, 'error');
    }
  }, [projectId, project, notify, refresh]);

  /* ------------------------------ shortcuts ------------------------------ */
  useEffect(() => {
    const onKey = (e) => {
      const tag = e.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || e.target.isContentEditable) return;
      if (e.code === 'Space') { e.preventDefault(); togglePlay(); }
      else if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) { e.preventDefault(); deleteLayer(selectedId); }
      else if ((e.metaKey || e.ctrlKey) && e.key === 'z') { e.preventDefault(); undo(); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); seek(time - (e.shiftKey ? 1 : 1 / 30)); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); seek(time + (e.shiftKey ? 1 : 1 / 30)); }
      else if (e.key === 'Escape') setSelectedId(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [togglePlay, selectedId, deleteLayer, undo, seek, time]);

  /* ------------------------------ render ui ------------------------------ */
  if (error) {
    return (
      <div className="boot-error">
        <h1>Can't reach the API</h1>
        <p>{error}</p>
        <p className="muted">Start it with <code>npm run dev</code> (studio + API together).</p>
      </div>
    );
  }
  if (!boot || !project || !canvas) {
    return <div className="boot"><div className="spinner" />Loading studio…</div>;
  }

  return (
    <div className="app">
      <TopBar
        project={project} boot={boot} saveState={saveState}
        guides={guides} setGuides={setGuides}
        onPatchProject={patchProject}
        onRender={startRender} job={job} lastExport={lastExport}
        onCancel={() => job && api.cancel(job.id)}
      />

      <div className="main">
        <Sidebar
          boot={boot} project={project} currentId={projectId}
          onRefresh={refresh}
          onAddLayer={addLayer}
          onPatchProject={patchProject}
          onAddMusicTrack={addMusicTrack}
          onOpenProject={openProject}
          onNewProject={async (name) => {
            const p = await api.createProject({ name, format: project.format });
            await refresh();
            await openProject(p.id);
          }}
          onDeleteProject={async (id) => {
            await api.deleteProject(id);
            const data = await refresh();
            if (id === projectId && data.projects[0]) await openProject(data.projects[0].id);
          }}
          notify={notify}
        />

        <div className="center">
          <Stage
            project={project} canvas={canvas} duration={duration} time={time}
            metrics={boot.metrics} familyName={familyName}
            selectedId={selectedId} onSelect={setSelectedId}
            onPatchLayer={patchLayer} videoRef={videoRef} guides={guides}
          />
          <Timeline
            project={project} duration={duration} time={time} onSeek={seek}
            selectedId={selectedId} onSelect={setSelectedId}
            onPatchLayer={patchLayer} playing={playing} onTogglePlay={togglePlay}
          />
        </div>

        <Inspector
          project={project} boot={boot} selected={selected}
          duration={duration} sourceDuration={sourceDuration}
          onPatchProject={patchProject}
          onPatchLayer={patchLayer}
          onDeleteLayer={deleteLayer}
          onDuplicateLayer={duplicateLayer}
          onAddMusic={() => addMusicTrack('')}
          onPatchMusic={patchMusic}
          onRemoveMusic={removeMusic}
        />
      </div>

      {toast && <div className={`toast ${toast.kind}`}>{toast.message}</div>}
    </div>
  );
}
