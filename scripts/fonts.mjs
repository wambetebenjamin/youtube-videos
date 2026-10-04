#!/usr/bin/env node
/**
 * Font library manager.
 *
 *   npm run fonts                     # rebuild manifest + metrics from assets/fonts
 *   npm run fonts -- --starter-pack   # download the curated Google Fonts starter pack
 *   npm run fonts -- --add ./My.ttf   # copy a font file into the library
 *   npm run fonts -- --list
 *
 * Every font in assets/fonts is used by BOTH the browser preview (@font-face)
 * and the renderer (resvg), so what you see is what you export.
 */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import * as fontkit from 'fontkit';
import { ROOT, FONTS_DIR } from '../src/core/paths.js';
import { METRIC_CHARS } from '../src/core/charset.js';

const args = process.argv.slice(2);
const has = (f) => args.includes(f);
const valueOf = (f) => {
  const i = args.indexOf(f);
  return i >= 0 ? args[i + 1] : null;
};

/* ------------------------------------------------------------------ *
 * The curated starter pack.
 * Chosen to cover the typography Canva templates lean on: geometric
 * sans for captions, condensed display for hooks, elegant serif for
 * quotes, a script for accents.
 * ------------------------------------------------------------------ */
const STARTER_PACK = [
  { pkg: 'montserrat',        family: 'Montserrat',        category: 'sans',    roles: ['headline', 'caption', 'body'], faces: ['400Regular', '600SemiBold', '700Bold', '800ExtraBold'] },
  { pkg: 'poppins',           family: 'Poppins',           category: 'sans',    roles: ['headline', 'caption'],         faces: ['400Regular', '600SemiBold', '700Bold'] },
  { pkg: 'inter',             family: 'Inter',             category: 'sans',    roles: ['body', 'caption', 'ui'],       faces: ['400Regular', '600SemiBold', '700Bold'] },
  { pkg: 'lato',              family: 'Lato',              category: 'sans',    roles: ['body'],                        faces: ['400Regular', '700Bold'] },
  { pkg: 'oswald',            family: 'Oswald',            category: 'sans',    roles: ['headline'],                    faces: ['400Regular', '700Bold'] },
  { pkg: 'bebas-neue',        family: 'Bebas Neue',        category: 'display', roles: ['hook', 'headline'],            faces: ['400Regular'] },
  { pkg: 'anton',             family: 'Anton',             category: 'display', roles: ['hook', 'impact'],              faces: ['400Regular'] },
  { pkg: 'archivo-black',     family: 'Archivo Black',     category: 'display', roles: ['impact'],                      faces: ['400Regular'] },
  { pkg: 'playfair-display',  family: 'Playfair Display',  category: 'serif',   roles: ['quote', 'headline'],           faces: ['400Regular', '700Bold', '400Regular_Italic'] },
  { pkg: 'lora',              family: 'Lora',              category: 'serif',   roles: ['quote', 'body'],               faces: ['400Regular', '700Bold'] },
  { pkg: 'dm-serif-display',  family: 'DM Serif Display',  category: 'serif',   roles: ['quote', 'headline'],           faces: ['400Regular'] },
  { pkg: 'caveat',            family: 'Caveat',            category: 'script',  roles: ['accent', 'signature'],         faces: ['400Regular', '700Bold'] },
];

const WEIGHT_OF = {
  '100Thin': 100, '200ExtraLight': 200, '300Light': 300, '400Regular': 400,
  '500Medium': 500, '600SemiBold': 600, '700Bold': 700, '800ExtraBold': 800, '900Black': 900,
};

function slug(s) {
  return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

/* ------------------------------------------------------------------ *
 * Download the starter pack.
 * Google's CDN and GitHub raw are often blocked on locked-down boxes,
 * so we pull the TTFs out of npm packages instead (same upstream files,
 * same OFL licence).
 * ------------------------------------------------------------------ */
function installStarterPack() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'fontpack-'));
  const specs = STARTER_PACK.map((f) => `@expo-google-fonts/${f.pkg}`);
  console.log(`  fetching ${specs.length} font packages from npm…`);
  fs.writeFileSync(path.join(tmp, 'package.json'), JSON.stringify({ name: 'fontpack', private: true }));
  execFileSync('npm', ['install', '--no-audit', '--no-fund', '--loglevel', 'error', ...specs], {
    cwd: tmp, stdio: ['ignore', 'ignore', 'inherit'],
  });

  let copied = 0;
  for (const entry of STARTER_PACK) {
    const base = path.join(tmp, 'node_modules', '@expo-google-fonts', entry.pkg);
    if (!fs.existsSync(base)) { console.warn(`  ! missing package for ${entry.family}`); continue; }
    const destDir = path.join(FONTS_DIR, slug(entry.family));
    fs.mkdirSync(destDir, { recursive: true });

    for (const face of entry.faces) {
      const dir = path.join(base, face);
      if (!fs.existsSync(dir)) { console.warn(`  ! ${entry.family} ${face} not in package`); continue; }
      const ttf = fs.readdirSync(dir).find((f) => f.toLowerCase().endsWith('.ttf'));
      if (!ttf) continue;
      const weight = WEIGHT_OF[face.replace('_Italic', '')] || 400;
      const italic = face.includes('Italic');
      const name = `${slug(entry.family)}-${weight}${italic ? 'i' : ''}.ttf`;
      fs.copyFileSync(path.join(dir, ttf), path.join(destDir, name));
      copied++;
    }
    // Keep the upstream licence next to the files.
    const lic = ['LICENSE', 'LICENSE.txt', 'OFL.txt'].map((f) => path.join(base, f)).find((f) => fs.existsSync(f));
    if (lic) fs.copyFileSync(lic, path.join(destDir, 'OFL.txt'));
  }
  fs.rmSync(tmp, { recursive: true, force: true });
  console.log(`  copied ${copied} font files into assets/fonts`);
}

/* ------------------------------------------------------------------ *
 * Scan assets/fonts and build manifest + metrics.
 * ------------------------------------------------------------------ */
function buildManifest() {
  const meta = new Map(STARTER_PACK.map((f) => [slug(f.family), f]));
  const families = [];
  const metrics = {};

  const dirs = fs.existsSync(FONTS_DIR)
    ? fs.readdirSync(FONTS_DIR, { withFileTypes: true }).filter((d) => d.isDirectory() && d.name !== 'metrics')
    : [];

  for (const dir of dirs) {
    const familyDir = path.join(FONTS_DIR, dir.name);
    const files = fs.readdirSync(familyDir).filter((f) => /\.(ttf|otf)$/i.test(f));
    if (!files.length) continue;

    const known = meta.get(dir.name);
    const faces = [];

    for (const file of files.sort()) {
      const abs = path.join(familyDir, file);
      let font;
      try {
        font = fontkit.openSync(abs);
      } catch (err) {
        console.warn(`  ! could not read ${file}: ${err.message}`);
        continue;
      }
      if (font.fonts) font = font.fonts[0]; // ttc collection

      const m = /-(\d{3})(i?)\.(ttf|otf)$/i.exec(file);
      const weight = m ? Number(m[1]) : (font['OS/2']?.usWeightClass || 400);
      const italic = m ? m[2] === 'i' : /italic|oblique/i.test(font.subfamilyName || '');
      const key = `${dir.name}-${weight}${italic ? 'i' : ''}`;

      faces.push({
        key,
        weight,
        style: italic ? 'italic' : 'normal',
        file: path.relative(ROOT, abs).split(path.sep).join('/'),
        postscriptName: font.postscriptName || null,
      });

      // Advance-width table, shared by the browser and the renderer so
      // line breaks land in exactly the same place in both.
      const advances = {};
      for (const ch of METRIC_CHARS) {
        const cp = ch.codePointAt(0);
        try {
          const glyph = font.glyphForCodePoint(cp);
          if (glyph) advances[cp] = Math.round(glyph.advanceWidth);
        } catch { /* glyph missing — fall back to defaultAdvance */ }
      }
      metrics[key] = {
        unitsPerEm: font.unitsPerEm,
        ascent: font.ascent,
        descent: font.descent,
        lineGap: font.lineGap || 0,
        capHeight: font.capHeight || Math.round(font.ascent * 0.7),
        xHeight: font.xHeight || Math.round(font.ascent * 0.5),
        defaultAdvance: advances[32] ? Math.round(font.unitsPerEm * 0.5) : Math.round(font.unitsPerEm * 0.5),
        advances,
      };
    }

    if (!faces.length) continue;
    families.push({
      id: dir.name,
      name: known?.family || faces[0].postscriptName?.split('-')[0] || dir.name,
      category: known?.category || 'custom',
      roles: known?.roles || ['custom'],
      license: fs.existsSync(path.join(familyDir, 'OFL.txt')) ? 'OFL-1.1' : 'unknown',
      faces: faces.sort((a, b) => a.weight - b.weight || a.style.localeCompare(b.style)),
    });
  }

  families.sort((a, b) => a.name.localeCompare(b.name));
  const manifest = { generatedAt: new Date().toISOString(), families };

  fs.writeFileSync(path.join(FONTS_DIR, 'fonts.json'), JSON.stringify(manifest, null, 2));
  fs.mkdirSync(path.join(FONTS_DIR, 'metrics'), { recursive: true });
  fs.writeFileSync(path.join(FONTS_DIR, 'metrics', 'metrics.json'), JSON.stringify(metrics));

  const faceCount = families.reduce((n, f) => n + f.faces.length, 0);
  console.log(`  manifest: ${families.length} families / ${faceCount} faces`);
  return manifest;
}

function addFont(src) {
  const abs = path.resolve(src);
  if (!fs.existsSync(abs)) throw new Error(`no such file: ${src}`);
  let font = fontkit.openSync(abs);
  if (font.fonts) font = font.fonts[0];
  const family = font.familyName || path.basename(abs, path.extname(abs));
  const weight = font['OS/2']?.usWeightClass || 400;
  const italic = /italic|oblique/i.test(font.subfamilyName || '');
  const destDir = path.join(FONTS_DIR, slug(family));
  fs.mkdirSync(destDir, { recursive: true });
  const dest = path.join(destDir, `${slug(family)}-${weight}${italic ? 'i' : ''}${path.extname(abs).toLowerCase()}`);
  fs.copyFileSync(abs, dest);
  console.log(`  added ${family} ${weight}${italic ? ' italic' : ''} → ${path.relative(ROOT, dest)}`);
}

/* ------------------------------------------------------------------ */
if (has('--starter-pack')) installStarterPack();
if (has('--add')) addFont(valueOf('--add'));
const manifest = buildManifest();
if (has('--list')) {
  for (const f of manifest.families) {
    console.log(`  ${f.name.padEnd(20)} ${f.category.padEnd(8)} ${f.faces.map((x) => x.weight + (x.style === 'italic' ? 'i' : '')).join(' ')}   [${f.roles.join(', ')}]`);
  }
}
