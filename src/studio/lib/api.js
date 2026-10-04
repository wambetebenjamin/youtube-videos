/**
 * Everything here uses relative URLs on purpose: the browser talks to the
 * Vite dev server, which proxies /api, /media, /assets and /fonts through
 * to the Node API. That keeps the app working behind an HTTPS preview
 * proxy where "localhost" means nothing.
 */
async function request(url, options = {}) {
  const res = await fetch(url, {
    headers: options.body && !(options.body instanceof FormData) ? { 'Content-Type': 'application/json' } : undefined,
    ...options,
    body: options.body instanceof FormData ? options.body : options.body ? JSON.stringify(options.body) : undefined,
  });
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = { raw: text }; }
  if (!res.ok) throw new Error(data?.error || `${res.status} ${res.statusText}`);
  return data;
}

export const api = {
  bootstrap: () => request('/api/bootstrap'),
  media: () => request('/api/media'),
  exports: () => request('/api/exports'),
  projects: () => request('/api/projects'),
  project: (id) => request(`/api/projects/${id}`),
  saveProject: (id, project) => request(`/api/projects/${id}`, { method: 'PUT', body: project }),
  createProject: (body) => request('/api/projects', { method: 'POST', body }),
  deleteProject: (id) => request(`/api/projects/${id}`, { method: 'DELETE' }),
  newLayer: (body) => request('/api/layer', { method: 'POST', body }),
  render: (body) => request('/api/render', { method: 'POST', body }),
  job: (id) => request(`/api/render/${id}`),
  cancel: (id) => request(`/api/render/${id}/cancel`, { method: 'POST' }),
  deleteExport: (name) => request(`/api/exports/${encodeURIComponent(name)}`, { method: 'DELETE' }),
  deleteMedia: (p) => request(`/api/media?path=${encodeURIComponent(p)}`, { method: 'DELETE' }),
  canvaImport: (body) => request('/api/canva/import', { method: 'POST', body }),

  upload(files, kind, onProgress) {
    return new Promise((resolve, reject) => {
      const form = new FormData();
      for (const f of files) form.append('files', f);
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `/api/upload?kind=${kind}`);
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) onProgress?.(e.loaded / e.total);
      });
      xhr.onload = () => {
        try {
          const data = JSON.parse(xhr.responseText);
          if (xhr.status >= 200 && xhr.status < 300) resolve(data);
          else reject(new Error(data?.error || `upload failed (${xhr.status})`));
        } catch (err) { reject(err); }
      };
      xhr.onerror = () => reject(new Error('upload failed'));
      xhr.send(form);
    });
  },

  /** Server-sent events for a render job. */
  watchJob(id, { onProgress, onLog, onDone }) {
    const es = new EventSource(`/api/render/${id}/stream`);
    es.addEventListener('progress', (e) => onProgress?.(JSON.parse(e.data)));
    es.addEventListener('log', (e) => onLog?.(JSON.parse(e.data)));
    es.addEventListener('done', (e) => { onDone?.(JSON.parse(e.data)); es.close(); });
    es.onerror = () => es.close();
    return () => es.close();
  },
};

export function fmtBytes(n) {
  if (!n) return '0 B';
  const u = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(u.length - 1, Math.floor(Math.log(n) / Math.log(1024)));
  return `${(n / 1024 ** i).toFixed(i ? 1 : 0)} ${u[i]}`;
}

export function fmtTime(s) {
  if (!Number.isFinite(s)) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  const cs = Math.floor((s % 1) * 10);
  return `${m}:${String(sec).padStart(2, '0')}.${cs}`;
}
