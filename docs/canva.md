# Importing from Canva

The goal: take a design you've already laid out in Canva and reuse its **typography and
placement** in video — which font goes where, at what size, in what colour.

```bash
npm run canva:import -- --file imports/my-design.pdf
npm run canva:import -- --file imports/my-design.svg
npm run canva:import -- --url "https://www.canva.com/design/DAF…/view"
```

Output: `presets/canva/<id>.json`. In the studio, **Canva** tab → **Apply layers**.

---

## Which route to use

| Route | Fonts | Sizes | Positions | Colours | How |
|---|:--:|:--:|:--:|:--:|---|
| **PDF** | ✅ | ✅ | ✅ | ✅ | Share ▸ Download ▸ **PDF Standard** |
| **SVG** | ✅ | ✅ | ✅ | ✅ | Share ▸ Download ▸ SVG *(paid plans)* |
| Share URL | ~ | ❌ | ❌ | ❌ | Title, canvas size, preview image only |
| PNG / JPG | ❌ | ❌ | ❌ | ~ | Canvas size and colour palette only |

**Use the PDF.** It is the only route that is both universally available and complete. A
Canva share link is a JavaScript application shell — the document itself sits behind their
private API, so there is nothing in the HTML to read beyond the metadata. That's a Canva
limitation, not a missing feature here.

If the machine running the import can't reach canva.com (locked-down CI, sandbox), save the
page in your own browser and pass the file:

```bash
npm run canva:import -- --file imports/design.html --url "https://www.canva.com/design/…"
```

---

## What the importer works out

### 1. Font mapping

Every font name in the design is matched against `assets/fonts/fonts.json`:

- **exact** — the family is already in the repo (`Anton` → `anton`)
- **substitute** — a known lookalike (`Canva Sans` → Poppins, `Glacial Indifference` →
  Montserrat, `Brittany` → Caveat)
- **fallback** — nothing close, so the nearest category (serif / sans / display / script)

`PlayfairDisplay-SemiBoldItalic` is understood as family *Playfair Display*, weight 600,
italic — then snapped to the closest weight actually installed.

Canva's licensed fonts can't be redistributed, so to use the real one:

```bash
cp ~/Downloads/CanvaSans-Bold.ttf assets/fonts/canva-sans/
npm run fonts
```

(or drag it into the studio's **Media ▸ font** uploader, which rebuilds the manifest for you)

### 2. Roles — "which font goes where"

Each text block gets a role from its size rank, position and length:

| Role | Rule of thumb | Maps to preset |
|---|---|---|
| `hook` | Biggest text, upper half, short | `hook` |
| `quote` | Biggest text, long | `quote` |
| `subhead` | Mid-size | `caption` |
| `caption` | Small, bottom fifth | `caption` |
| `handle` | Small, top fifth | `handle` |
| `cta` | Small, uppercase, short | `highlight` |
| `body` | Anything over 80 characters | `caption` |

The role picks the starting style preset — so a Canva headline becomes a video hook with an
outline and a rise-in animation, not just text at coordinates.

### 3. Geometry

PDF and SVG both position text by **baseline**; SVG can also anchor a run at its middle or
end. Both are normalised to a centre point, measured with the matched font's own metrics,
then divided by the page size — so everything ends up as `x: 0.5, y: 0.27` fractions that
survive a change of output format.

---

## The preset file

```jsonc
{
  "id": "quote-series",
  "design":  { "width": 1080, "height": 1920, "pages": 1, "suggestedFormat": "reel" },
  "palette": ["#ffffff", "#d9b84c"],
  "fonts": [
    { "canvaFont": "Anton-Regular", "fontFamily": "anton", "familyName": "Anton",
      "fontWeight": 400, "match": "exact", "usedFor": ["hook"] }
  ],
  "textBlocks": [
    { "text": "YOU ARE NOT BEHIND", "role": "hook", "canvaFont": "Anton-Regular",
      "x": 0.5, "y": 0.27, "width": 0.86, "fontSize": 0.05, "color": "#ffffff" }
  ],
  "layers": [ /* ready to drop into any project */ ],
  "notes":  [ "Substituted 1 font…" ]
}
```

`layers` is a complete layer stack. Apply it, then retime the layers on the timeline — the
importer staggers them 0.25 s apart as a starting point, since a static design has no
timing information in it.

---

## Multi-page designs

A multi-page Canva PDF is read in full (`design.pages`), but only page 1 becomes layers.
Pages are usually alternative frames rather than a sequence; import, then duplicate the
project per page if you want each one as its own video.
