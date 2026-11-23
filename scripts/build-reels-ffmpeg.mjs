#!/usr/bin/env node
// Build Social Reels — authentic TikTok caption styles (NO AI captions)
// Styles from your uploads: pill-top, centered-bold, minimal-lower, samurai-quote
// All use simple white text + black shadow, no AI word-highlight/dots/accent tracking
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

function escapeXml(s){ return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); }

// Wrap text into lines for centered display
function wrapText(text, maxChars=28){
  const words=text.split(" ");
  const lines=[];
  let cur="";
  for(const w of words){
    if((cur+" "+w).trim().length > maxChars && cur){
      lines.push(cur.trim());
      cur=w;
    } else cur=(cur+" "+w).trim();
  }
  if(cur) lines.push(cur);
  return lines;
}

async function makeCard({ hookBadge, headline, bodyLine, captionStyle, variant, outPath }) {
  // Use headline for first frame, bodyLine for others — replicate TikTok: top text is hook, center is quote
  const isHeadline = !bodyLine || bodyLine === headline;
  const text = isHeadline ? headline : bodyLine;
  const lines=wrapText(text, captionStyle==="pill-top" ? 22 : 24);
  const lineHeight = captionStyle==="minimal-lower" ? 58 : 68;
  const totalTextH = lines.length * lineHeight;
  const centerY = H/2;

  // Background — simple dark cinematic (no AI gradients, no accent glows)
  // Matches your TikToks: dark navy/black with subtle vignette
  const bgSvg = `
  <svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#0a0f18"/>
        <stop offset="50%" stop-color="#0e141e"/>
        <stop offset="100%" stop-color="#06080d"/>
      </linearGradient>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#bg)"/>
    <rect width="${W}" height="${H}" fill="black" opacity="0.22"/>
  </svg>`;
  const base = sharp(Buffer.from(bgSvg));

  let overlaySvg="";
  if(captionStyle==="pill-top"){
    // White pill top — like "Then there is this song"
    overlaySvg = `
    <svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
      <g transform="translate(${W/2}, 100)">
        <rect x="-260" y="-26" width="520" height="52" rx="26" fill="white"/>
        <text x="0" y="7" text-anchor="middle" font-family="sans-serif" font-size="22" font-weight="600" fill="#0a0a0f">${escapeXml(text)}</text>
      </g>
    </svg>`;
  } else if(captionStyle==="minimal-lower"){
    // Lowercase minimal with thin line — like "i want a better life"
    const lineYs = lines.map((_,i)=> centerY - totalTextH/2 + i*lineHeight + 16);
    overlaySvg = `
    <svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
      ${lines.map((line,i)=> `<text x="${W/2}" y="${lineYs[i]}" text-anchor="middle" font-family="sans-serif" font-size="40" font-weight="600" fill="white" style="text-shadow:0 1px 8px rgba(0,0,0,0.8)">${escapeXml(line.toLowerCase())}</text>`).join("")}
      <rect x="${W/2-30}" y="${centerY + totalTextH/2 + 18}" width="60" height="1" fill="white" opacity="0.6"/>
    </svg>`;
  } else if(captionStyle==="samurai-quote"){
    // Serif quote — like samurai videos
    const lineYs = lines.map((_,i)=> centerY - totalTextH/2 + i*lineHeight + 16);
    overlaySvg = `
    <svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
      ${lines.map((line,i)=> `<text x="${W/2}" y="${lineYs[i]}" text-anchor="middle" font-family="Georgia, serif" font-size="48" font-weight="800" fill="white" style="text-shadow:0 2px 10px rgba(0,0,0,0.9)">${escapeXml(line.toUpperCase())}</text>`).join("")}
    </svg>`;
  } else {
    // centered-bold — default, most common (MAN TO MAN, Before you join the crowd...)
    // Bold white uppercase centered, black shadow for readability
    const isHeader = text.includes(":") && text.split(":")[0].length < 15; // like "MAN TO MAN:"
    let yOffset = centerY - totalTextH/2;
    if(isHeader){
      const header=text.split(":")[0]+":";
      const body=text.split(":").slice(1).join(":").trim();
      const headerLines=wrapText(header, 20);
      const bodyLines=wrapText(body, 30);
      overlaySvg = `
      <svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
        ${headerLines.map((l,i)=> `<text x="80" y="${yOffset + i*lineHeight}" font-family="sans-serif" font-size="30" font-weight="800" fill="white" style="text-shadow:0 2px 12px rgba(0,0,0,0.85)">${escapeXml(l)}</text>`).join("")}
        ${bodyLines.map((l,i)=> `<text x="80" y="${yOffset + headerLines.length*lineHeight + 18 + i*lineHeight}" font-family="sans-serif" font-size="32" font-weight="700" fill="white" style="text-shadow:0 2px 12px rgba(0,0,0,0.85)">${escapeXml(l)}</text>`).join("")}
      </svg>`;
    } else {
      const lineYs = lines.map((_,i)=> centerY - totalTextH/2 + i*lineHeight + 16);
      overlaySvg = `
      <svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
        ${lines.map((line,i)=> `<text x="${W/2}" y="${lineYs[i]}" text-anchor="middle" font-family="sans-serif" font-size="54" font-weight="900" fill="white" style="text-shadow:0 2px 12px rgba(0,0,0,0.85), 0 1px 3px rgba(0,0,0,0.9)">${escapeXml(line.toUpperCase())}</text>`).join("")}
      </svg>`;
    }
  }

  // Hook badge — only on first frame, simple white pill (not accent-colored AI badge)
  let badgeSvg="";
  if(hookBadge && isHeadline){
    badgeSvg = `<g transform="translate(${W/2}, 60)"><rect x="-140" y="-20" width="280" height="40" rx="20" fill="white"/><text x="0" y="6" text-anchor="middle" font-family="sans-serif" font-size="16" font-weight="700" fill="#0a0a0f" letter-spacing="0.08em">${escapeXml(hookBadge.toUpperCase())}</text></g>`;
    overlaySvg = overlaySvg.replace("</svg>", badgeSvg+"</svg>");
  }

  await base.composite([{ input: Buffer.from(overlaySvg), top:0, left:0 }]).png().toFile(outPath);
}

for(const reel of cfg.reels){
  console.log(`\n=== Building ${reel.id} (${reel.variant}) — style: ${reel.captionStyle || "centered-bold"} ===`);
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
      console.warn(`⚠ ${reel.id}: music ${musicDur.toFixed(2)}s — rendering to track length ${mf} frames`);
      frames=mf; durSec=musicDur;
    } else { frames=mf; durSec=musicDur; console.log(`ℹ ${reel.id}: using music ${musicDur.toFixed(2)}s`); }
  } else {
    console.log(`ℹ ${reel.id}: no music — rendering silent ${durSec}s`);
  }

  const tmpDir = `out/reels/tmp-${reel.id}`;
  fs.mkdirSync(tmpDir,{recursive:true});
  const perLine = Math.floor(frames / reel.bodyLines.length);
  // Include headline as first card + bodyLines (like TikToks: hook then quotes)
  const allTexts = [reel.headline, ...reel.bodyLines];
  const perText = Math.floor(frames / allTexts.length);
  for(let i=0;i<allTexts.length;i++){
    const cardPath = `${tmpDir}/card-${String(i).padStart(2,"0")}.png`;
    await makeCard({
      hookBadge: i===0 ? reel.hookBadge : "",
      headline: reel.headline,
      bodyLine: allTexts[i],
      captionStyle: reel.captionStyle || "centered-bold",
      variant: reel.variant,
      outPath: cardPath,
    });
  }
  const outPath = `out/reels/${reel.id}.mp4`;
  fs.mkdirSync(path.dirname(outPath),{recursive:true});
  const inputs = allTexts.map((_,i)=> `-loop 1 -t ${(perText/fps).toFixed(3)} -i ${path.resolve(`${tmpDir}/card-${String(i).padStart(2,"0")}.png`)}`).join(" ");
  const vLabels = allTexts.map((_,i)=> `[${i}:v]scale=${W}:${H}:flags=lanczos,format=yuv420p[v${i}]`).join(";");
  const concatInputs = allTexts.map((_,i)=> `[v${i}]`).join("");
  const filter = `${vLabels};${concatInputs}concat=n=${allTexts.length}:v=1:a=0[v]`;
  let cmd = `${FF} -y ${inputs} -filter_complex "${filter}" -map "[v]" -c:v libx264 -pix_fmt yuv420p -r ${fps} -movflags +faststart -t ${durSec} ${outPath}`;
  if(musicDur && reel.musicSrc && fs.existsSync(reel.musicSrc)){
    const withAudio = outPath.replace(".mp4","-with-audio.mp4");
    cmd = `${FF} -y ${inputs} -i ${reel.musicSrc} -filter_complex "${filter}" -map "[v]" -map ${allTexts.length}:a -c:v libx264 -pix_fmt yuv420p -r ${fps} -c:a aac -b:a 192k -shortest -movflags +faststart -t ${durSec} ${withAudio} && mv ${withAudio} ${outPath}`;
  }
  sh(cmd);
  const probe = execSync(`${FP} -v error -show_entries stream=width,height,duration -of default=nw=1 ${outPath}`).toString();
  console.log(probe);
  console.log(`✓ ${reel.id} → ${outPath} (${durSec.toFixed(1)}s, ${frames} frames, style: ${reel.captionStyle})`);
}

console.log("\n✓ All reels built with authentic TikTok caption styles — no AI captions");
