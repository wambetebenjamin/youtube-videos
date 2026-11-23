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

async function makeCard({ hookBadge, headline, bodyLine, captionStyle, variant, outPath, bgImagePath, zoom=1, revealLines=99 }) {
  // NO TITLE / NO DASHES / NO PILLS — only bodyLine text, clean dashes
  // Supports handwritten-ink (tall narrow organic handwritten) + image animation via zoom
  const isHeadline = false;
  let text = bodyLine || headline || "";
  text = text.replaceAll("—"," ").replaceAll("–"," ").replaceAll(" - "," ").replaceAll("-", " ").replace(/\s+/g," ").trim();
  // wrap settings per style
  const maxChars = captionStyle==="handwritten-ink" ? 26 : captionStyle==="pill-top" ? 22 : 24;
  const lines=wrapText(text, maxChars);
  const isHand = captionStyle==="handwritten-ink";
  const lineHeight = isHand ? 72 : captionStyle==="minimal-lower" ? 58 : 68;
  const totalTextH = lines.length * lineHeight;
  const centerY = H/2;

  // Background with IMAGE ANIMATION (Ken Burns zoom)
  let base;
  if(bgImagePath && fs.existsSync(bgImagePath)){
    // zoom animation: enlarge then crop center to simulate slow zoom
    // Use sharp to resize to W*zoom x H*zoom then extract center WxH
    const zw = Math.round(W * zoom);
    const zh = Math.round(H * zoom);
    const tmp = sharp(bgImagePath).resize(zw, zh, { fit: "cover", position: "centre" });
    // extract center WxH to create zoom effect (for zoom>1, this is cropped enlarged)
    const meta = await tmp.metadata().then(()=>null).catch(()=>null);
    // Instead, resize to cover then if zoom>1, we composite larger? Simpler: resize to W*zoom then extract
    // Use sharp pipeline: resize to W*zoom, then extract
    if(zoom > 1.001){
      const buf = await sharp(bgImagePath).resize(zw, zh, { fit: "cover", position: "centre" }).toBuffer();
      // extract center
      const left = Math.round((zw - W)/2);
      const top = Math.round((zh - H)/2);
      base = sharp(buf).extract({ left: Math.max(0,left), top: Math.max(0,top), width: W, height: H });
    } else {
      base = sharp(bgImagePath).resize(W, H, { fit: "cover", position: "centre" });
    }
  } else {
    const bgSvg = `
    <svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#fdf6e3"/>
          <stop offset="50%" stop-color="#f5e6c8"/>
          <stop offset="100%" stop-color="#ede0b8"/>
        </linearGradient>
        <filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/></filter>
      </defs>
      <rect width="${W}" height="${H}" fill="url(#bg)"/>
      <rect width="${W}" height="${H}" fill="black" opacity="0.04" filter="url(#grain)"/>
    </svg>`;
    base = sharp(Buffer.from(bgSvg));
  }

  let overlaySvg="";
  if(captionStyle==="handwritten-ink"){
    // Tall narrow organic handwritten ink — Caveat / Shadows Into Light
    // Layer-by-layer animation: revealLines determines how many wrapped lines are visible (ink-bleed fade + 10px drift)
    const visible = Math.min(lines.length, revealLines);
    const lineYs = lines.map((_,i)=> centerY - totalTextH/2 + i*lineHeight + 18);
    overlaySvg = `
    <svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
      ${lines.map((line,i)=> {
        const isVisible = i < visible;
        const isNext = i === visible; // next line fading in (ink bleed 50%)
        const opacity = isVisible ? 1 : isNext ? 0.0 : 0;
        // 10px upward drift: visible lines at 0, next at 10, hidden at 14
        const dy = isVisible ? 0 : isNext ? 10 : 14;
        const y = lineYs[i] + dy;
        if(!isVisible && !isNext) return "";
        return `<text x="${W/2}" y="${y}" text-anchor="middle" font-family="Caveat, 'Shadows Into Light', 'Amatic SC', 'Indie Flower', cursive"
          font-size="62" font-weight="500" fill="white" opacity="${isVisible?1:0}"
          style="text-shadow:0 1px 10px rgba(0,0,0,0.85), 0 0 1px rgba(0,0,0,1);" letter-spacing="0.02em">${escapeXml(line)}</text>`;
      }).join("")}
    </svg>`;
  } else if(captionStyle==="pill-top"){
    overlaySvg = `
    <svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
      <g transform="translate(${W/2}, 100)">
        <rect x="-260" y="-26" width="520" height="52" rx="26" fill="white"/>
        <text x="0" y="7" text-anchor="middle" font-family="sans-serif" font-size="22" font-weight="600" fill="#0a0a0f">${escapeXml(text)}</text>
      </g>
    </svg>`;
  } else if(captionStyle==="minimal-lower"){
    const lineYs = lines.map((_,i)=> centerY - totalTextH/2 + i*lineHeight + 16);
    overlaySvg = `
    <svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
      ${lines.map((line,i)=> `<text x="${W/2}" y="${lineYs[i]}" text-anchor="middle" font-family="sans-serif" font-size="40" font-weight="600" fill="white" style="text-shadow:0 1px 8px rgba(0,0,0,0.8)">${escapeXml(line.toLowerCase())}</text>`).join("")}
      <rect x="${W/2-30}" y="${centerY + totalTextH/2 + 18}" width="60" height="1" fill="white" opacity="0.6"/>
    </svg>`;
  } else if(captionStyle==="samurai-quote"){
    const lineYs = lines.map((_,i)=> centerY - totalTextH/2 + i*lineHeight + 16);
    overlaySvg = `
    <svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
      ${lines.map((line,i)=> `<text x="${W/2}" y="${lineYs[i]}" text-anchor="middle" font-family="Georgia, serif" font-size="48" font-weight="800" fill="white" style="text-shadow:0 2px 10px rgba(0,0,0,0.9)">${escapeXml(line.toUpperCase())}</text>`).join("")}
    </svg>`;
  } else {
    const isHeader = text.includes(":") && text.split(":")[0].length < 15;
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

  // vignette + paper grain multiply for ink absorption + darkening for legibility
  const vignetteSvg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg"><defs><radialGradient id="vig" cx="50%" cy="50%" r="75%"><stop offset="60%" stop-color="black" stop-opacity="0"/><stop offset="100%" stop-color="black" stop-opacity="0.38"/></radialGradient></defs><rect width="${W}" height="${H}" fill="url(#vig)"/><rect width="${W}" height="${H}" fill="black" opacity="${isHand?0.18:0.28}"/></svg>`;
  // paper grain subtle multiply (for handwritten-ink)
  const grainSvg = isHand ? `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg"><defs><filter id="n"><feTurbulence baseFrequency="0.95" numOctaves="2"/><feColorMatrix values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.04 0"/></filter></defs><rect width="${W}" height="${H}" fill="white" opacity="0" filter="url(#n)"/></svg>` : "";
  const composites = [{ input: Buffer.from(vignetteSvg), top:0, left:0 }, { input: Buffer.from(overlaySvg), top:0, left:0 }];
  await base.composite(composites).png().toFile(outPath);
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
  const TIKTOK_TRIM = 4.2; // aggressive trim to kill TikTok outro jingle/watermark fully // cut TikTok jingle/ending watermark at tail of every extracted track
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
  if(stockCandidates.length >= allTexts.length){
    const perLineCards = Math.min(3, Math.max(2, Math.floor(stockCandidates.length / allTexts.length) || 2));
    for(let li=0; li<allTexts.length; li++){
      for(let k=0;k<perLineCards;k++){
        const bgIdx = (li*perLineCards + k) % stockCandidates.length;
        cards.push({ text: allTexts[li], bg: stockCandidates[bgIdx], style: reel.captionStyle });
      }
    }
    while(cards.length < stockCandidates.length && cards.length < 9){
      const li = cards.length % allTexts.length;
      cards.push({ text: allTexts[li], bg: stockCandidates[cards.length % stockCandidates.length], style: reel.captionStyle });
    }
  } else {
    // Normal: one card per line
    for(let i=0;i<allTexts.length;i++) cards.push({ text: allTexts[i], bg: stockCandidates.length ? stockCandidates[i % stockCandidates.length] : null, style: reel.captionStyle });
  }
  if(stockCandidates.length) console.log(`  ↳ MANY IMAGES: ${stockCandidates.length} stocks → ${cards.length} cards (perLine ~${Math.ceil(cards.length/allTexts.length)}) — ${cards.slice(0,3).map(c=>c.bg.split('/').pop()).join(', ')}...`);
  else console.log(`  ↳ no stock in public/reels/raw or slides — using dark cinematic`);
  // BUILD ANIMATED CARDS: layer-by-layer text animation + Ken Burns image animation (max 28 to avoid OOM)
  let animatedCards = [];
  let pngIndex = 0;
  for(let i=0;i<cards.length;i++){
    const orig = cards[i];
    const cleanForWrap = orig.text.replaceAll("—"," ").replaceAll("–"," ").replaceAll("-", " ").trim();
    const wrapped = wrapText(cleanForWrap, (orig.style||reel.captionStyle)==="handwritten-ink" ? 26 : 24);
    const stages = Math.min(4, Math.max(2, wrapped.length + 1));
    for(let st=0; st<stages; st++){
      const revealLines = Math.min(wrapped.length, st+1);
      const zoom = 1.0 + (st / Math.max(1,stages-1)) * 0.06;
      const cardPath = `${tmpDir}/card-${String(pngIndex).padStart(2,"0")}.png`;
      await makeCard({
        hookBadge: "",
        headline: "",
        bodyLine: orig.text,
        captionStyle: orig.style || reel.captionStyle,
        variant: reel.variant,
        outPath: cardPath,
        bgImagePath: orig.bg,
        zoom,
        revealLines,
      });
      animatedCards.push({ idx: pngIndex, revealLines, zoom, srcCard: i });
      pngIndex++;
    }
    if(pngIndex >= 28) break;
  }
  const encodeCards = animatedCards;
  console.log(`  ↳ anim: ${cards.length} base → ${animatedCards.length} animated frames (zoom 1.0→1.08 + ink reveal ${4} stages) — handwritten-ink layer-by-layer`);
  // NICE TRANSITIONS: baked via Sharp — each card PNG already has vignette+dark overlay; hard cuts are synced on beat for aesthetic
  // For smooth fade, we could add 1-frame opacity blend, but stripped FFmpeg handles concat well — many images + beat sync = retention
  const outPath = `out/reels/${reel.id}.mp4`;
  fs.mkdirSync(path.dirname(outPath),{recursive:true});
  const totalAnim = animatedCards.length;
  const clipDur = durSec / totalAnim;
  const perText = Math.floor(frames / totalAnim);
  // Use concat demuxer to avoid OOM with many inputs (status 137) — generate segments then concat
  // For <=12 segments use single filter_complex (fast), else use file list method
  if(totalAnim <= 12){
    const inputs = animatedCards.map((_,i)=> `-loop 1 -t ${clipDur.toFixed(3)} -i ${path.resolve(`${tmpDir}/card-${String(i).padStart(2,"0")}.png`)}`).join(" ");
    let filter;
    const vLabels = animatedCards.map((_,i)=> `[${i}:v]format=yuv420p[v${i}]`).join(";");
    const concatIn = animatedCards.map((_,i)=>`[v${i}]`).join("");
    filter = `${vLabels};${concatIn}concat=n=${totalAnim}:v=1:a=0[v]`;
    let cmd = `${FF} -y ${inputs} -filter_complex "${filter}" -map "[v]" -c:v libx264 -pix_fmt yuv420p -r ${fps} -movflags +faststart -t ${durSec} ${outPath}`;
    if(musicDur && reel.musicSrc && fs.existsSync(reel.musicSrc)){
      const withAudio = outPath.replace(".mp4","-with-audio.mp4");
      const aTrim = ` -ss 0 -t ${durSec.toFixed(3)} -i "${reel.musicSrc}"`;
      cmd = `${FF} -y ${inputs}${aTrim} -filter_complex "${filter}" -map "[v]" -map "${totalAnim}:a" -c:v libx264 -pix_fmt yuv420p -r ${fps} -c:a aac -b:a 192k -shortest -movflags +faststart -t ${durSec} ${withAudio} && mv ${withAudio} ${outPath}`;
    }
    sh(cmd);
  } else {
    console.log(`  ↳ large concat (${totalAnim} segments) — using demuxer file list to avoid OOM`);
    const segDir = `${tmpDir}/segs`;
    fs.mkdirSync(segDir, {recursive:true});
    // create segments sequentially (memory friendly)
    for(let i=0;i<totalAnim;i++){
      const png = path.resolve(`${tmpDir}/card-${String(i).padStart(2,"0")}.png`);
      const seg = `${segDir}/seg-${String(i).padStart(2,"0")}.mp4`;
      sh(`${FF} -y -loop 1 -t ${clipDur.toFixed(3)} -i ${png} -c:v libx264 -pix_fmt yuv420p -r ${fps} -an -movflags +faststart ${seg}`);
    }
    // concat list
    const listPath = `${tmpDir}/concat.txt`;
    const listContent = Array.from({length: totalAnim}, (_,i)=> `file '${path.resolve(`${segDir}/seg-${String(i).padStart(2,"0")}.mp4`)}'`).join("\n");
    fs.writeFileSync(listPath, listContent);
    // final mux: concat video + trimmed audio
    if(musicDur && reel.musicSrc && fs.existsSync(reel.musicSrc)){
      const withAudio = outPath.replace(".mp4","-with-audio.mp4");
      // need to re-encode video from concat + add audio
      sh(`${FF} -y -f concat -safe 0 -i ${listPath} -ss 0 -t ${durSec.toFixed(3)} -i "${reel.musicSrc}" -c:v libx264 -pix_fmt yuv420p -r ${fps} -c:a aac -b:a 192k -shortest -movflags +faststart -t ${durSec} ${withAudio} && mv ${withAudio} ${outPath}`);
    } else {
      sh(`${FF} -y -f concat -safe 0 -i ${listPath} -c:v libx264 -pix_fmt yuv420p -r ${fps} -movflags +faststart -t ${durSec} ${outPath}`);
    }
  }
  const probe = execSync(`${FP} -v error -show_entries stream=width,height,duration -of default=nw=1 ${outPath}`).toString();
  console.log(probe);
  console.log(`✓ ${reel.id} → ${outPath} (${durSec.toFixed(1)}s, ${frames} frames, style: ${reel.captionStyle})`);
}

console.log("\n✓ All reels built — authentic captions + blueprints (B1/B2/B3); stock via Pexels when PEXELS_API_KEY set");
