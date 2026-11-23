#!/usr/bin/env node
// VIDEO-BG variant — true moving video backgrounds vs still-frame
// Every card uses real video loop with text overlay composited via ffmpeg
// Falls back to image Ken-Burns baked PNG if no video pool exists
import fs from "fs";
import path from "path";
import sharp from "sharp";
import { execSync } from "child_process";
const FF_REMOTION = "./node_modules/@remotion/compositor-linux-x64-gnu/ffmpeg";
const FP = "./node_modules/@remotion/compositor-linux-x64-gnu/ffprobe";
import { execSync as _execSync } from "child_process";
let FF = FF_REMOTION;
try{
  const imgFfmpeg = _execSync('python3 -c "import imageio_ffmpeg; print(imageio_ffmpeg.get_ffmpeg_exe())" 2>/dev/null',{encoding:"utf8"}).trim();
  if(imgFfmpeg && imgFfmpeg.length>5) FF = imgFfmpeg;
}catch{}
if(FF !== FF_REMOTION) console.log(`ℹ Using full ffmpeg with afade: ${FF}`);
const fps=30, W=1080, H=1920;
const cfg = JSON.parse(fs.readFileSync("content/reels/reels-config.json","utf8"));
function sh(cmd){ console.log(`$ ${cmd}`); execSync(cmd,{stdio:"inherit"}); }
function escapeXml(s){ return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); }
function wrapText(text, maxChars=28){ const words=text.split(" "); const lines=[]; let cur=""; for(const w of words){ if((cur+" "+w).trim().length>maxChars&&cur){ lines.push(cur.trim()); cur=w;} else cur=(cur+" "+w).trim(); } if(cur) lines.push(cur); return lines; }

// make transparent text overlay (vignette + handwritten-ink typewriter) — NO background
async function makeTextOverlay({ text, captionStyle, outPath, revealWords=99 }){
  text = text.replaceAll("—"," ").replaceAll("–"," ").replaceAll(" - "," ").replaceAll("-"," ").replace(/\s+/g," ").trim();
  const maxChars = captionStyle==="handwritten-ink" ? 26 : 24;
  const lines = wrapText(text, maxChars);
  const isHand = captionStyle==="handwritten-ink";
  const lineHeight = isHand ? 72 : 68;
  const words = text.split(/\s+/).filter(Boolean);
  const totalWords = words.length;
  const visCount = Math.min(totalWords, Math.max(0, revealWords));
  const visText = words.slice(0, visCount).join(" ");
  const visLines = wrapText(visText, 26);
  const visTotalH = visLines.length*lineHeight;
  const visCenterY = H/2;
  const visYs = visLines.map((_,i)=> visCenterY - visTotalH/2 + i*lineHeight + 18);
  let overlaySvg="";
  if(isHand){
    overlaySvg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
      ${visLines.map((line,i)=> `<text x="${W/2}" y="${visYs[i]}" text-anchor="middle" font-family="Caveat, 'Shadows Into Light', 'Amatic SC', 'Indie Flower', cursive" font-size="62" font-weight="500" fill="white" style="text-shadow:0 1px 10px rgba(0,0,0,0.85), 0 0 1px rgba(0,0,0,1);" letter-spacing="0.02em">${escapeXml(line)}</text>`).join("")}
      ${visCount < totalWords ? `<text x="${W/2}" y="${visYs[visYs.length-1]+44}" text-anchor="middle" font-family="Caveat, 'Shadows Into Light', cursive" font-size="22" fill="white" opacity="0.35">...</text>` : ""}
    </svg>`;
  } else {
    const totalTextH = lines.length*lineHeight;
    const lineYs = lines.map((_,i)=> H/2 - totalTextH/2 + i*lineHeight +16);
    overlaySvg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">${lines.map((l,i)=> `<text x="${W/2}" y="${lineYs[i]}" text-anchor="middle" font-family="sans-serif" font-size="54" font-weight="900" fill="white" style="text-shadow:0 2px 12px rgba(0,0,0,0.85)">${escapeXml(l.toUpperCase())}</text>`).join("")}</svg>`;
  }
  const vignetteSvg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg"><defs><radialGradient id="vig" cx="50%" cy="50%" r="75%"><stop offset="60%" stop-color="black" stop-opacity="0"/><stop offset="100%" stop-color="black" stop-opacity="0.38"/></radialGradient></defs><rect width="${W}" height="${H}" fill="url(#vig)"/><rect width="${W}" height="${H}" fill="black" opacity="${isHand?0.18:0.28}"/></svg>`;
  // transparent base + vignette + text
  const base = sharp({ create:{ width:W, height:H, channels:4, background:{ r:0,g:0,b:0,alpha:0 }}});
  await base.composite([{ input: Buffer.from(vignetteSvg)}, { input: Buffer.from(overlaySvg)}]).png().toFile(outPath);
}

// baked image card (fallback when no video)
async function makeBakedCard({ text, captionStyle, outPath, bgImagePath, zoom=1, panX=0, panY=0, revealWords=99 }){
  text = text.replaceAll("—"," ").replaceAll("–"," ").replaceAll("-"," ").replace(/\s+/g," ").trim();
  const maxChars = captionStyle==="handwritten-ink"?26:24;
  const lineHeight = 72;
  let base;
  if(bgImagePath && fs.existsSync(bgImagePath)){
    const zw=Math.round(W*zoom), zh=Math.round(H*zoom);
    if(zoom>1.001){
      const buf=await sharp(bgImagePath).resize(zw,zh,{fit:"cover",position:"centre"}).toBuffer();
      const left=Math.max(0,Math.min(zw-W, Math.round((zw-W)/2+panX)));
      const top=Math.max(0,Math.min(zh-H, Math.round((zh-H)/2+panY)));
      base=sharp(buf).extract({left, top, width:W, height:H});
    } else base=sharp(bgImagePath).resize(W,H,{fit:"cover",position:"centre"});
  } else {
    const bgSvg=`<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg"><rect width="${W}" height="${H}" fill="#111"/></svg>`;
    base=sharp(Buffer.from(bgSvg));
  }
  const words=text.split(/\s+/).filter(Boolean);
  const visCount=Math.min(words.length, Math.max(0,revealWords));
  const visText=words.slice(0,visCount).join(" ");
  const visLines=wrapText(visText,26);
  const visTotalH=visLines.length*lineHeight;
  const visYs=visLines.map((_,i)=> H/2 - visTotalH/2 + i*lineHeight +18);
  const overlaySvg=`<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">${visLines.map((l,i)=> `<text x="${W/2}" y="${visYs[i]}" text-anchor="middle" font-family="Caveat, 'Shadows Into Light', cursive" font-size="62" fill="white" style="text-shadow:0 1px 10px rgba(0,0,0,0.85)">${escapeXml(l)}</text>`).join("")}</svg>`;
  const vignetteSvg=`<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg"><defs><radialGradient id="vig" cx="50%" cy="50%" r="75%"><stop offset="60%" stop-color="black" stop-opacity="0"/><stop offset="100%" stop-color="black" stop-opacity="0.38"/></radialGradient></defs><rect width="${W}" height="${H}" fill="url(#vig)"/><rect width="${W}" height="${H}" fill="black" opacity="0.18"/></svg>`;
  await base.composite([{input:Buffer.from(vignetteSvg)},{input:Buffer.from(overlaySvg)}]).png().toFile(outPath);
}

for(const reel of cfg.reels){
  const blueprint = reel.blueprint || "B1";
  console.log(`\n=== VIDEO-BG Building ${reel.id} (${reel.variant} | ${blueprint} | ${reel.captionStyle}) ===`);
  const musicDur=(()=>{ try{ if(reel.musicSrc&&fs.existsSync(reel.musicSrc)){ return parseFloat(execSync(`${FP} -v error -show_entries format=duration -of default=nw=1:nk=1 "${reel.musicSrc}"`).toString().trim()); }}catch{} return null})();
  let frames=reel.durationFrames, durSec=frames/fps;
  const TIKTOK_TRIM=4.2;
  if(musicDur&&musicDur>0){ const trimmedDur=Math.max(1,musicDur-TIKTOK_TRIM); const mf=Math.round(trimmedDur*fps); frames=mf; durSec=trimmedDur; console.log(`ℹ ${reel.id}: music ${musicDur.toFixed(2)}s → ${trimmedDur.toFixed(2)}s`); }
  if(reel.pexelsQueries?.length) console.log(`  ↳ pexelsQueries: ${reel.pexelsQueries.join(" | ")}`);
  if(reel.lut) console.log(`  ↳ LUT: ${reel.lut}`);
  const tmpDir=`out/reels-video/tmp-${reel.id}`;
  fs.mkdirSync(tmpDir,{recursive:true});
  const allTexts = reel.bodyLines?.length ? reel.bodyLines : [reel.headline];
  // STOCK POOL: prioritize VIDEO files globally, share across reels for VIDEO-BG version
  const dirs=["public/reels/raw","public/reels/slides"];
  const allFiles=[]; for(const d of dirs){ try{ if(fs.existsSync(d)) allFiles.push(...fs.readdirSync(d).filter(f=>/\.(jpg|jpeg|png|webp|mp4|mov)$/i.test(f)).map(f=>`${d}/${f}`)); }catch{} }
  const videoPool = allFiles.filter(f=>/\.(mp4|mov)$/i.test(f));
  const imagePool = allFiles.filter(f=>!/\.(mp4|mov)$/i.test(f));
  const byReelVideos = videoPool.filter(f=>f.includes(reel.id));
  const byReelImages = imagePool.filter(f=>f.includes(reel.id));
  // For VIDEO-BG: use byReel videos if any, else global video pool — every card gets a video
  let stockVideos = byReelVideos.length ? byReelVideos : videoPool;
  if(!stockVideos.length) stockVideos = imagePool; // fallback (should not happen now — we have 5 videos)
  // shuffle deterministic
  if(stockVideos.length>1){ const seed=[...reel.id].reduce((a,c)=>a+c.charCodeAt(0),0); stockVideos.sort((a,b)=> (a.charCodeAt(0)*seed)%7 - (b.charCodeAt(0)*seed)%7); }
  // build cards: each bodyLine gets multiple videos for montage (B2 needs more)
  let cards=[]; // {text, bgVideo, isVideo}
  const perLineCards = Math.min(3, Math.max(2, Math.floor(stockVideos.length / allTexts.length) || 2));
  for(let li=0; li<allTexts.length; li++){
    for(let k=0;k<perLineCards;k++){
      const bgIdx=(li*perLineCards+k)%stockVideos.length;
      const bg=stockVideos[bgIdx];
      cards.push({ text: allTexts[li], bg, isVideo: /\.(mp4|mov)$/i.test(bg) });
    }
  }
  while(cards.length < stockVideos.length && cards.length < 9){
    const li=cards.length % allTexts.length;
    cards.push({ text: allTexts[li], bg: stockVideos[cards.length%stockVideos.length], isVideo: true });
  }
  if(!cards.length) for(let i=0;i<allTexts.length;i++) cards.push({ text: allTexts[i], bg: stockVideos[0]||null, isVideo: !!stockVideos[0] });
  const vCount=cards.filter(c=>c.isVideo).length;
  console.log(`  ↳ VIDEO-BG pool: ${videoPool.length} videos globally (${byReelVideos.length} matching ${reel.id}) + ${imagePool.length} images`);
  console.log(`  ↳ cards: ${cards.length} (perLine ${perLineCards}) — ${cards.slice(0,3).map(c=>c.bg.split('/').pop()).join(", ")} ... allVideo=${vCount===cards.length}`);

  // animated overlay steps: word-by-word
  let segIdx=0;
  const segDir=`${tmpDir}/segs`; fs.mkdirSync(segDir,{recursive:true});
  const totalStages = [];
  for(let i=0;i<cards.length;i++){
    const clean=cards[i].text.replaceAll("—"," ").replaceAll("-"," ").trim();
    const totalWords=clean.split(/\s+/).filter(Boolean).length;
    const stages=Math.min(6, Math.max(3, totalWords));
    for(let st=0; st<stages; st++){
      totalStages.push({ cardIdx:i, stage:st, stages, totalWords });
    }
    if(totalStages.length>=28) break;
  }
  const totalAnim=totalStages.length;
  const clipDur=durSec/totalAnim;
  console.log(`  ↳ anim: ${cards.length} base → ${totalAnim} segments clip=${clipDur.toFixed(2)}s each (word-by-word over VIDEO)`);

  for(let s=0; s<totalStages.length; s++){
    const { cardIdx, stage, stages, totalWords } = totalStages[s];
    const card=cards[cardIdx];
    const revealWords=Math.max(1, Math.round(((stage+1)/stages)*totalWords));
    const overlayPath=`${tmpDir}/overlay-${String(s).padStart(2,"0")}.png`;
    await makeTextOverlay({ text: card.text, captionStyle: reel.captionStyle, outPath: overlayPath, revealWords });
    const segOut=`${segDir}/seg-${String(s).padStart(2,"0")}.mp4`;
    if(card.isVideo){
      // true video background: loop video, scale+crop to 1080x1920, overlay text+vignette
      // use stream_loop to handle short clips (6s video for 8s segment)
      sh(`${FF} -y -stream_loop 3 -i "${card.bg}" -loop 1 -i "${overlayPath}" -filter_complex "[0:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1,fps=${fps},trim=duration=${clipDur.toFixed(3)},setpts=PTS-STARTPTS[base];[base][1:v]overlay=0:0:format=yuv420:shortest=1:eof_action=pass,format=yuv420p[vid]" -map "[vid]" -t ${clipDur.toFixed(3)} -c:v libx264 -pix_fmt yuv420p -r ${fps} -an ${segOut}`);
    } else {
      // image fallback: baked via sharp then loop
      const bakedPath=`${tmpDir}/baked-${String(s).padStart(2,"0")}.png`;
      const zoom=1.02 + (stage/Math.max(1,stages-1))*0.10;
      const dir=(cardIdx%2===0)?1:-1;
      const panX=(dir*(stage/Math.max(1,stages-1))*36)-(dir*18);
      const panY=(stage/Math.max(1,stages-1))*14-7;
      await makeBakedCard({ text: card.text, captionStyle: reel.captionStyle, outPath: bakedPath, bgImagePath: card.bg, zoom, panX, panY, revealWords });
      sh(`${FF} -y -loop 1 -t ${clipDur.toFixed(3)} -i "${bakedPath}" -c:v libx264 -pix_fmt yuv420p -r ${fps} -an ${segOut}`);
    }
  }

  const outPath=`out/reels-video/${reel.id}.mp4`;
  fs.mkdirSync(path.dirname(outPath),{recursive:true});
  const listPath=`${tmpDir}/concat.txt`;
  const listContent=Array.from({length: totalAnim}, (_,i)=> `file '${path.resolve(`${segDir}/seg-${String(i).padStart(2,"0")}.mp4`)}'`).join("\n");
  fs.writeFileSync(listPath, listContent);
  if(musicDur && reel.musicSrc && fs.existsSync(reel.musicSrc)){
    const withAudio=outPath.replace(".mp4","-with-audio.mp4");
    const fadeStart2=Math.max(0,durSec-2).toFixed(3);
    sh(`${FF} -y -f concat -safe 0 -i ${listPath} -ss 0 -t ${durSec.toFixed(3)} -i "${reel.musicSrc}" -c:v libx264 -pix_fmt yuv420p -r ${fps} -af "afade=t=out:st=${fadeStart2}:d=2:curve=tri" -c:a aac -b:a 192k -shortest -movflags +faststart -t ${durSec} ${withAudio} && mv ${withAudio} ${outPath}`);
  } else {
    sh(`${FF} -y -f concat -safe 0 -i ${listPath} -c copy -movflags +faststart -t ${durSec} ${outPath}`);
    // re-encode if copy fails due to differing params: fallback
    try{ execSync(`${FP} -v error -show_entries stream=codec_name -of csv ${outPath} 2>&1 | head -1`); }catch{ sh(`${FF} -y -f concat -safe 0 -i ${listPath} -c:v libx264 -pix_fmt yuv420p -r ${fps} -movflags +faststart -t ${durSec} ${outPath}`); }
  }
  const probe=execSync(`${FP} -v error -show_entries stream=width,height -of default=nw=1 ${outPath}`).toString();
  console.log(probe);
  console.log(`✓ VIDEO-BG ${reel.id} → ${outPath} (${durSec.toFixed(1)}s, ${totalAnim} segs, videoBG)`);
}
console.log("\n✓ All VIDEO-BG reels built — true motion backgrounds");
