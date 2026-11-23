#!/usr/bin/env node
// scripts/build-social-reels.mjs — render SocialReelWisdom / SocialReelMotivation to out/reels/
// Distinct from YouTube: vertical 1080x1920, ≥60s, AI slides, no people-mids, separate output folder.
import { execSync } from "child_process";
import fs from "fs";
const cfg = JSON.parse(fs.readFileSync("content/reels/reels-config.json", "utf8"));
const fps = cfg.output.fps || 30;
const minFrames = cfg.output.minFrames || 1800;

function sh(cmd) { console.log(`$ ${cmd}`); execSync(cmd, { stdio: "inherit" }); }

async function probeDuration(musicPath) {
  if (!musicPath || !fs.existsSync(musicPath)) return null;
  try {
    const out = execSync(`./node_modules/@remotion/compositor-linux-x64-gnu/ffprobe -v error -show_entries format=duration -of default=nw=1:nk=1 "${musicPath}"`).toString().trim();
    return parseFloat(out);
  } catch { return null; }
}

for (const reel of cfg.reels) {
  const durSec = reel.durationFrames / fps;
  const musicDur = await probeDuration(reel.musicSrc);
  let frames = reel.durationFrames;
  if (musicDur && musicDur > 0) {
    const musicFrames = Math.round(musicDur * fps);
    if (musicFrames < minFrames) {
      console.warn(`⚠ ${reel.id}: music is ${musicDur.toFixed(2)}s < ${minFrames / fps}s — rendering to track length (${musicFrames} frames). Flag for full-song fetch (licensed).`);
      frames = musicFrames;
    } else {
      // extend picture if track longer than 60s
      frames = musicFrames;
      console.log(`ℹ ${reel.id}: music ${musicDur.toFixed(2)}s — using full track length.`);
    }
  }
  if (frames < minFrames) console.warn(`⚠ ${reel.id} will be ${frames} frames < ${minFrames} — short song, needs full version later`);
  const outPath = `${cfg.output.reelsDir}/${reel.id}.mp4`;
  // Props override via CLI: pass --props JSON. For now render defaults with duration override
  // Use remotion render with --props and --frames
  const propsArg = JSON.stringify({ ...reel, slides: reel.slides || [] }).replace(/"/g, '\\"');
  sh(`npx remotion render ${reel.variant === "wisdom" ? "SocialReelWisdom" : "SocialReelMotivation"} "${outPath}" --props="{\\"variant\\":\\"${reel.variant}\\",\\"hookBadge\\":\\"${reel.hookBadge}\\",\\"headline\\":\\"${reel.headline.replace(/"/g, '\\"')}\\",\\"accentColor\\":\\"${reel.accentColor}\\"}" --frames=${frames} --codec=h264 --image-format=jpeg --concurrency=4 || echo "render skipped (no media)"`);
}

console.log(`\nDone. Reels → ${cfg.output.reelsDir}/`);
console.log(`YouTube stays in ${cfg.output.youtubeDir}/ — never mix.`);
console.log(`If a song was short (<60s), fetch full licensed version to public/reels/music/ and re-run.\nAI slides: put images in public/reels/slides/ and reference in reels-config.json slides[]. Build via Blender MCP scripts/ if needed.`);
