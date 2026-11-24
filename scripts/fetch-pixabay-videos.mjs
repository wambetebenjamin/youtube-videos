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

// Simplify pexelsQuery: Pixabay q works best with 1-3 keywords, no "vertical 4k"
function simplifyQuery(q) {
  // remove vertical|4k|video|portrait tokens, keep first 3 meaningful words
  const stop = new Set(["vertical","4k","hd","video","clip","free","stock"]);
  const words = q.toLowerCase().split(/\s+/).filter(w => w && !stop.has(w));
  // keep 1-3 words: e.g. "storm clouds sea" -> "storm clouds"
  return words.slice(0,3).join(" ");
}

async function fetchPixabay(q, per_page=3) {
  const url = `https://pixabay.com/api/videos/?key=${encodeURIComponent(key)}&q=${encodeURIComponent(q)}&per_page=${per_page}&safesearch=true&order=popular&pretty=true`;
  console.log(`→ Pixabay q="${q}"`);
  const res = await fetch(url);
  if (!res.ok) { console.warn(`  Pixabay ${res.status}: ${await res.text().then(t=>t.slice(0,400))}`); return []; }
  const j = await res.json();
  console.log(`  → totalHits=${j.totalHits} hits=${(j.hits||[]).length}`);
  // j.hits is array of video hits, each has videos: {large:{url,width,height,size}, medium, small, tiny}, duration, tags, user
  return (j.hits||[]).map(h => {
    const v = h.videos || {};
    // prefer large > medium > small (runner will scale/crop to 1080x1920)
    const best = v.large || v.medium || v.small || v.tiny;
    return { id: h.id, url: best?.url, width: best?.width, height: best?.height, size: best?.size, duration: h.duration, tags: h.tags, user: h.user };
  }).filter(x=>x.url);
}

fs.mkdirSync(outDir, {recursive:true});
let total = 0;
for (const reel of cfg.reels) {
  console.log(`\n=== ${reel.id} === ${reel.headline} ===`);
  const queries = (reel.pexelsQueries||[]).map(simplifyQuery).filter(Boolean);
  // dedupe
  const uniq = [...new Set(queries)];
  console.log(`  raw: ${(reel.pexelsQueries||[]).join(" | ")}`);
  console.log(`  simplified: ${uniq.join(" | ")}`);
  // fetch up to 3 unique simplified queries per reel (more chance of hits)
  for (const q of uniq.slice(0,3)) {
    let hits = await fetchPixabay(q, 3);
    // fallback: if 0 hits, try single-word
    if (!hits.length && q.includes(" ")) {
      const fallback = q.split(" ")[0];
      console.log(`  ↻ retry single keyword "${fallback}"`);
      hits = await fetchPixabay(fallback, 3);
    }
    console.log(`  → ${hits.length} video(s) for "${q}"`);
    for (const h of hits.slice(0,2)) {
      const dest = path.join(outDir, `pixabay-${h.id}.mp4`);
      if (fs.existsSync(dest)) { console.log(`  ✓ exists ${dest}`); continue; }
      console.log(`  ↓ ${h.url} → ${dest} (${h.width}x${h.height} ${h.duration}s) tags:${(h.tags||"").slice(0,60)}`);
      try {
        const r = await fetch(h.url);
        if (!r.ok) { console.warn(`    download failed ${r.status}`); continue; }
        const buf = Buffer.from(await r.arrayBuffer());
        fs.writeFileSync(dest, buf);
        console.log(`  ✓ ${dest} ${(buf.length/1e6).toFixed(1)}MB`);
        total++;
      } catch(e){ console.warn(`    download error: ${e.message}`); }
    }
  }
}
console.log(`\n✓ Pixabay fetch done — ${total} new files. Rebuild with: node scripts/build-reels-VIDEO-bg.mjs`);
console.log("  Content/music intact — only backgrounds replaced. Audio fade 2s afade preserved.");
