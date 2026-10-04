/**
 * Canvas formats.
 *
 * `safe` describes the zone that platform UI (captions, profile name, CTA
 * buttons, the progress scrubber) covers on each platform. The studio draws
 * these as guides so your quotes never end up behind the "Follow" button.
 */
export const FORMATS = {
  reel: {
    id: 'reel',
    label: 'Reel / Short / TikTok',
    width: 1080,
    height: 1920,
    fps: 30,
    aspect: '9:16',
    safe: { top: 0.07, bottom: 0.19, left: 0.05, right: 0.14 },
    note: 'Right edge and bottom fifth are covered by platform UI.',
  },
  'reel-hd': {
    id: 'reel-hd',
    label: 'Reel (1440p)',
    width: 1440,
    height: 2560,
    fps: 30,
    aspect: '9:16',
    safe: { top: 0.07, bottom: 0.19, left: 0.05, right: 0.14 },
  },
  youtube: {
    id: 'youtube',
    label: 'YouTube 1080p',
    width: 1920,
    height: 1080,
    fps: 30,
    aspect: '16:9',
    safe: { top: 0.05, bottom: 0.12, left: 0.05, right: 0.05 },
    note: 'Bottom strip is covered by the player scrubber on hover.',
  },
  'youtube-4k': {
    id: 'youtube-4k',
    label: 'YouTube 4K',
    width: 3840,
    height: 2160,
    fps: 30,
    aspect: '16:9',
    safe: { top: 0.05, bottom: 0.12, left: 0.05, right: 0.05 },
  },
  square: {
    id: 'square',
    label: 'Square (feed)',
    width: 1080,
    height: 1080,
    fps: 30,
    aspect: '1:1',
    safe: { top: 0.05, bottom: 0.08, left: 0.05, right: 0.05 },
  },
  portrait45: {
    id: 'portrait45',
    label: 'Portrait 4:5 (feed)',
    width: 1080,
    height: 1350,
    fps: 30,
    aspect: '4:5',
    safe: { top: 0.05, bottom: 0.08, left: 0.05, right: 0.05 },
  },
};

export const FORMAT_LIST = Object.values(FORMATS);

export function getFormat(id) {
  return FORMATS[id] || FORMATS.reel;
}

/** Canvas for a project: an explicit canvas wins over the named format. */
export function canvasOf(project) {
  const f = getFormat(project?.format);
  return {
    width: project?.canvas?.width || f.width,
    height: project?.canvas?.height || f.height,
    fps: project?.canvas?.fps || f.fps,
    background: project?.canvas?.background || '#000000',
    safe: f.safe,
    formatId: f.id,
  };
}
