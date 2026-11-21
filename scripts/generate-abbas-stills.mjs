import sharp from "sharp";
import fs from "fs";
import path from "path";

const W = 1920;
const H = 1080;

const chapters = [
  {
    id: "intro",
    label: "ABBAS STORIES • FAITH & WISDOM SERIES",
    title: "2 TIMELESS LAWS\nFOR A BETTER LIFE",
    subtitle: "The Law of Use  &  The Law of Sowing and Reaping",
    bg: ["#0a0a14", "#1a1a2e", "#2a2410"],
    accent: "#D4AF37",
    ref: "Matthew 25:14-30",
    footer: "Inspired by Jim Rohn • Parable of the Talents",
    icon: "✦",
  },
  {
    id: "law1",
    label: "LAW 1  •  THE LAW OF USE",
    title: "WHATEVER YOU\nDON'T USE,\nYOU LOSE",
    subtitle: "Lack of use causes loss • A talent unused is lost",
    bg: ["#c9a86a", "#7a4a1f", "#2c1810"],
    accent: "#D4AF37",
    ref: "Matthew 25:29",
    quote: "Today, unused is lost. If you tie your arm and leave it, you'll never use it again.",
    icon: "◐",
  },
  {
    id: "parable",
    label: "THE PARABLE  •  THREE SERVANTS",
    title: "5 TALENTS → 10\n2 TALENTS → 4\n1 TALENT → BURIED",
    subtitle: "He gave five to one, two to another, one to the last — see what you can do while I'm gone",
    bg: ["#6a6a6a", "#2a2a2a", "#1a1a1a"],
    accent: "#D4AF37",
    ref: "Matthew 25:20",
    icon: "⬢",
  },
  {
    id: "buried",
    label: "THE WARNING",
    title: "THE BURIED\nTALENT",
    subtitle: "Carefully wrapped and hidden — and lost",
    bg: ["#2a2a3a", "#1a1a2e", "#0d0d14"],
    accent: "#D4AF37",
    ref: "Master: Take that talent and give it to him who has ten",
    icon: "◯",
  },
  {
    id: "takeaway1",
    label: "KEY INSIGHT",
    title: "TAKE A NEW\nINVENTORY",
    subtitle: "Ambition • Vitality • Faith — use it or lose it",
    bg: ["#3a4a2e", "#1e2e1a", "#0d1a0f"],
    accent: "#D4AF37",
    ref: "WHATEVER YOU DO NOT EMPLOY, YOU FORFEIT. IT'S A LAW.",
    icon: "⛰",
  },
  {
    id: "law2",
    label: "LAW 2  •  LAW OF SOWING & REAPING",
    title: "WHATEVER\nYOU REAP IS\nWHAT YOU'VE SOWN",
    subtitle: "If you don't like the crop, look in the mirror",
    bg: ["#2a3a1a", "#1a2a0a", "#0d1205"],
    accent: "#D4AF37",
    ref: "Galatians 6:7",
    icon: "⬥",
  },
  {
    id: "keys",
    label: "THE 7 KEYS  •  21 SECONDS",
    title: "7 KEYS TO\nSOWING & REAPING",
    subtitle: "1 Negative • 2 Positive • 3 More • 4 Many Ways • 5 Anyone • 6 You Could Lose • 7 You Must Sow",
    bg: ["#e8c878", "#8a6a1a", "#2a1e05"],
    accent: "#D4AF37",
    ref: "You don't reap what you sow — you reap MUCH MORE than you sow",
    icon: "⬔",
  },
  {
    id: "closing",
    label: "CLOSING",
    title: "DON'T TRY\nTO BEAT IT",
    subtitle: "Get some sowing going — don't let the springs pass",
    bg: ["#1a1008", "#5a3a14", "#0a0a0a"],
    accent: "#F4C430",
    ref: "Ecclesiastes 11:4 — Life is so short. Whatever you're going to do, get at it.",
    icon: "✦",
  },
];

function escapeXml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function makeSVG(ch) {
  const titleLines = ch.title.split("\n").map(escapeXml);
  const titleSvg = titleLines
    .map((line, i) => `<tspan x="960" dy="${i === 0 ? 0 : 78}">${line}</tspan>`)
    .join("");

  const titleSize = ch.title.includes("2 TIMELESS") ? 64 : 62;
  const subtitleEsc = escapeXml(ch.subtitle);
  const refEsc = escapeXml(ch.ref);
  const labelEsc = escapeXml(ch.label);
  const footerEsc = ch.quote ? escapeXml(ch.quote) : escapeXml(ch.footer || "");
  const quoteSvg = ch.quote
    ? `<text x="960" y="880" text-anchor="middle" font-family="Georgia, serif" font-style="italic" font-size="18" fill="rgba(255,255,255,0.88)">${escapeXml(ch.quote)}</text>`
    : "";

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${ch.bg[0]}"/>
      <stop offset="55%" stop-color="${ch.bg[1]}"/>
      <stop offset="100%" stop-color="${ch.bg[2]}"/>
    </linearGradient>
    <radialGradient id="glow" cx="65%" cy="35%" r="60%">
      <stop offset="0%" stop-color="${ch.accent}" stop-opacity="0.22"/>
      <stop offset="55%" stop-color="${ch.accent}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="vignette" cx="50%" cy="50%" r="80%">
      <stop offset="60%" stop-color="black" stop-opacity="0"/>
      <stop offset="100%" stop-color="black" stop-opacity="0.55"/>
    </radialGradient>
    <filter id="noise"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" stitchTiles="stitch"/></filter>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <rect width="${W}" height="${H}" fill="url(#glow)" opacity="0.9"/>
  <rect width="${W}" height="${H}" fill="url(#vignette)"/>
  <!-- subtle icon watermark -->
  <text x="960" y="540" text-anchor="middle" dominant-baseline="middle" font-size="420" fill="${ch.accent}" opacity="0.06" font-family="sans-serif">${ch.icon}</text>
  
  <!-- Top progress bar -->
  <rect x="0" y="0" width="${W}" height="3" fill="rgba(255,255,255,0.08)"/>
  <rect x="0" y="0" width="${Math.round((chapters.indexOf(ch)+1)/chapters.length * W)}" height="3" fill="${ch.accent}" opacity="0.95"/>
  
  <!-- Hook badge -->
  <g transform="translate(960, 148)">
    <rect x="-210" y="-18" width="420" height="36" rx="18" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.14)"/>
    <circle cx="-178" cy="0" r="7" fill="${ch.accent}"/>
    <text x="-162" y="6" font-family="sans-serif" font-size="13" font-weight="700" letter-spacing="2.5" fill="rgba(255,255,255,0.92)" text-anchor="start">${labelEsc}</text>
  </g>

  <!-- Title -->
  <text x="960" y="${ch.title.split("\n").length === 3 ? 340 : 360}" text-anchor="middle" font-family="sans-serif" font-size="${titleSize}" font-weight="900" fill="white" letter-spacing="-1" style="paint-order: stroke; stroke: rgba(0,0,0,0.45); stroke-width: 6; text-shadow: 0 6px 30px rgba(0,0,0,0.55);">
    ${titleSvg}
  </text>

  <!-- Gold line -->
  <rect x="900" y="560" width="120" height="2" rx="1" fill="${ch.accent}" opacity="0.95"/>
  <rect x="880" y="561" width="160" height="1" fill="white" opacity="0.22"/>

  <!-- Subtitle -->
  <foreignObject x="420" y="590" width="1080" height="120">
    <div xmlns="http://www.w3.org/1999/xhtml" style="text-align:center; color: rgba(203,213,225,0.96); font-family: sans-serif; font-size: 20px; font-weight: 500; line-height: 1.45;">
      ${subtitleEsc}
    </div>
  </foreignObject>

  <!-- Lower third mock (chapter ID) -->
  <g transform="translate(100, 860)">
    <rect x="0" y="0" width="4" height="92" rx="2" fill="${ch.accent}"/>
    <rect x="4" y="0" width="620" height="92" rx="12" fill="rgba(0,0,0,0.70)" stroke="rgba(255,255,255,0.12)"/>
    <text x="22" y="24" font-family="sans-serif" font-size="12" font-weight="900" letter-spacing="2.4" fill="${ch.accent}">${labelEsc}</text>
    <text x="22" y="50" font-family="sans-serif" font-size="18" font-weight="800" fill="white">${escapeXml(ch.title.split("\n")[0])}</text>
    <text x="22" y="72" font-family="sans-serif" font-size="13" font-weight="500" fill="#CCCCCC">${subtitleEsc.slice(0,58)}</text>
  </g>

  <!-- Scripture ref pill -->
  <g transform="translate(960, 980)">
    <rect x="-170" y="-20" width="340" height="34" rx="17" fill="rgba(0,0,0,0.62)" stroke="rgba(212,175,55,0.32)"/>
    <text x="-120" y="6" font-family="Georgia, serif" font-style="italic" font-size="15" font-weight="700" fill="${ch.accent}" text-anchor="middle">${refEsc}</text>
    <text x="-150" y="5" font-size="12" fill="${ch.accent}">✦</text>
  </g>

  ${quoteSvg}

  <!-- Film grain hint -->
  <rect width="${W}" height="${H}" fill="white" opacity="0.015" filter="url(#noise)"/>
</svg>`;
}

async function main() {
  const outDir = path.join(process.cwd(), "out");
  fs.mkdirSync(outDir, { recursive: true });

  for (const ch of chapters) {
    const svg = makeSVG(ch);
    const outPath = path.join(outDir, `abbas-still-${ch.id}.png`);
    await sharp(Buffer.from(svg)).png().toFile(outPath);
    console.log(`✓ ${outPath}`);
  }

  // Also generate preview thumb (frame 45 equivalent = intro)
  const introSvg = makeSVG(chapters[0]);
  await sharp(Buffer.from(introSvg)).resize(960, 540).png().toFile(path.join(outDir, "abbas-preview-thumb.png"));
  console.log("✓ preview thumb");

  // Generate HTML preview
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Abbas Stories — 2 Timeless Laws • Remotion Preview</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box} body{background:#06080f;color:#fff;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif}
  header{padding:24px 28px;border-bottom:1px solid rgba(255,255,255,0.08);display:flex;justify-content:space-between;align-items:center}
  header h1{font-size:18px;letter-spacing:0.12em;text-transform:uppercase} header h1 span{color:#D4AF37}
  .badge{background:rgba(212,175,55,0.12);border:1px solid rgba(212,175,55,0.28);color:#D4AF37;padding:6px 12px;border-radius:999px;font-size:12px;font-weight:800;letter-spacing:0.14em}
  .player{max-width:1280px;margin:24px auto;padding:0 20px}
  .frame{position:relative;background:#000;border-radius:16px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,0.55);aspect-ratio:16/9;border:1px solid rgba(255,255,255,0.10)}
  .frame img{width:100%;height:100%;object-fit:cover;display:block;transition:opacity 380ms ease}
  .controls{display:flex;gap:10px;align-items:center;justify-content:center;margin:16px 0;flex-wrap:wrap}
  .btn{background:#D4AF37;color:#0a0a14;border:none;padding:10px 18px;border-radius:999px;font-weight:900;cursor:pointer}
  .btn.secondary{background:rgba(255,255,255,0.10);color:#fff;border:1px solid rgba(255,255,255,0.14)}
  .timeline{display:grid;grid-template-columns:repeat(8,1fr);gap:8px;margin:18px 0}
  .thumb{border-radius:10px;overflow:hidden;border:2px solid transparent;cursor:pointer;opacity:0.72}
  .thumb.active{border-color:#D4AF37;opacity:1;box-shadow:0 0 0 3px rgba(212,175,55,0.25)}
  .thumb img{width:100%;display:block}
  .meta{display:grid;grid-template-columns:1.2fr 0.8fr;gap:16px;margin-top:16px}
  .card{background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.10);border-radius:14px;padding:16px}
  .card h3{font-size:12px;letter-spacing:0.16em;text-transform:uppercase;color:#D4AF37;margin-bottom:8px}
  .card p{font-size:14px;line-height:1.55;color:rgba(255,255,255,0.88)}
  pre{white-space:pre-wrap;font-size:12px;line-height:1.6;background:rgba(0,0,0,0.45);padding:14px;border-radius:10px;border:1px solid rgba(255,255,255,0.08)}
  @media(max-width:800px){.meta{grid-template-columns:1fr} .timeline{grid-template-columns:repeat(4,1fr)}}
</style>
</head>
<body>
<header>
  <h1><span>Abbas</span> Stories — Cinematic Edit • 1920×1080 30fps • 2:00</h1>
  <div class="badge">READY TO RENDER • Remotion + FreeVideo + Take-One</div>
</header>
<div class="player">
  <div class="frame"><img id="main" src="abbas-still-intro.png" alt="frame"/></div>
  <div class="controls">
    <button class="btn" id="play">▶ Play Sequence</button>
    <button class="btn secondary" id="pause">⏸ Pause</button>
    <span id="label" style="font-size:13px;letter-spacing:0.08em;opacity:0.8">INTRO — 00:00 / 02:00</span>
    <a href="abbas-preview-thumb.png" target="_blank" class="btn secondary" style="text-decoration:none">Open Thumb</a>
  </div>
  <div class="timeline" id="timeline"></div>
  <div class="meta">
    <div class="card"><h3>Edit Decisions (Reference Style Replicated)</h3>
      <p>
        <b>Color:</b> Warm cinematic (amber/gold #F4C430/#D4AF37, deep shadows #1A1A1A, grain 7%, vignette).<br/>
        <b>Lower Thirds:</b> Chapter ID (slide-in 300ms, 100px margins, rgba(0,0,0,0.70)), Scripture (gold italic serif, fade 200ms), Key Point (gradient mask reveal).<br/>
        <b>B-Roll:</b> Wilderness/desert/scrolls/stone/light/seed/harvest — Ken Burns 1.00→1.08 + pan, vignette, 300-500ms x-dissolve.<br/>
        <b>Text:</b> Title cards (dark gradient + gold line), Scripture overlays (rgba(0,0,0,0.62) + gold accent), Quotes (typewriter), Captions (word-highlight).<br/>
        <b>Audio:</b> Voice -16 LUFS, music -24 to -28 LUFS ducked, SFX whoosh on chapter cards.<br/>
        <b>Transitions:</b> Cross-dissolve + dip-to-black for chapters, 1s fade-in, 2s fade-out. Title-safe inner 90%.
      </p>
    </div>
    <div class="card"><h3>Storyboard — 8 Chapters • 120s</h3>
      <pre id="board">Loading…</pre>
    </div>
  </div>
  <div class="card" style="margin-top:16px"><h3>How to Render the MP4</h3>
    <p style="font-size:13px; line-height:1.6">
      <b>Studio preview:</b> <code>npx remotion studio</code> → open http://localhost:3000 → select <code>AbbasStories</code> (already running on port 3000).<br/>
      <b>Headed render (requires Chrome Headless Shell):</b> <code>npx remotion render AbbasStories out/abbas-stories.mp4 --codec h264 --pixel-format yuv420p</code><br/>
      <b>Offline workaround:</b> Stills are in <code>out/abbas-still-*.png</code> → use the bundled <code>scripts/mux-abbas-video.mjs</code> to mux a preview MP4 via the compositor's ffmpeg (no Chrome needed).<br/>
      <b>FreeVideo (GPU):</b> Prompts in <code>public/raw-footage/prompts/</code> → <code>./freevideo generate --prompt-file prompt.txt --out hero.mp4</code> → swap into <code>public/raw-footage/</code> and re-render.
    </p>
  </div>
</div>
<script>
const chapters = ${JSON.stringify(chapters.map(c=>({id:c.id, label:c.label, title:c.title.replace(/\n/g," "), ref:c.ref})))} ;
const files = chapters.map(c => 'abbas-still-'+c.id+'.png');
let idx=0, timer=null;
const img=document.getElementById('main'), label=document.getElementById('label'), tl=document.getElementById('timeline'), board=document.getElementById('board');
function renderTl(){
  tl.innerHTML = files.map((f,i)=>\`<div class="thumb \${i===idx?'active':''}" data-i="\${i}"><img src="\${f}" alt=""/><div style="font-size:10px; text-align:center; padding:4px; letter-spacing:0.08em">\${chapters[i].label}</div></div>\`).join('');
  tl.querySelectorAll('.thumb').forEach(el=>el.addEventListener('click', ()=> { idx=parseInt(el.dataset.i); show(); pause(); }));
}
function show(){ img.style.opacity=0; setTimeout(()=>{ img.src=files[idx]; img.style.opacity=1; },120); label.textContent = \`\${chapters[idx].label} — 00:\${String(Math.floor(idx*15)).padStart(2,'0')} / 02:00 • \${chapters[idx].ref}\`; renderTl(); }
function play(){ if(timer) return; timer=setInterval(()=>{ idx=(idx+1)%files.length; show(); }, 1800); }
function pause(){ clearInterval(timer); timer=null; }
document.getElementById('play').onclick=play; document.getElementById('pause').onclick=pause;
board.textContent = chapters.map((c,i)=> \`\${String(i+1).padStart(2,'0')} \${c.label}\\n   \${c.title} → \${c.ref}\`).join('\\n\\n');
renderTl();
</script>
</body>
</html>`;
  fs.writeFileSync(path.join(outDir, "abbas-preview.html"), html);
  console.log("✓ abbas-preview.html");
}

main().catch(e=>{console.error(e); process.exit(1)});
