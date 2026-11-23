#!/usr/bin/env node
// Build Social Reels without Remotion browser — pure Sharp + FFmpeg
// Deducted music: if public/reels/music/*.mp3 missing, render silent 60s (≥60s) to current track length placeholder
import fs from "fs";
import path from "path";
import sharp from "sharp";
import { execSync } from "child_process";
const FF = "./node_modules/@remotion/compositor-linux-x64-gnu/ffmpeg";
const FP = "./node_modules/@remotion/compositor-linux-x64-gnu/ffprobe";
const fps = 30;
const W = 1080, H = 1920;
const cfg = JSON.parse(fs.readFileSync("content/reels/reels-config.json","utf8"));

function sh(cmd){ console.log(`$ ${cmd}`); execSync(cmd,{stdio:"inherit"}); }

async function makeCard({ hookBadge, headline, bodyLine, ctaText, accent, variant, index, total, outPath }) {
  // Background gradient distinct per variant
  const bg = variant==="wisdom"
    ? { r:13,g:18,b:34 }  // deep navy
    : { r:10,g:18,b:32 };
  const accentRgb = hexToRgb(accent);
  // Create base 1080x1920
  const svg = `
  <svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="rgb(${bg.r},${bg.g},${bg.b})"/>
        <stop offset="55%" stop-color="rgb(${Math.round(bg.r*0.7)},${Math.round(bg.g*0.7)},${Math.round(bg.b*0.7)})"/>
        <stop offset="100%" stop-color="rgb(6,8,16)"/>
      </linearGradient>
      <radialGradient id="glow" cx="50%" cy="18%" r="55%">
        <stop offset="0%" stop-color="${accent}" stop-opacity="0.18"/>
        <stop offset="100%" stop-color="transparent"/>
      </radialGradient>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#g)"/>
    <rect width="${W}" height="${H}" fill="url(#glow)"/>
    <!-- vignette -->
    <rect width="${W}" height="${H}" fill="black" opacity="0.18"/>
    <!-- Progress bar top -->
    <rect x="0" y="0" width="${Math.round((index/total)*W)}" height="5" fill="${accent}"/>
    <rect x="0" y="0" width="${W}" height="5" fill="white" opacity="0.12"/>
  </svg>`;
  const base = sharp(Buffer.from(svg));

  // Composite text layers via SVG overlays
  const textSvg = `
  <svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <style>
      .badge { font-family: sans-serif; font-weight:900; font-size:22px; letter-spacing:0.18em; }
      .head { font-family: sans-serif; font-weight:900; font-size:50px; line-height:1; }
      .body { font-family: sans-serif; font-weight:800; font-size:38px; }
      .cta { font-family: sans-serif; font-weight:800; font-size:17px; }
      .dots { font-size:10px; }
    </style>
    <!-- badge -->
    <g transform="translate(${W/2}, 140)">
      <rect x="-140" y="-22" width="280" height="44" rx="22" fill="${accent}"/>
      <text text-anchor="middle" dominant-baseline="middle" class="badge" fill="#0a0a0f">${escapeXml(hookBadge)}</text>
    </g>
    <!-- headline (wrapped manually into 2 lines) -->
    <foreignObject x="40" y="210" width="${W-80}" height="200">
      <div xmlns="http://www.w3.org/1999/xhtml" style="color:white; font-family:sans-serif; font-weight:900; font-size:50px; line-height:0.95; text-align:center; text-shadow:0 4px 20px rgba(0,0,0,0.5);">
        ${escapeHtml(headline)}
      </div>
    </foreignObject>
    <!-- body card centered -->
    <g transform="translate(${W/2}, ${H/2+60})">
      <rect x="-460" y="-90" width="920" height="180" rx="20" fill="rgba(0,0,0,0.58)" stroke="${accent}" stroke-opacity="0.3" stroke-width="1"/>
      <text text-anchor="middle" dominant-baseline="middle" class="body" fill="white" x="0" y="-20">${wrapToTwoLines(bodyLine)}</text>
      <g transform="translate(0, 50)">
        ${Array.from({length: total}).map((_,i)=> `<circle cx="${(i-(total-1)/2)*20}" cy="0" r="${i===index?6:4}" fill="${i===index?accent:'rgba(255,255,255,0.35)'}"/>`).join("")}
      </g>
    </g>
    <!-- CTA bottom -->
    <g transform="translate(${W/2}, ${H-110})">
      <rect x="-300" y="-32" width="600" height="64" rx="32" fill="white"/>
      <rect x="-300" y="-32" width="600" height="64" rx="32" fill="none" stroke="black" stroke-opacity="0.08"/>
      <text text-anchor="middle" dominant-baseline="middle" class="cta" fill="#0a0a14" x="0" y="2">${escapeXml(ctaText)}</text>
    </g>
    <text x="${W-18}" y="${H-22}" text-anchor="end" fill="rgba(255,255,255,0.45)" font-family="sans-serif" font-size="11" font-weight="600" letter-spacing="0.14em">AI SLIDES • NO PEOPLE MIDS</text>
  </svg>`;
  await base.composite([{ input: Buffer.from(textSvg), top:0, left:0 }]).png().toFile(outPath);
}

function escapeXml(s){ return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); }
function escapeHtml(s){ return escapeXml(s); }
function wrapToTwoLines(s){
  // naive: split midpoint word
  const words=s.split(" ");
  if(words.length<=5) return escapeXml(s);
  const mid=Math.ceil(words.length/2);
  const a=words.slice(0,mid).join(" ");
  const b=words.slice(mid).join(" ");
  return `<tspan x="0" dy="-18">${escapeXml(a)}</tspan><tspan x="0" dy="42">${escapeXml(b)}</tspan>`;
}
function hexToRgb(hex){ hex=hex.replace("#",""); const n=parseInt(hex,16); return {r:(n>>16)&255,g:(n>>8)&255,b:n&255}; }

for(const reel of cfg.reels){
  console.log(`\n=== Building ${reel.id} (${reel.variant}) ===`);
  const musicDur = (()=>{ try{
    if(reel.musicSrc && fs.existsSync(reel.musicSrc)){
      const out=execSync(`${FP} -v error -show_entries format=duration -of default=nw=1:nk=1 "${reel.musicSrc}"`).toString().trim();
      return parseFloat(out);
    }
  }catch{} return null })();
  let frames = reel.durationFrames;
  let durSec = frames/fps;
  if(musicDur && musicDur>0){
    const mf=Math.round(musicDur*fps);
    if(mf < 1800) {
      console.warn(`⚠ ${reel.id}: music ${musicDur.toFixed(2)}s <60s — rendering to track length ${mf} frames (will fetch full song later)`);
      frames=mf; durSec=musicDur;
    } else { frames=mf; durSec=musicDur; console.log(`ℹ ${reel.id}: using full music ${musicDur.toFixed(2)}s`); }
  } else {
    console.log(`ℹ ${reel.id}: no music at ${reel.musicSrc} — rendering silent ${durSec}s placeholder (deduce music for now)`);
  }

  const tmpDir = `out/reels/tmp-${reel.id}`;
  fs.mkdirSync(tmpDir,{recursive:true});
  // Generate card per bodyLine
  const perLine = Math.floor(frames / reel.bodyLines.length);
  for(let i=0;i<reel.bodyLines.length;i++){
    const cardPath = `${tmpDir}/card-${String(i).padStart(2,"0")}.png`;
    await makeCard({
      hookBadge: reel.hookBadge,
      headline: reel.headline,
      bodyLine: reel.bodyLines[i],
      ctaText: reel.ctaText,
      accent: reel.accentColor,
      variant: reel.variant,
      index: i,
      total: reel.bodyLines.length,
      outPath: cardPath,
    });
  }
  // Build ffmpeg concat: each card duration = perLine frames @30fps
  const concatList = `${tmpDir}/concat.txt`;
  let concatContent="";
  for(let i=0;i<reel.bodyLines.length;i++){
    const card=`card-${String(i).padStart(2,"0")}.png`;
    const cardAbs = path.resolve(`${tmpDir}/${card}`);
    const dur = (perLine/fps).toFixed(3);
    concatContent += `file '${cardAbs}'\nduration ${dur}\n`;
  }
  // last frame needs extra entry without duration (ffmpeg concat quirk)
  const lastAbs = path.resolve(`${tmpDir}/card-${String(reel.bodyLines.length-1).padStart(2,"0")}.png`);
  concatContent += `file '${lastAbs}'\n`;
  const outPath = `out/reels/${reel.id}.mp4`;
  fs.mkdirSync(path.dirname(outPath),{recursive:true});
  // Build per-card 15s clips via filter_complex concat (works with Remotion minimal ffmpeg)
  const inputs = reel.bodyLines.map((_,i)=> `-loop 1 -t ${(perLine/fps).toFixed(3)} -i ${path.resolve(`${tmpDir}/card-${String(i).padStart(2,"0")}.png`)}`).join(" ");
  const vLabels = reel.bodyLines.map((_,i)=> `[${i}:v]scale=${W}:${H}:flags=lanczos,format=yuv420p[v${i}]`).join(";");
  const concatInputs = reel.bodyLines.map((_,i)=> `[v${i}]`).join("");
  const filter = `${vLabels};${concatInputs}concat=n=${reel.bodyLines.length}:v=1:a=0[v]`;
  let cmd = `${FF} -y ${inputs} -filter_complex "${filter}" -map "[v]" -c:v libx264 -pix_fmt yuv420p -r ${fps} -movflags +faststart -t ${durSec} ${outPath}`;
  if(musicDur && reel.musicSrc && fs.existsSync(reel.musicSrc)){
    const withAudio = outPath.replace(".mp4","-with-audio.mp4");
    cmd = `${FF} -y ${inputs} -i ${reel.musicSrc} -filter_complex "${filter}" -map "[v]" -map ${reel.bodyLines.length}:a -c:v libx264 -pix_fmt yuv420p -r ${fps} -c:a aac -b:a 192k -shortest -movflags +faststart -t ${durSec} ${withAudio} && mv ${withAudio} ${outPath}`;
  }
  sh(cmd);
  const probe = execSync(`${FP} -v error -show_entries stream=width,height,duration -of default=nw=1 ${outPath}`).toString();
  console.log(probe);
  console.log(`✓ ${reel.id} → ${outPath} (${durSec.toFixed(1)}s, ${frames} frames, deduced music)`);
}

console.log("\n✓ All reels built to out/reels/ — separated from out/youtube/");
