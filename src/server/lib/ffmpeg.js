import { spawn, execFile } from 'node:child_process';
import { promisify } from 'node:util';
import fs from 'node:fs';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import ffprobeInstaller from '@ffprobe-installer/ffprobe';

const execFileAsync = promisify(execFile);

export const FFMPEG = process.env.FFMPEG_PATH || ffmpegInstaller.path;
export const FFPROBE = process.env.FFPROBE_PATH || ffprobeInstaller.path;

export async function ffmpegVersion() {
  const { stdout } = await execFileAsync(FFMPEG, ['-hide_banner', '-version']);
  return stdout.split('\n')[0];
}

/** ffprobe a media file into a small, predictable shape. */
export async function probe(file) {
  if (!fs.existsSync(file)) throw new Error(`file not found: ${file}`);
  const { stdout } = await execFileAsync(FFPROBE, [
    '-v', 'error',
    '-print_format', 'json',
    '-show_format',
    '-show_streams',
    file,
  ], { maxBuffer: 1024 * 1024 * 16 });

  const data = JSON.parse(stdout);
  const video = (data.streams || []).find((s) => s.codec_type === 'video');
  const audio = (data.streams || []).find((s) => s.codec_type === 'audio');
  const duration = Number(data.format?.duration) || Number(video?.duration) || Number(audio?.duration) || 0;

  let fps = 0;
  if (video?.avg_frame_rate && video.avg_frame_rate !== '0/0') {
    const [a, b] = video.avg_frame_rate.split('/').map(Number);
    if (b) fps = a / b;
  }

  // Rotation metadata (phone footage) flips the effective dimensions.
  const rotation = Number(
    video?.tags?.rotate ?? (video?.side_data_list || []).find((s) => s.rotation != null)?.rotation ?? 0,
  );
  const swapped = Math.abs(rotation) === 90 || Math.abs(rotation) === 270;
  const width = swapped ? video?.height : video?.width;
  const height = swapped ? video?.width : video?.height;

  return {
    duration,
    size: Number(data.format?.size) || 0,
    bitrate: Number(data.format?.bit_rate) || 0,
    formatName: data.format?.format_name || '',
    hasVideo: !!video,
    hasAudio: !!audio,
    width: width || 0,
    height: height || 0,
    fps: Math.round(fps * 1000) / 1000,
    rotation,
    videoCodec: video?.codec_name || null,
    audioCodec: audio?.codec_name || null,
    aspect: width && height ? width / height : 0,
  };
}

/**
 * Run FFmpeg, streaming progress out of `-progress pipe:1`.
 * onProgress receives { seconds, fps, speed } as the render advances.
 */
export function runFFmpeg(args, { onProgress, onLog, signal } = {}) {
  return new Promise((resolve, reject) => {
    const proc = spawn(FFMPEG, ['-hide_banner', '-nostdin', ...args], {
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stderrTail = '';
    let partial = '';

    proc.stdout.on('data', (chunk) => {
      partial += chunk.toString();
      const lines = partial.split('\n');
      partial = lines.pop() || '';
      const kv = {};
      for (const line of lines) {
        const i = line.indexOf('=');
        if (i > 0) kv[line.slice(0, i).trim()] = line.slice(i + 1).trim();
      }
      if (kv.out_time_ms != null || kv.out_time != null) {
        const seconds = kv.out_time_ms != null
          ? Number(kv.out_time_ms) / 1e6
          : hmsToSeconds(kv.out_time);
        onProgress?.({
          seconds: Number.isFinite(seconds) ? Math.max(0, seconds) : 0,
          fps: Number(kv.fps) || 0,
          speed: kv.speed || '',
          frame: Number(kv.frame) || 0,
        });
      }
    });

    proc.stderr.on('data', (chunk) => {
      const s = chunk.toString();
      stderrTail = (stderrTail + s).slice(-8000);
      onLog?.(s);
    });

    if (signal) {
      signal.addEventListener('abort', () => proc.kill('SIGKILL'), { once: true });
    }

    proc.on('error', reject);
    proc.on('close', (code) => {
      if (code === 0) resolve({ code, stderr: stderrTail });
      else reject(Object.assign(new Error(`ffmpeg exited with code ${code}\n${stderrTail}`), { stderr: stderrTail, code }));
    });
  });
}

function hmsToSeconds(hms) {
  if (!hms) return 0;
  const parts = String(hms).split(':').map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return Number(hms) || 0;
}

/** Grab a single frame as a JPEG (used for media thumbnails + export posters). */
export async function thumbnail(input, output, { at = 1, width = 480 } = {}) {
  await execFileAsync(FFMPEG, [
    '-hide_banner', '-loglevel', 'error', '-y',
    '-ss', String(at),
    '-i', input,
    '-frames:v', '1',
    '-vf', `scale=${width}:-2:force_original_aspect_ratio=decrease`,
    '-q:v', '4',
    output,
  ]);
  return output;
}
