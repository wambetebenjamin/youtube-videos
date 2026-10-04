import { randomUUID } from 'node:crypto';

const jobs = new Map();
const MAX_JOBS = 40;

export function createJob(meta = {}) {
  const job = {
    id: randomUUID().slice(0, 8),
    status: 'queued',
    percent: 0,
    seconds: 0,
    duration: 0,
    speed: '',
    log: [],
    result: null,
    error: null,
    createdAt: Date.now(),
    endedAt: null,
    controller: new AbortController(),
    subscribers: new Set(),
    ...meta,
  };
  jobs.set(job.id, job);

  // Keep the registry from growing forever.
  if (jobs.size > MAX_JOBS) {
    const stale = [...jobs.values()]
      .filter((j) => j.status === 'done' || j.status === 'error' || j.status === 'cancelled')
      .sort((a, b) => a.createdAt - b.createdAt)
      .slice(0, jobs.size - MAX_JOBS);
    for (const j of stale) jobs.delete(j.id);
  }
  return job;
}

export function getJob(id) {
  return jobs.get(id);
}

export function listJobs() {
  return [...jobs.values()].map(publicJob).sort((a, b) => b.createdAt - a.createdAt);
}

export function publicJob(job) {
  if (!job) return null;
  const { controller, subscribers, log, ...rest } = job;
  return { ...rest, log: log.slice(-40) };
}

export function updateJob(job, patch) {
  if (!job) return;
  Object.assign(job, patch);
  emit(job, 'progress', publicJob(job));
}

export function logJob(job, line) {
  if (!job) return;
  job.log.push(line);
  if (job.log.length > 400) job.log.shift();
  emit(job, 'log', { line });
}

export function finishJob(job, patch) {
  if (!job) return;
  Object.assign(job, patch, { endedAt: Date.now() });
  emit(job, 'done', publicJob(job));
  for (const res of job.subscribers) {
    try { res.end(); } catch { /* client already gone */ }
  }
  job.subscribers.clear();
}

export function subscribe(job, res) {
  job.subscribers.add(res);
  res.on('close', () => job.subscribers.delete(res));
  emit(job, 'progress', publicJob(job));
}

function emit(job, event, data) {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const res of job.subscribers) {
    try { res.write(payload); } catch { job.subscribers.delete(res); }
  }
}
