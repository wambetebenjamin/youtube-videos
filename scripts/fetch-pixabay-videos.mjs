#!/usr/bin/env node
// Fetch portrait vertical videos from Pixabay Videos API — keeps content/music intact, only swaps backgrounds
// Usage: PIXABAY_API_KEY=5879... node scripts/fetch-pixabay-videos.mjs --out public/reels/raw/
// Reads pexelsQueries from content/reels/reels-config.json, fetches 2-3 per reel, saves as pixabay-<id>.mp4
import fs from "fs";
import path from "path";
const key = process.env.PIXABAY_API_KEY;
if (!key) { console.error("PIXABAY_API_KEY not set. Get free key at https://pixabay.com/api/"); process.exit(1); }
const cfg = JSON.parse(fs.readFileSync("content/reels/reels-config.json", "utf8"));
const outIdx = process.argv.indexOf("--out");
const outDir = outIdx > -1 ? process.argv[outIdx+1] : "public/reels/raw";

async function fetchPixabay(q, per_page=3) {
  const url = `https://pixabay.com/api/videos/?key=${encodeURIComponent(key)}&q=${encodeURIComponent(q)}&per_page=${per_page}&safesearch=true&order=popular&pretty=true`;
  console.log(`→ Pixabay: ${q}`);
  const res = await fetch(url);
  if (!res.ok) { console.warn(`  Pixabay ${res.status}: ${await res.text().then(t=>t.slice(0,400))}`); return []; }
  const j = await res.json();
  // j.hits is array of video hits, each has videos: {large:{url,width,height,size}, medium, small, tiny}, duration, tags, user
  return (j.hits||[]).map(h => {
    const v = h.videos || {};
    // prefer large > medium > small for portrait vertical
    const best = v.large || v.medium || v.small || v.tiny;
    return { id: h.id, url: best?.url, width: best?.width, height: best?.height, size: best?.size, duration: h.duration, tags: h.tags, user: h.user };
  }).filter(x=>x.url);
}

fs.mkdirSync(outDir, {recursive:true});
for (const reel of cfg.reels) {
  console.log(`\n=== ${reel.id} === ${reel.headline} ===`);
  console.log(`  queries: ${(reel.pexelsQueries||[]).join(" | ")}`);
  for (const q of (reel.pexelsQueries||[]).slice(0,2)) {
    const hits = await fetchPixabay(q, 2);
    console.log(`  → ${hits.length} hits for "${q}"`);
    for (const h of hits) {
      const dest = path.join(outDir, `pixabay-${h.id}.mp4`);
      if (fs.existsSync(dest)) { console.log(`  ✓ exists ${dest}`); continue; }
      console.log(`  ↓ ${h.url} → ${dest} (${h.width}x${h.height} ${h.duration}s)`);
      const r = await fetch(h.url);
      if (!r.ok) { console.warn(`    download failed ${r.status}`); continue; }
      const buf = Buffer.from(await r.arrayBuffer());
      fs.writeFileSync(dest, buf);
      console.log(`  ✓ ${dest} ${(buf.length/1e6).toFixed(1)}MB`);
    }
  }
}
console.log("\n✓ Pixabay fetch done. Rebuild with: node scripts/build-reels-VIDEO-bg.mjs  (or build-reels-ffmpeg.mjs for still-frame)");
console.log("  Content/music intact — only backgrounds replaced. Audio fade 2s afade preserved.");
