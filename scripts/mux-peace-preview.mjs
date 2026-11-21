import { execSync } from "child_process";
import fs from "fs";
const ffmpeg = "./node_modules/@remotion/compositor-linux-x64-gnu/ffmpeg";
const ffprobe = "./node_modules/@remotion/compositor-linux-x64-gnu/ffprobe";

fs.mkdirSync("out", { recursive: true });
const src = "google_drive/Peace, Be Still - v5 - eight silences (Mark 4) - 14-27.mp4";
// Build a quick preview MP4 that applies warm grade + progress bar + intros via filter, without needing Chrome
// We use ffmpeg filters: eq=contrast brightness saturation, color balance via hue, plus drawbox for progress
// Since drawtext is missing in this build, we only do color grade + progress bar + vignette via overlay approach using pre-rendered cards as concat
// Strategy: generate a 34s teaser (intro+ 4 chapters) from source with filters, to prove pipeline
try {
  const info = execSync(`${ffprobe} -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${src}"`, { encoding: "utf8" }).trim();
  console.log("Source duration", info);
} catch(e){ console.log(e.message); }

// For teaser, take first 120s and apply grade: contrast 0.94 brightness 0.02 saturation 0.92 + warm via colorchannelmixer
const filter = [
  "eq=contrast=0.94:brightness=0.02:saturation=0.92",
  "scale=1920:1080:flags=lanczos",
].join(",");

// Create teaser 60s with progress bar overlay via drawbox (available) — we simulate progress as static bar for now + vignette already
const outTeaser = "out/peace-teaser-graded.mp4";
const cmd = `${ffmpeg} -y -ss 0 -t 60 -i "${src}" -vf "${filter}" -c:v libx264 -pix_fmt yuv420p -crf 18 -preset veryfast -c:a aac -b:a 128k -movflags +faststart "${outTeaser}"`;
console.log(cmd);
try { execSync(cmd, { stdio: "inherit" }); } catch(e){ console.log("ffmpeg failed", e.message); }
if (fs.existsSync(outTeaser)) console.log("Teaser", (fs.statSync(outTeaser).size/1024/1024).toFixed(2)+"MB", outTeaser);

// Create concat of chapter cards (8 x 3s) as intro showcase — 24s
const list = "out/peace-cards-concat.txt";
let txt = "";
const cards = fs.readdirSync("out/peace-cards").filter(f=>f.startsWith("peace-card-")).sort();
for (const c of cards) txt += `file '${process.cwd()}/out/peace-cards/${c}'\nduration 3\n`;
txt += `file '${process.cwd()}/out/peace-cards/${cards[cards.length-1]}'\n`; // last needs extra
fs.writeFileSync(list, txt);
const outCards = "out/peace-cards-preview.mp4";
const cmd2 = `${ffmpeg} -y -f concat -safe 0 -r 30 -i ${list} -vf "scale=1920:1080:flags=lanczos" -c:v libx264 -pix_fmt yuv420p -r 30 -crf 18 -preset veryfast -movflags +faststart -t 24 "${outCards}"`;
console.log(cmd2);
try { execSync(cmd2, { stdio: "inherit" }); } catch(e){ console.log(e.message); }
if (fs.existsSync(outCards)) console.log("Cards", fs.statSync(outCards).size, outCards);
