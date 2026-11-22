#!/usr/bin/env node
/**
 * scripts/image-to-video.mjs
 * Free Image → Video via Hugging Face Gradio Spaces (no paid key, no local GPU)
 *
 * Uses @gradio/client to call public HF Spaces for Wan2.2-I2V / LTX-Video.
 * Also documents how to use uglylee/free-video-generator + lcy362/agnes-video-generator as reference.
 *
 * Usage:
 *   node scripts/image-to-video.mjs --image public/pics/abbas/01.jpg --prompt "slow Ken Burns, cinematic, gentle zoom" --out out/anim-01.mp4
 *   node scripts/image-to-video.mjs --image public/pics/abbas/01.jpg --space Wan-Video/Wan2.2-I2V --duration 5
 *   node scripts/image-to-video.mjs --list-spaces   # shows recommended free Spaces
 *   node scripts/image-to-video.mjs --image public/pics/abbas/01.jpg --dry-run  # no call, just shows what would happen
 *
 * When no raw footage exists:
 *   1. Generate stills with scripts/generate-peace-stills.mjs
 *   2. Animate each still with this script into 5s clips
 *   3. Concat via scripts/build-full-hd.mjs or Remotion composition
 *
 * References (see REFERENCE.md):
 *   - https://github.com/uglylee/free-video-generator (Agnes free cloud, multi-scene)
 *   - https://github.com/lcy362/agnes-video-generator (self-hosted UI)
 *   - https://huggingface.co/models?pipeline_tag=image-to-video (Wan2.2, LTX)
 */
import fs from "fs";
import path from "path";

const RECOMMENDED_SPACES = [
  { id: "Wan-Video/Wan2.2-I2V-A14B", model: "Wan2.2-I2V-A14B", note: "Wan 2.2 image-to-video, free community GPU — check HF Space is running" },
  { id: "Lightricks/LTX-Video", model: "LTX-Video", note: "13B image-to-video, fast free tier" },
  { id: "huggingface-projects/wan2.2-image-to-video", model: "Wan2.2", note: "alt HF demo space — search HF if offline" },
];

function parseArgs() {
  const args = process.argv.slice(2);
  const out = {};
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "--image") out.image = args[++i];
    else if (a === "--prompt") out.prompt = args[++i];
    else if (a === "--space") out.space = args[++i];
    else if (a === "--out") out.out = args[++i];
    else if (a === "--duration") out.duration = parseInt(args[++i], 10);
    else if (a === "--dry-run") out.dryRun = true;
    else if (a === "--list-spaces") out.listSpaces = true;
    else if (a === "--help" || a === "-h") out.help = true;
  }
  return out;
}

function printHelp() {
  console.log(`
image-to-video.mjs — free image → video via HF Gradio

  --image <path>       Input image (jpg/png) — required unless --list-spaces
  --prompt <text>      Motion prompt, e.g. "slow cinematic zoom, gentle pan"
  --space <id>         HF Space ID (default: Wan-Video/Wan2.2-I2V-A14B)
  --out <path>         Output mp4 path (default: out/anim-<basename>.mp4)
  --duration <n>       Seconds 3-8 (default 5, Space-dependent)
  --dry-run            Don't call HF, just log plan
  --list-spaces        Show recommended free Spaces
  --help

Examples:
  node scripts/image-to-video.mjs --image public/pics/abbas/01.jpg --prompt "slow Ken Burns" --out out/anim-01.mp4
  node scripts/image-to-video.mjs --image public/pics/abbas/01.jpg --dry-run

Agnes alternative (uglylee/free-video-generator):
  See REFERENCE.md — clone references/free-video-generator and copy its
  src/api/video.ts upload handler. This script is the HF path; Agnes path
  is documented in references/agnes-client.example.mjs (to be added).
`);
}

async function main() {
  const opts = parseArgs();
  if (opts.help) return printHelp();
  if (opts.listSpaces) {
    console.log("Recommended free HF Spaces (verify each is 'Running' on HF):");
    for (const s of RECOMMENDED_SPACES) console.log(`  - ${s.id}  [${s.model}] — ${s.note}`);
    console.log("\nAdd your own: https://huggingface.co/spaces?search=image-to-video");
    return;
  }
  if (!opts.image) {
    console.error("Missing --image. Run with --help for usage.");
    process.exit(1);
  }
  const imagePath = path.resolve(opts.image);
  if (!fs.existsSync(imagePath)) {
    console.error(`Image not found: ${imagePath}`);
    process.exit(1);
  }
  const spaceId = opts.space || "Wan-Video/Wan2.2-I2V-A14B";
  const prompt = opts.prompt || "slow cinematic Ken Burns, gentle zoom in, subtle parallax, 24fps";
  const duration = opts.duration || 5;
  const outPath = path.resolve(opts.out || `out/anim-${path.basename(imagePath, path.extname(imagePath))}.mp4`);

  console.log(`[image-to-video] image=${imagePath}`);
  console.log(`[image-to-video] space=${spaceId} duration=${duration}s`);
  console.log(`[image-to-video] prompt="${prompt}"`);
  console.log(`[image-to-video] out=${outPath}`);

  if (opts.dryRun) {
    console.log("[dry-run] Would: Client.connect(spaceId) -> predict with image Blob + prompt");
    console.log("[dry-run] Then download returned video URL to out path");
    return;
  }

  // Live call — requires internet to HF and a running Space (free quota may queue)
  let Client;
  try {
    ({ Client } = await import("@gradio/client"));
  } catch (e) {
    console.error("Missing @gradio/client. Run: npm install @gradio/client");
    throw e;
  }

  console.log(`[image-to-video] Connecting to ${spaceId} ...`);
  const app = await Client.connect(spaceId);
  console.log(`[image-to-video] Connected. Endpoints:`, Object.keys(app.config?.dependencies || {}).slice(0, 8));

  const blob = new Blob([fs.readFileSync(imagePath)]);
  // Most Wan/LTX Spaces expose /predict or /generate — try common signatures
  // This is intentionally generic: inspect Space's API docs if it fails.
  let result;
  try {
    // Attempt 1: standard image+prompt
    result = await app.predict("/predict", { image: blob, prompt, duration });
  } catch (e1) {
    console.warn("[image-to-video] /predict failed, trying /generate ...", e1.message?.slice(0, 200));
    result = await app.predict("/generate", [blob, prompt, duration]);
  }

  console.log("[image-to-video] result:", JSON.stringify(result?.data || result, null, 2)?.slice(0, 2000));

  const data = result?.data;
  // HF Spaces typically return { video: { url } } or a file path
  let videoUrl = null;
  if (Array.isArray(data)) {
    for (const v of data) {
      if (v?.url) videoUrl = v.url;
      if (typeof v === "string" && v.startsWith("http")) videoUrl = v;
    }
  } else if (data?.url) videoUrl = data.url;
  else if (data?.video?.url) videoUrl = data.video.url;

  if (!videoUrl) {
    console.error("[image-to-video] Could not find video URL in response. Check Space API shape. Full data logged above.");
    process.exit(2);
  }

  console.log(`[image-to-video] Downloading ${videoUrl} -> ${outPath} ...`);
  const res = await fetch(videoUrl);
  if (!res.ok) throw new Error(`Download failed ${res.status} ${res.statusText}`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, buf);
  console.log(`[image-to-video] Saved ${buf.length} bytes to ${outPath}`);
}

main().catch(e => { console.error(e); process.exit(1); });
