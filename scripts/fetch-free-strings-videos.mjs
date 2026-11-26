#!/usr/bin/env node
// Fetch FREE strings/guitar/violin videos from Pixabay — no reused audio, true strings visuals
import fs from "fs"; import path from "path";
const key=process.env.PIXABAY_API_KEY;
if(!key){console.error("PIXABAY_API_KEY missing");process.exit(1);}
const outDir="public/reels/raw";
fs.mkdirSync(outDir,{recursive:true});
const queries=["violin strings","guitar acoustic","orchestra strings","violin player","cello strings"];
async function fetchQ(q){
  const url=`https://pixabay.com/api/videos/?key=${encodeURIComponent(key)}&q=${encodeURIComponent(q)}&per_page=3&safesearch=true&order=popular&pretty=true`;
  console.log("→ Pixabay strings:",q);
  const r=await fetch(url); if(!r.ok){console.warn(r.status,await r.text().then(t=>t.slice(0,300)));return[];}
  const j=await r.json(); console.log(" totalHits",j.totalHits,"hits",j.hits.length);
  return j.hits.map(h=>{const v=h.videos||{};const best=v.large||v.medium||v.small||v.tiny;return{id:h.id,url:best?.url,w:best?.width,h:best?.height,tags:h.tags}}).filter(x=>x.url);
}
for(const q of queries){
  const hits=await fetchQ(q);
  for(const h of hits.slice(0,2)){
    const dest=path.join(outDir,`strings-${h.id}.mp4`);
    if(fs.existsSync(dest)){console.log(" exists",dest);continue;}
    console.log(" ↓",h.url,"→",dest,h.w+"x"+h.h,h.tags);
    const r2=await fetch(h.url); if(!r2.ok){console.warn("dl fail",r2.status);continue;}
    const buf=Buffer.from(await r2.arrayBuffer()); fs.writeFileSync(dest,buf); console.log(" ✓",dest,(buf.length/1e6).toFixed(1)+"MB");
  }
}
console.log("✓ strings fetch done");
