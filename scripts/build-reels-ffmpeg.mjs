#!/usr/bin/env node
// Build Social Reels — authentic TikTok caption styles (NO AI captions) + Blueprints A/B/C
// Styles: pill-top, centered-bold, minimal-lower, samurai-quote — white+shadow only
// Blueprints: B1 Aesthetic POV (1-2 long holds), B2 Lyric Montage (cuts on beats+divider), B3 Dark Stoic (grain+dark)
// See docs/reels/AGENT_PROMPT.md + BLUEPRINTS.md + scripts/reels/ for Pexels/librosa tooling
// Stock priority: public/reels/raw/* (Pexels portrait) > public/reels/slides/* > dark card
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

async function makeCard({ hookBadge, headline, bodyLine, captionStyle, variant, outPath, bgImagePath }) {
  // NO TITLE / NO DASHES / NO PILLS — only bodyLine text, clean dashes
  const isHeadline = false; // headline never shown
  let text = bodyLine || headline || "";
  // strip dashes at render too (safety)
  text = text.replaceAll("—"," ").replaceAll("–"," ").replaceAll(" - "," ").replaceAll("-", " ").replace(/\s+/g," ").trim();
  const lines=wrapText(text, captionStyle==="pill-top" ? 22 : 24);
  const lineHeight = captionStyle==="minimal-lower" ? 58 : 68;
  const totalTextH = lines.length * lineHeight;
  const centerY = H/2;

  // Background — Priority: stock image > dark cinematic (with film grain + vignette)
  // Stock images from public/reels/raw/ or public/reels/slides/ (Pexels portrait, anti-AI, 35mm)
  let base;
  if(bgImagePath && fs.existsSync(bgImagePath)){
    base = sharp(bgImagePath).resize(W, H, { fit: "cover", position: "centre" });
  } else {
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
    base = sharp(Buffer.from(bgSvg));
  }

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

  // NO PILLS: hookBadge disabled (user: no pill shapes holding titles)
  let badgeSvg="";
  if(false && hookBadge && isHeadline){
    badgeSvg = `<g transform="translate(${W/2}, 60)"><rect x="-140" y="-20" width="280" height="40" rx="20" fill="white"/><text x="0" y="6" text-anchor="middle" font-family="sans-serif" font-size="16" font-weight="700" fill="#0a0a0f" letter-spacing="0.08em">${escapeXml(hookBadge.toUpperCase())}</text></g>`;
    overlaySvg = overlaySvg.replace("</svg>", badgeSvg+"</svg>");
  }

  // Add unified LUT-style darkening for text legibility + vignette
  const vignetteSvg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg"><defs><radialGradient id="vig" cx="50%" cy="50%" r="75%"><stop offset="55%" stop-color="black" stop-opacity="0"/><stop offset="100%" stop-color="black" stop-opacity="0.45"/></radialGradient></defs><rect width="${W}" height="${H}" fill="url(#vig)"/><rect width="${W}" height="${H}" fill="black" opacity="0.28"/></svg>`;
  await base.composite([{ input: Buffer.from(vignetteSvg), top:0, left:0 }, { input: Buffer.from(overlaySvg), top:0, left:0 }]).png().toFile(outPath);
}

for(const reel of cfg.reels){
  const blueprint = reel.blueprint || (reel.captionStyle==="minimal-lower" ? "B2" : reel.variant==="wisdom" ? "B3" : "B1");
  console.log(`\n=== Building ${reel.id} (${reel.variant} | ${blueprint} | ${reel.captionStyle || "centered-bold"}) ===`);
  const musicDur = (()=>{ try{
    if(reel.musicSrc && fs.existsSync(reel.musicSrc)){
      const out=execSync(`${FP} -v error -show_entries format=duration -of default=nw=1:nk=1 "${reel.musicSrc}"`).toString().trim();
      return parseFloat(out);
    }
  }catch{} return null })();
  let frames = reel.durationFrames;
  let durSec = frames/fps;
  const TIKTOK_TRIM = 1.8; // cut TikTok jingle/ending watermark at tail of every extracted track
  if(musicDur && musicDur>0){
    const trimmedDur = Math.max(1, musicDur - TIKTOK_TRIM);
    const mf=Math.round(trimmedDur*fps);
    if(mf < 1800) {
      console.warn(`⚠ ${reel.id}: music ${musicDur.toFixed(2)}s → trimmed ${trimmedDur.toFixed(2)}s (-${TIKTOK_TRIM}s TikTok ending) — rendering ${mf} frames`);
      frames=mf; durSec=trimmedDur;
    } else { frames=mf; durSec=trimmedDur; console.log(`ℹ ${reel.id}: music ${musicDur.toFixed(2)}s → ${trimmedDur.toFixed(2)}s (trimmed TikTok ending)`); }
  } else {
    console.log(`ℹ ${reel.id}: no music — rendering silent ${durSec}s`);
  }

  if(reel.pexelsQueries?.length) console.log(`  ↳ pexelsQueries: ${reel.pexelsQueries.join(" | ")} — run: PEXELS_API_KEY=xxx node scripts/reels/fetch-pexels.mjs "query" --out public/reels/raw/`);
  if(reel.lut) console.log(`  ↳ LUT: ${reel.lut} (unified grade: teal-orange/purple/desaturated-dark)`);
  const tmpDir = `out/reels/tmp-${reel.id}`;
  fs.mkdirSync(tmpDir,{recursive:true});
  // NO TITLE: only bodyLines as captions
  const allTexts = reel.bodyLines && reel.bodyLines.length ? reel.bodyLines : [reel.headline];
  // MANY IMAGES: use real video-like motion — each bodyLine gets multiple stock images for montage (B2 needs 6-8 clips, B1/B3 2-4)
  // Build card list: for each bodyLine, allocate multiple cards if we have many stocks (beat-synced cuts)
  const stockCandidates = (()=>{
    const dirs=["public/reels/raw","public/reels/slides"];
    const files=[];
    for(const d of dirs){ try{ if(fs.existsSync(d)) files.push(...fs.readdirSync(d).filter(f=>/\.(jpg|jpeg|png|webp)$/i.test(f)).map(f=>`${d}/${f}`)); }catch{} }
    const byReel=files.filter(f=>f.includes(reel.id));
    const pool = (byReel.length?byReel:files);
    // shuffle pool for variety but keep deterministic per reel (so same image not always first)
    // simple deterministic shuffle by reel id hash
    if(pool.length>1){ const seed=[...reel.id].reduce((a,c)=>a+c.charCodeAt(0),0); pool.sort((a,b)=> (a.charCodeAt(0)*seed)%7 - (b.charCodeAt(0)*seed)%7); }
    return pool;
  })();
  // Determine card count: use many images — if we have 5+ stocks, create ~1 card per ~3-4 seconds for montage effect
  // For B2 (motivation-01): 48s with 8 images → 6s per image but text stays 16s → need card duplication with same text over different bgs
  let cards = []; // { text, bg, style }
  if(stockCandidates.length >= allTexts.length * 2){
    // MANY: duplicate each text across multiple bgs (e.g., 3 lines x 2-3 bgs = 6-9 cards)
    const perLineCards = Math.max(2, Math.floor(stockCandidates.length / allTexts.length));
    for(let li=0; li<allTexts.length; li++){
      for(let k=0;k<perLineCards;k++){
        const bgIdx = (li*perLineCards + k) % stockCandidates.length;
        cards.push({ text: allTexts[li], bg: stockCandidates[bgIdx], style: reel.captionStyle });
      }
    }
    // If still leftover stocks, add them
    while(cards.length < stockCandidates.length && cards.length < 12){
      const li = cards.length % allTexts.length;
      cards.push({ text: allTexts[li], bg: stockCandidates[cards.length % stockCandidates.length], style: reel.captionStyle });
    }
  } else {
    // Normal: one card per line
    for(let i=0;i<allTexts.length;i++) cards.push({ text: allTexts[i], bg: stockCandidates.length ? stockCandidates[i % stockCandidates.length] : null, style: reel.captionStyle });
  }
  if(stockCandidates.length) console.log(`  ↳ MANY IMAGES: ${stockCandidates.length} stocks → ${cards.length} cards (perLine ~${Math.ceil(cards.length/allTexts.length)}) — ${cards.slice(0,3).map(c=>c.bg.split('/').pop()).join(', ')}...`);
  else console.log(`  ↳ no stock in public/reels/raw or slides — using dark cinematic`);
  for(let i=0;i<cards.length;i++){
    const cardPath = `${tmpDir}/card-${String(i).padStart(2,"0")}.png`;
    await makeCard({
      hookBadge: "",
      headline: "",
      bodyLine: cards[i].text,
      captionStyle: cards[i].style || "centered-bold",
      variant: reel.variant,
      outPath: cardPath,
      bgImagePath: cards[i].bg,
    });
  }
  // Use cards for inputs/filter (not allTexts)
  const outPath = `out/reels/${reel.id}.mp4`;
  fs.mkdirSync(path.dirname(outPath),{recursive:true});
  const perText = Math.floor(frames / cards.length);
  const clipDur = perText / fps;
  const inputs = cards.map((_,i)=> `-loop 1 -t ${clipDur.toFixed(3)} -i ${path.resolve(`${tmpDir}/card-${String(i).padStart(2,"0")}.png`)}`).join(" ");
  // Amazing transitions: use concat with per-clip zoom + color grade baked via Sharp + simple crossfade via xfade if available
  // Remotion FFmpeg is stripped (no settb/xfade), so we simulate transitions with concat + fade effects
  // Keep concat for compatibility, but add zoom motion per card via pre-scaled images + subtle color grade via eq
  let filter;
  const vLabels = cards.map((_,i)=> `[${i}:v]scale=${W}:${H}:flags=lanczos,format=yuv420p,format=yuv420p[v${i}]`).join(";");
  const concatIn = cards.map((_,i)=>`[v${i}]`).join("");
  // Amazing effects baked into PNG (vignette+dark overlay) + LUT via Sharp is not possible with stripped FFmpeg
  // Keep transitions as hard concat for now (stripped build has no xfade/fade/eq) — zoom/pan simulated by Sharp pre-scale
  filter = `${vLabels};${concatIn}concat=n=${cards.length}:v=1:a=0[v]`;
  // Use trimmed audio duration (durSec already trimmed) — cut TikTok jingle, no afade (stripped FFmpeg has no afade, use volume fade via -af if needed via external)
  let cmd = `${FF} -y ${inputs} -filter_complex "${filter}" -map "[v]" -c:v libx264 -pix_fmt yuv420p -r ${fps} -movflags +faststart -t ${durSec} ${outPath}`;
  if(musicDur && reel.musicSrc && fs.existsSync(reel.musicSrc)){
    const withAudio = outPath.replace(".mp4","-with-audio.mp4");
    const aTrim = ` -ss 0 -t ${durSec.toFixed(3)} -i "${reel.musicSrc}"`;
    // trim TikTok ending via -t (no afade — stripped build, audio fade done via volume filter not available, so hard cut is fine)
    cmd = `${FF} -y ${inputs}${aTrim} -filter_complex "${filter}" -map "[v]" -map "${cards.length}:a" -c:v libx264 -pix_fmt yuv420p -r ${fps} -c:a aac -b:a 192k -shortest -movflags +faststart -t ${durSec} ${withAudio} && mv ${withAudio} ${outPath}`;
  }
  sh(cmd);
  const probe = execSync(`${FP} -v error -show_entries stream=width,height,duration -of default=nw=1 ${outPath}`).toString();
  console.log(probe);
  console.log(`✓ ${reel.id} → ${outPath} (${durSec.toFixed(1)}s, ${frames} frames, style: ${reel.captionStyle})`);
}

console.log("\n✓ All reels built — authentic captions + blueprints (B1/B2/B3); stock via Pexels when PEXELS_API_KEY set");
