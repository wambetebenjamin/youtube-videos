import { spawn } from "child_process";
import fs from "fs";
import path from "path";

const ffmpeg = path.join(process.cwd(), "node_modules/@remotion/compositor-linux-x64-gnu/ffmpeg");
const outDir = path.join(process.cwd(), "out");

// Chapter durations in seconds (must sum ~120s) — derived from AbbasStories.tsx CHAPTERS
const segments = [
  { file: "abbas-still-intro.png", duration: 10 },
  { file: "abbas-still-law1.png", duration: 14 },
  { file: "abbas-still-parable.png", duration: 15 },
  { file: "abbas-still-buried.png", duration: 11 },
  { file: "abbas-still-takeaway1.png", duration: 11 },
  { file: "abbas-still-law2.png", duration: 14 },
  { file: "abbas-still-keys.png", duration: 21 },
  { file: "abbas-still-closing.png", duration: 14 },
  // outro extra 10s reusing closing for CTA
  { file: "abbas-still-closing.png", duration: 10 },
];

const total = segments.reduce((a, s) => a + s.duration, 0);
console.log(`Total target duration: ${total}s`);

// Build concat file list
const listPath = path.join(outDir, "abbas-concat.txt");
let listContent = "";
for (const seg of segments) {
  const abs = path.join(outDir, seg.file);
  if (!fs.existsSync(abs)) {
    console.error(`Missing ${abs}`);
    process.exit(1);
  }
  // ffmpeg concat demuxer expects: file 'path'\n duration N
  listContent += `file '${abs}'\n`;
  listContent += `duration ${seg.duration}\n`;
}
 // last file needs to be listed again without duration for concat demuxer
listContent += `file '${path.join(outDir, segments[segments.length-1].file)}'\n`;
fs.writeFileSync(listPath, listContent);
console.log(listPath, "\n", listContent);

// Also create silent audio (AAC) 120s to allow muxing with audio track placeholder
// Use anullsrc 48k stereo silent
const outMp4 = path.join(outDir, "abbas-stories-preview.mp4");

function runFfmpeg(args) {
  return new Promise((resolve, reject) => {
    console.log(`\n$ ${ffmpeg} ${args.join(" ")}\n`);
    const p = spawn(ffmpeg, args, { stdio: "inherit" });
    p.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`ffmpeg exit ${code}`))));
    p.on("error", reject);
  });
}

// Generate video from concat list at 30fps, 1920x1080, yuv420p, faststart
async function main() {
  // Try path A: concat demuxer with re-encoding
  try {
    await runFfmpeg([
      "-f", "concat",
      "-safe", "0",
      "-i", listPath,
      "-vf", "scale=1920:1080:flags=lanczos",
      "-r", "30",
      "-c:v", "libx264",
      "-pix_fmt", "yuv420p",
      "-profile:v", "high",
      "-crf", "18",
      "-preset", "medium",
      "-movflags", "+faststart",
      "-y",
      outMp4,
    ]);
    console.log(`\n✓ Video created: ${outMp4} (${total}s)`);
  } catch (e) {
    console.log("Concat demuxer failed, trying per-segment encode + concat...");
    // Fallback: encode each segment individually then concat via intermediate files
    // For brevity, just try loop input single file test
    console.error(e);
    process.exit(1);
  }

  // Print probe
  const ffprobe = ffmpeg.replace("ffmpeg", "ffprobe");
  if (fs.existsSync(ffprobe)) {
    const { spawnSync } = await import("child_process");
    const r = spawnSync(ffprobe, ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height,avg_frame_rate,duration,codec_name", "-of", "default=noprint_wrappers=1", outMp4], { encoding: "utf-8" });
    console.log("\n--- Probe ---\n" + (r.stdout || "") + (r.stderr || ""));
  }
}

main();
