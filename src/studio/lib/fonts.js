/**
 * Loads the repository's own fonts into the browser, so the preview
 * renders with the exact same files resvg uses at export time.
 */
let injected = false;

export function injectFontFaces(manifest) {
  if (injected || !manifest?.families?.length) return;
  const css = [];
  for (const family of manifest.families) {
    for (const face of family.faces) {
      css.push(
        `@font-face{font-family:"${family.name}";src:url("/${face.file}") format("truetype");` +
        `font-weight:${face.weight};font-style:${face.style};font-display:block;}`,
      );
    }
  }
  const style = document.createElement('style');
  style.id = 'reelsmith-fonts';
  style.textContent = css.join('\n');
  document.head.appendChild(style);
  injected = true;

  // Force the faces to load now so the first paint isn't a fallback font.
  if (document.fonts?.load) {
    for (const family of manifest.families) {
      for (const face of family.faces) {
        document.fonts.load(`${face.style} ${face.weight} 64px "${family.name}"`).catch(() => {});
      }
    }
  }
}

export function makeFamilyLookup(manifest) {
  const map = new Map((manifest?.families || []).map((f) => [f.id, f.name]));
  return (id) => map.get(id) || id || 'Montserrat';
}
