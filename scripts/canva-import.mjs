#!/usr/bin/env node
/**
 * Turn a Canva design into a reusable template.
 *
 *   npm run canva:import -- --file imports/my-design.pdf
 *   npm run canva:import -- --file imports/my-design.svg
 *   npm run canva:import -- --url "https://www.canva.com/design/DAF…/view"
 *   npm run canva:import -- --file imports/page.html --name "Quote series"
 *
 * The PDF route is the accurate one: Canva ▸ Share ▸ Download ▸ PDF Standard.
 * It carries the real font names, point sizes and x/y positions, which is
 * what lets this map each text block onto a font in assets/fonts and a
 * placement in the video frame.
 */
import { importCanva } from '../src/server/lib/canva.js';
import { parseArgs, c, die } from './lib/cli.mjs';

const { flags, positional } = parseArgs();

if (flags.help || (!flags.file && !flags.url && !positional.length)) {
  console.log(`
  ${c.bold('npm run canva:import')} -- [--file <path> | --url <link>] [--name "Title"] [--format reel]

    --file <path>    a PDF / SVG / HTML / PNG export from Canva (put it in imports/)
    --url  <link>    a public "anyone with the link can view" share URL
    --name "Title"   name for the preset (default: the design title)
    --format <id>    force reel | youtube | square | portrait45

  Writes presets/canva/<id>.json — then hit "Apply layers" in the studio's
  Canva tab, or copy the layers into any project.
`);
  process.exit(flags.help ? 0 : 1);
}

const input = {
  file: flags.file || (positional[0] && !/^https?:/.test(positional[0]) ? positional[0] : null),
  url: flags.url || (positional[0] && /^https?:/.test(positional[0]) ? positional[0] : null),
  name: typeof flags.name === 'string' ? flags.name : null,
  format: typeof flags.format === 'string' ? flags.format : null,
};

try {
  const { preset, file } = await importCanva(input);

  console.log(`\n  ${c.green('✓')} ${c.bold(preset.name)} → ${file}`);
  console.log(`    design   ${preset.design.width}×${preset.design.height} · ${preset.design.pages} page(s) · suggested format: ${c.cyan(preset.design.suggestedFormat)}`);

  if (preset.palette?.length) {
    console.log(`    palette  ${preset.palette.join(' ')}`);
  }

  if (preset.fonts?.length) {
    console.log(`\n  ${c.bold('Fonts')}`);
    for (const f of preset.fonts) {
      const mark = f.match === 'exact' ? c.green('exact') : f.match === 'substitute' ? c.yellow('substitute') : c.red('fallback');
      console.log(`    ${String(f.canvaFont).padEnd(28)} → ${String(f.familyName).padEnd(18)} ${String(f.fontWeight).padEnd(4)} ${mark}  ${c.dim(f.usedFor.join(', '))}`);
    }
  }

  if (preset.textBlocks?.length) {
    console.log(`\n  ${c.bold('Text blocks')} ${c.dim('(role · position · size)')}`);
    for (const b of preset.textBlocks) {
      console.log(`    ${String(b.role).padEnd(9)} ${c.dim(`x${b.x} y${b.y} ${(b.fontSize * 100).toFixed(1)}%h`)}  ${JSON.stringify(b.text.slice(0, 46))}`);
    }
  }

  for (const n of preset.notes || []) console.log(`\n  ${c.yellow('note')} ${n}`);
  console.log(`\n  ${c.dim('Apply it in the studio → Canva tab → Apply layers.')}\n`);
} catch (err) {
  die(err.message);
}
