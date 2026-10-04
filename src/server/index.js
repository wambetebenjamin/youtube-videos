import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import multer from 'multer';
import {
  ROOT, MEDIA_DIR, ASSETS_DIR, FONTS_DIR, EXPORTS_DIR, SOURCE_DIR, MUSIC_DIR, IMAGES_DIR,
  PROJECTS_DIR, ensureDirs, resolveRepoPath, toRepoPath,
} from '../core/paths.js';
import { FORMAT_LIST } from '../core/formats.js';
import { STYLE_PRESETS, createProject, createLayer, normalizeProject, newId } from '../core/project.js';
import { ANIM_TYPES } from '../core/timeline.js';
import { EASINGS } from '../core/easing.js';
import { loadFonts, invalidateFonts } from './lib/fonts.js';
import { exportPresets } from './lib/presets.js';
import { ffmpegVersion, probe } from './lib/ffmpeg.js';
import {
  listMedia, listExports, listProjects, readProject, writeProject, deleteProject,
  listQuotePacks, listCanvaPresets,
} from './lib/library.js';
import { createJob, getJob, listJobs, publicJob, updateJob, logJob, finishJob, subscribe } from './lib/jobs.js';
import { renderProject } from './render/engine.js';
import { importCanva } from './lib/canva.js';

ensureDirs();

const app = express();
const PORT = Number(process.env.PORT || 8787);
const HOST = process.env.HOST || '0.0.0.0';

app.use(express.json({ limit: '32mb' }));

/* ------------------------------------------------------------------ *
 * Static files: the raw repository media, fonts and exports.
 * express.static handles Range requests, which is what lets the studio
 * scrub a 200 MB clip without downloading it first.
 * ------------------------------------------------------------------ */
const staticOpts = { maxAge: 0, etag: true, dotfiles: 'ignore' };
app.use('/media', express.static(MEDIA_DIR, staticOpts));
app.use('/assets', express.static(ASSETS_DIR, staticOpts));
app.use('/fonts', express.static(FONTS_DIR, { maxAge: '7d', immutable: false }));

/* ------------------------------ uploads ------------------------------ */
const KIND_DIRS = { video: SOURCE_DIR, music: MUSIC_DIR, image: IMAGES_DIR, font: path.join(FONTS_DIR, '_uploaded') };

function safeName(original) {
  const ext = path.extname(original).toLowerCase();
  const base = path.basename(original, ext)
    .normalize('NFKD')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 70) || 'file';
  return { base, ext };
}

const storage = multer.diskStorage({
  destination(req, file, cb) {
    const dir = KIND_DIRS[req.query.kind] || SOURCE_DIR;
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename(req, file, cb) {
    const { base, ext } = safeName(file.originalname);
    let name = `${base}${ext}`;
    const dir = KIND_DIRS[req.query.kind] || SOURCE_DIR;
    let i = 2;
    while (fs.existsSync(path.join(dir, name))) name = `${base}-${i++}${ext}`;
    cb(null, name);
  },
});
const upload = multer({ storage, limits: { fileSize: 4 * 1024 * 1024 * 1024 } });

app.post('/api/upload', upload.array('files', 24), async (req, res) => {
  const kind = req.query.kind || 'video';
  const out = [];
  for (const f of req.files || []) {
    const entry = { name: f.filename, path: toRepoPath(f.path), bytes: f.size, kind };
    if (kind === 'video' || kind === 'music') {
      try { entry.info = await probe(f.path); } catch (err) { entry.error = err.message; }
    }
    out.push(entry);
  }
  if (kind === 'font') {
    try {
      const { execFileSync } = await import('node:child_process');
      execFileSync(process.execPath, [path.join(ROOT, 'scripts', 'fonts.mjs')], { cwd: ROOT });
      invalidateFonts();
    } catch (err) {
      return res.status(500).json({ error: `font imported but manifest rebuild failed: ${err.message}`, files: out });
    }
  }
  res.json({ files: out });
});

/* ------------------------------ bootstrap ------------------------------ */
app.get('/api/health', (req, res) => res.json({ ok: true }));

app.get('/api/bootstrap', async (req, res) => {
  try {
    const fonts = loadFonts({ force: req.query.fresh === '1' });
    const [media, exportsList] = await Promise.all([listMedia(), listExports()]);
    res.json({
      formats: FORMAT_LIST,
      exportPresets: Object.values(exportPresets()),
      stylePresets: Object.entries(STYLE_PRESETS).map(([id, v]) => ({ id, ...v })),
      animations: Object.entries(ANIM_TYPES).map(([id, v]) => ({ id, label: v.label, previewOnly: !!v.previewOnly })),
      easings: Object.entries(EASINGS).map(([id, v]) => ({ id, label: v.label })),
      fonts: fonts.manifest,
      metrics: fonts.metrics,
      projects: listProjects(),
      media,
      exports: exportsList,
      quotes: listQuotePacks(),
      canva: listCanvaPresets(),
      jobs: listJobs(),
      ffmpeg: await ffmpegVersion().catch(() => 'unavailable'),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/media', async (req, res) => {
  try { res.json(await listMedia()); } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/media', (req, res) => {
  try {
    const abs = resolveRepoPath(req.query.path);
    if (!abs || !abs.startsWith(MEDIA_DIR)) return res.status(400).json({ error: 'path must be inside media/' });
    if (fs.existsSync(abs)) fs.unlinkSync(abs);
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/* ------------------------------ projects ------------------------------ */
app.get('/api/projects', (req, res) => res.json(listProjects()));

app.get('/api/projects/:id', (req, res) => {
  const p = readProject(req.params.id);
  if (!p) return res.status(404).json({ error: 'not found' });
  res.json(p);
});

app.post('/api/projects', (req, res) => {
  try {
    const { name = 'Untitled', format = 'reel', from, clip } = req.body || {};
    let base;
    if (from) {
      const src = readProject(from);
      if (!src) return res.status(404).json({ error: `template not found: ${from}` });
      base = { ...src, name, layers: src.layers.map((l) => ({ ...l, id: newId(l.type[0]) })) };
    } else {
      base = createProject({ name, format });
    }
    const id = uniqueProjectId(name);
    if (clip) base.source = { ...base.source, clip };
    res.json(writeProject(id, { ...base, id, name }));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/projects/:id', (req, res) => {
  try {
    res.json(writeProject(req.params.id, req.body));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/projects/:id', (req, res) => {
  deleteProject(req.params.id);
  res.json({ ok: true });
});

function uniqueProjectId(name) {
  const base = String(name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 48) || 'project';
  let id = base;
  let i = 2;
  while (fs.existsSync(path.join(PROJECTS_DIR, `${id}.json`))) id = `${base}-${i++}`;
  return id;
}

/* ------------------------------ layers helper ------------------------------ */
app.post('/api/layer', (req, res) => {
  const { type = 'text', ...patch } = req.body || {};
  res.json(createLayer(type, patch));
});

/* ------------------------------ render ------------------------------ */
app.post('/api/render', async (req, res) => {
  try {
    const { projectId, project: inline, preset } = req.body || {};
    const project = inline ? normalizeProject(inline) : readProject(projectId);
    if (!project) return res.status(404).json({ error: 'project not found' });

    const job = createJob({ projectId: project.id, projectName: project.name, preset: preset || project.export?.preset });
    res.json({ jobId: job.id });

    updateJob(job, { status: 'rendering' });
    renderProject(project, {
      jobId: job.id,
      preset: preset || project.export?.preset,
      signal: job.controller.signal,
      onLog: (line) => logJob(job, line),
      onProgress: (p) => updateJob(job, {
        percent: Math.round(p.percent * 10) / 10,
        seconds: p.seconds,
        duration: p.duration,
        speed: p.speed,
      }),
      onLogRaw: (chunk) => {
        const line = String(chunk).trim().split('\n').pop();
        if (line && /error|invalid|failed/i.test(line)) logJob(job, line);
      },
    })
      .then((result) => finishJob(job, { status: 'done', percent: 100, result }))
      .catch((err) => finishJob(job, { status: job.controller.signal.aborted ? 'cancelled' : 'error', error: err.message }));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/render/:id', (req, res) => {
  const job = getJob(req.params.id);
  if (!job) return res.status(404).json({ error: 'no such job' });
  res.json(publicJob(job));
});

app.post('/api/render/:id/cancel', (req, res) => {
  const job = getJob(req.params.id);
  if (!job) return res.status(404).json({ error: 'no such job' });
  job.controller.abort();
  res.json({ ok: true });
});

app.get('/api/render/:id/stream', (req, res) => {
  const job = getJob(req.params.id);
  if (!job) return res.status(404).json({ error: 'no such job' });
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.write('\n');
  subscribe(job, res);
  if (job.status === 'done' || job.status === 'error' || job.status === 'cancelled') {
    res.write(`event: done\ndata: ${JSON.stringify(publicJob(job))}\n\n`);
    res.end();
  }
});

app.get('/api/jobs', (req, res) => res.json(listJobs()));

/* ------------------------------ exports / download ------------------------------ */
app.get('/api/exports', async (req, res) => {
  try { res.json(await listExports()); } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/download/:name', (req, res) => {
  const name = path.basename(req.params.name);
  const abs = path.join(EXPORTS_DIR, name);
  if (!abs.startsWith(EXPORTS_DIR) || !fs.existsSync(abs)) return res.status(404).send('not found');
  res.download(abs, name);
});

app.delete('/api/exports/:name', (req, res) => {
  const name = path.basename(req.params.name);
  for (const f of [path.join(EXPORTS_DIR, name), path.join(EXPORTS_DIR, name.replace(/\.[^.]+$/, '.jpg')), path.join(EXPORTS_DIR, `${name}.json`)]) {
    if (f.startsWith(EXPORTS_DIR) && fs.existsSync(f)) fs.unlinkSync(f);
  }
  res.json({ ok: true });
});

/* ------------------------------ content ------------------------------ */
app.get('/api/quotes', (req, res) => res.json(listQuotePacks()));
app.get('/api/fonts', (req, res) => {
  const fonts = loadFonts({ force: req.query.fresh === '1' });
  res.json({ manifest: fonts.manifest, metrics: fonts.metrics });
});

/* ------------------------------ canva ------------------------------ */
app.get('/api/canva', (req, res) => res.json(listCanvaPresets()));
app.post('/api/canva/import', async (req, res) => {
  try {
    res.json(await importCanva(req.body || {}));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/* ------------------------------ built studio ------------------------------ */
if (process.argv.includes('--serve-studio')) {
  const dist = path.join(ROOT, 'dist');
  if (fs.existsSync(dist)) {
    app.use(express.static(dist));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api/')) return next();
      res.sendFile(path.join(dist, 'index.html'));
    });
  }
}

app.use((err, req, res, next) => {
  console.error('[api]', err);
  res.status(500).json({ error: err.message });
});

app.listen(PORT, HOST, () => {
  console.log(`  API    http://${HOST}:${PORT}`);
});
