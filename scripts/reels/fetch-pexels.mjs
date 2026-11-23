#!/usr/bin/env node
// Fetch portrait stock clips/stills from Pexels (Priority 1: real footage, anti-AI)
// Usage: PEXELS_API_KEY=xxx node scripts/reels/fetch-pexels.mjs "vertical night city skyline river reflection 4k" --out public/reels/raw/
// Falls back silently if no key — leaves existing slides/stock in place.
import fs from "fs"; import path from "path";
const key = process.env.PEXELS_API_KEY;
async function search(query, perPage=5){
  if(!key){ console.warn("⚠ PEXELS_API_KEY not set — skipping fetch (using existing dark cards / anti-AI stills)"); return []; }
  const url=`https://api.pexels.com/videos/search?query=${encodeURIComponent(query)}&orientation=portrait&size=large&per_page=${perPage}`;
  const res=await fetch(url,{headers:{Authorization:key}});
  if(!res.ok){ console.warn(`Pexels ${res.status}: ${await res.text()}`); return []; }
  const j=await res.json();
  return (j.videos||[]).map(v=>{
    const file = [...(v.video_files||[])].sort((a,b)=>b.width-a.width)[0];
    return { id:v.id, url:file?.link, width:file?.width, height:file?.height, duration:v.duration, thumb:v.image };
  }).filter(x=>x.url);
}
if(process.argv[1]?.endsWith("fetch-pexels.mjs")){
  const q=process.argv[2];
  if(!q){ console.error("usage: PEXELS_API_KEY=xxx node scripts/reels/fetch-pexels.mjs \"query\" [--out dir]"); process.exit(1); }
  const outIdx=process.argv.indexOf("--out");
  const outDir=outIdx>-1 ? process.argv[outIdx+1] : null;
  const vids=await search(q);
  console.log(JSON.stringify(vids,null,2));
  if(outDir && vids.length){
    fs.mkdirSync(outDir,{recursive:true});
    for(const v of vids.slice(0,2)){
      const ext=path.extname(new URL(v.url).pathname)||".mp4";
      const dest=path.join(outDir, `pexels-${v.id}${ext}`);
      console.log(`↓ ${v.url} → ${dest}`);
      const r=await fetch(v.url); const buf=Buffer.from(await r.arrayBuffer());
      fs.writeFileSync(dest, buf);
      console.log(`✓ ${dest} ${(buf.length/1e6).toFixed(1)}MB`);
    }
  }
}
export { search };
