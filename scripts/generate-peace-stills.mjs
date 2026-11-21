import sharp from "sharp";
import fs from "fs";
import path from "path";

const outDir = "out";
fs.mkdirSync(outDir, { recursive: true });
fs.mkdirSync("out/peace-cards", { recursive: true });

const chapters = [
  { label: "SILENCE ONE", title: "A Long Day by the Water" },
  { label: "SILENCE TWO", title: "Let Us Go Over to the Other Side" },
  { label: "SILENCE THREE", title: "The Lake Is Not a Gentle Place" },
  { label: "SILENCE FOUR", title: "The Water Was Over Their Ankles" },
  { label: "SILENCE FIVE", title: "Asleep on a Cushion" },
  { label: "SILENCE SIX", title: "Teacher Don't You Care" },
  { label: "SILENCE SEVEN", title: "Peace Be Still" },
  { label: "SILENCE EIGHT", title: "And There Was a Great Calm" },
];

const accent = "#D4AF37";

// Generate chapter card PNGs WITHOUT lines/dashes per user request
for (let i = 0; i < chapters.length; i++) {
  const ch = chapters[i];
  const svg = `<svg width="1920" height="1080" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#111114"/><stop offset="48%" stop-color="#1a1a1f"/><stop offset="100%" stop-color="#0a0a0d"/>
    </linearGradient>
  </defs>
  <rect width="1920" height="1080" fill="url(#bg)"/>
  <g opacity="0.05">${Array.from({length: 120}, (_,k)=>`<circle cx="${(k*53)%1920}" cy="${(k*97)%1080}" r="0.6" fill="white"/>`).join("")}</g>
  <g text-anchor="middle" font-family="sans-serif">
    <text x="960" y="500" font-size="13" letter-spacing="7" fill="${accent}" font-weight="900">${ch.label}</text>
    <text x="960" y="570" font-size="44" font-weight="900" fill="white" letter-spacing="-1">${ch.title.toUpperCase()}</text>
  </g>
  <g font-family="sans-serif" text-anchor="middle">
    <text x="960" y="1035" font-size="11" letter-spacing="4" fill="rgba(255,255,255,0.40)">ABBAS TABLE MARK 4 35 41</text>
  </g>
</svg>`;
  const out = `out/peace-cards/peace-card-${String(i+1).padStart(2,"0")}-${ch.label.toLowerCase().replace(/\s+/g,"-")}.png`;
  await sharp(Buffer.from(svg)).png().toFile(out);
  console.log(out, (fs.statSync(out).size/1024).toFixed(0)+"KB");
}

const introSvg = `<svg width="1920" height="1080" xmlns="http://www.w3.org/2000/svg">
<defs><linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#06080f"/><stop offset="100%" stop-color="#0a0a12"/></linearGradient></defs>
<rect width="1920" height="1080" fill="url(#bg)"/>
<text x="960" y="490" text-anchor="middle" font-family="sans-serif" font-size="70" font-weight="900" fill="white" letter-spacing="-1">PEACE BE STILL</text>
<text x="960" y="535" text-anchor="middle" font-family="sans-serif" font-size="20" fill="#CBD5E1">Eight silences in Mark 4 Even if nothing has changed yet</text>
<text x="960" y="600" text-anchor="middle" font-family="sans-serif" font-size="12" letter-spacing="5" fill="rgba(255,255,255,0.55)">MARK 4 35 41 When the water was over their ankles</text>
</svg>`;
await sharp(Buffer.from(introSvg)).png().toFile("out/peace-cards/intro-hook.png");
console.log("out/peace-cards/intro-hook.png");

const cardFiles = fs.readdirSync("out/peace-cards").filter(f=>f.startsWith("peace-card-")).sort();
const cols=2, rows=4, thumbW=480, thumbH=270, pad=12;
const sheetW = cols*thumbW + (cols+1)*pad;
const sheetH = rows*thumbH + (rows+1)*pad + 90;
const svgParts = [`<svg width="${sheetW}" height="${sheetH}" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#09090b"/>`];
svgParts.push(`<text x="${sheetW/2}" y="48" text-anchor="middle" font-family="sans-serif" font-size="22" font-weight="900" fill="white" letter-spacing="1">PEACE BE STILL HD No Lines No Dashes</text>`);
svgParts.push(`<text x="${sheetW/2}" y="70" text-anchor="middle" font-family="sans-serif" font-size="12" fill="rgba(255,255,255,0.55)">8 SILENCES 14:27 HD 1920x1080 Reference Style Clean</text>`);
let idx=0;
for(let r=0;r<rows;r++) for(let c=0;c<cols;c++){
  const f=cardFiles[idx++]; if(!f) break;
  const buf = fs.readFileSync(path.join("out/peace-cards", f));
  const b64 = buf.toString("base64");
  const x = pad + c*(thumbW+pad), y = 90 + pad + r*(thumbH+pad);
  svgParts.push(`<image href="data:image/png;base64,${b64}" x="${x}" y="${y}" width="${thumbW}" height="${thumbH}" preserveAspectRatio="xMidYMid slice"/>`);
  svgParts.push(`<rect x="${x}" y="${y}" width="${thumbW}" height="${thumbH}" fill="none" stroke="rgba(255,255,255,0.10)" rx="8"/>`);
}
svgParts.push(`</svg>`);
await sharp(Buffer.from(svgParts.join(""))).png().toFile("out/peace-contact-sheet.png");
console.log("out/peace-contact-sheet.png", (fs.statSync("out/peace-contact-sheet.png").size/1024).toFixed(0)+"KB");
