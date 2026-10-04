# Reelsmith

A repository that behaves like a video studio.

Drop clips and music into it, layer quotes / captions / overlays on top, **watch it live in
your browser**, then render and download the finished MP4 with one command. Every edit is a
small JSON file, so the repo stays reviewable even though the videos don't live in Git.

```
npm install
npm run setup
npm run dev          →  http://localhost:5173
```

That's the whole loop. Nothing to configure — FFmpeg, the text rasteriser and twelve fonts
all come down with `npm install`.

---

## What it does

| | |
|---|---|
| **Upload** | Drag videos, music, images or `.ttf` fonts into the browser. They land in `media/` inside the repo. |
| **Format** | Reel / Short / TikTok (1080×1920), YouTube (1920×1080 or 4K), Square, 4:5 — with platform-UI safe-area guides drawn on the canvas. |
| **Layer** | Text, quotes with attribution, images, scrims, tint washes, shapes and an animated progress bar. Drag them around the frame. |
| **Type** | 12 font families / 25 faces, with weight, tracking, line height, case, outline, drop shadow and highlight plates. |
| **Music** | Multiple tracks per video — volume, fade in/out, loop, start offset, and sidechain ducking under the clip's own audio. |
| **Preview** | Live. Scrub the timeline and the overlays move with the video, in the real fonts at the real sizes. |
| **Render** | `npm run render -- <project>` or the Render button, with a progress bar. |
| **Download** | `npm run download -- --latest --to ~/Desktop`, a Download button in the studio, or `--serve` for a link. |
| **Canva** | Import a design and it maps every text block to a font in `assets/fonts`, a role (hook / quote / caption / handle) and a position in the frame. |
| **Batch** | Apply one design across a folder of clips, rotating a different quote into each. |

---

## The loop

### 1. Preview first

```bash
npm run dev
```

Opens the studio on `:5173` with the API on `:8787`. The studio proxies the API, so one
origin is all the browser needs — it works the same locally or behind an HTTPS preview URL.

The repo ships with a generated sample clip and audio bed, plus a `sample-reel` project, so
there is something moving on screen before you upload anything.

### 2. Upload

**Media** tab → drop files. They are written straight into the repository:

```
media/source/   your clips        (.mp4 .mov .webm .mkv)
media/music/    your music        (.mp3 .wav .m4a .aac .ogg)
media/images/   logos, overlays   (.png .jpg .webp .svg)
assets/fonts/   your own fonts    (.ttf .otf — manifest rebuilds automatically)
```

Big or already on disk? Skip the browser — `npm run import -- ~/Movies/*.mp4 --link` points
the repo at the files without copying a byte. See [docs/media.md](docs/media.md).

### 3. Edit

- **Add** tab → a text preset (hook, caption, highlight, quote, lower third, handle…)
- **Quotes** tab → 48 quotes across four packs; click one to drop it in as a quote layer
- Drag text around the canvas (it snaps to centre and thirds; hold <kbd>Alt</kbd> to ignore snapping)
- Drag the bars in the timeline to retime, drag their edges to trim
- Right panel: font, size, colour, plate, outline, shadow, position, enter/exit animation
- <kbd>Space</kbd> play · <kbd>←</kbd>/<kbd>→</kbd> step a frame · <kbd>⌫</kbd> delete layer · <kbd>⌘Z</kbd> undo

Everything autosaves to `projects/<id>.json`.

### 4. Render and download

```bash
npm run render -- sample-reel                  # one project
npm run render -- sample-reel --preset draft   # fast half-size proof
npm run render -- --all                        # everything in projects/

npm run download -- --latest                   # where is it?
npm run download -- --latest --to ~/Desktop    # copy it out
npm run download -- --all --to ./out
npm run download -- --latest --serve           # HTTP link, for remote machines
```

Renders land in `media/exports/` next to a `.json` sidecar recording the exact project that
produced them, and a `.jpg` poster frame.

---

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Studio + API together (live preview) |
| `npm run setup` | Folders, fonts, sample media, example project |
| `npm run import -- <files> [--link]` | Bring footage in — `--link` copies nothing |
| `npm run proxy` | Build 540p stand-ins so big clips scrub smoothly |
| `npm run render -- <id\|--all>` | Render to MP4 |
| `npm run download -- --latest [--to DIR]` | Get a finished file out |
| `npm run exports` | List what's been rendered |
| `npm run batch -- --template <id> --clips "<glob>"` | One design across many clips |
| `npm run canva:import -- --file imports/x.pdf` | Canva design → template |
| `npm run quotes` | Browse / add quote packs |
| `npm run fonts -- --starter-pack` | (Re)build the font library |
| `npm run doctor` | Check the toolchain |
| `npm run build && npm run serve` | Production build on a single port |

---

## Layout

```
├── projects/            edit specs — plain JSON, one per video  ← tracked in Git
├── templates/           designs with no clip bound yet
├── media/
│   ├── source/          uploaded clips                          ← ignored by Git
│   ├── music/           uploaded audio                          ← ignored
│   ├── images/          logos / overlays                        ← ignored
│   ├── proxies/         540p preview stand-ins (rebuildable)     ← ignored
│   └── exports/         rendered videos + posters + sidecars    ← ignored
├── assets/
│   ├── fonts/           .ttf files + fonts.json + metrics       ← tracked
│   └── brand/           your logo, palette
├── content/quotes/      quote packs (JSON)                      ← tracked
├── presets/
│   ├── export.json      quality presets
│   └── canva/           imported Canva templates                ← tracked
├── imports/             Canva PDFs/SVGs you want analysed       ← ignored
├── src/
│   ├── core/            shared: layout, SVG, timeline, schema
│   ├── server/          API + render engine
│   └── studio/          React studio
└── scripts/             the CLI
```

### Big files

**Your footage never goes into Git.** `media/` is ignored; `projects/*.json` — the part that
describes your edit — is tracked. So there's no 25 MB web-upload limit, no 100 MB push
rejection, and no repo that remembers a 600 MB clip forever. A diff on a project file tells
you someone changed a font or moved a caption; a diff on an MP4 tells you nothing.

Two commands make large files comfortable:

```bash
npm run import -- /Volumes/SSD/day-1 --link   # symlink the folder in — copies 0 bytes
npm run proxy                                 # 540p stand-ins for smooth scrubbing
```

A linked 88 MB 4K clip costs the repo 29 bytes. Its proxy is 441 KB and builds in three
seconds — the studio previews that and badges it, while **every render reads the original
file**. Full guide, including Git LFS and sharing footage across machines:
[docs/media.md](docs/media.md).

---

## How the preview stays honest

Most editors preview with one renderer and export with another, so the export is always a
slight surprise. Here both ends run the same code:

```
             projects/x.json
                    │
        src/core/layout.js  ← line breaking, from shared font metrics
        src/core/svg.js     ← one SVG generator
                    │
        ┌───────────┴───────────┐
   browser                   resvg → PNG
   (same .ttf via @font-face)      (same .ttf via fontFiles)
        │                           │
   <video> + SVG overlay      FFmpeg overlay filter
```

- Line breaks are computed from advance-width tables in `assets/fonts/metrics/metrics.json`,
  which both the browser and Node read — so text wraps identically in both.
- The browser loads the exact `.ttf` files that resvg rasterises with.
- Opacity ramps are linear on both sides, because FFmpeg's `fade` filter is linear.
- Movement uses eased curves defined once in `src/core/easing.js`, as JavaScript **and** as
  an FFmpeg expression string.

The one documented exception is the `pop` animation (scale), which previews but falls back
to a fade on export — it's labelled "preview only" in the UI.

Positions are stored as fractions of the frame (`x: 0.5`, `fontSize: 0.06` = 6% of frame
height), so the same design drops onto a 1080×1920 reel or a 4K landscape cut and still sits
in the right place.

---

## Canva import

In Canva: **Share ▸ Download ▸ PDF Standard**, save it into `imports/`, then:

```bash
npm run canva:import -- --file imports/my-design.pdf
```

You get, per text block: the real font name, point size, x/y position and fill colour —
mapped onto a font in `assets/fonts`, a role, and a normalised position:

```
  Fonts
    Anton-Regular            → Anton              400  exact        hook
    PlayfairDisplay-Italic   → Playfair Display   400  exact        quote
    CanvaSans-Bold           → Poppins            700  substitute   handle, cta

  Text blocks (role · position · size)
    hook      x0.5 y0.27 5.0%h   "YOU ARE NOT BEHIND"
    quote     x0.5 y0.50 2.7%h   "What stands in the way becomes the way."
    handle    x0.5 y0.09 1.1%h   "@YOURHANDLE"
```

The result is saved to `presets/canva/<id>.json`; hit **Apply layers** in the studio's Canva
tab to drop the whole stack into the current project.

Canva's own fonts (Canva Sans and friends) aren't redistributable, so they're substituted
with the closest free equivalent and flagged. To use the real thing, drop the `.ttf` into
`assets/fonts/` (or the studio's font uploader) and run `npm run fonts`.

SVG, saved HTML and a plain share URL also work — see [docs/canva.md](docs/canva.md) for what
each route can and can't recover.

---

## Series in one pass

```bash
npm run batch -- --template sample-reel \
                 --clips "media/source/b-roll-*.mp4" \
                 --quotes stoic \
                 --trim 12 --render
```

Clones the design onto every matching clip, rotates a different quote into each, caps them
all to 12 seconds and renders the lot.

---

## Docs

- [docs/media.md](docs/media.md) — big files: linking, proxies, LFS, sharing
- [docs/project-format.md](docs/project-format.md) — every field in a project file
- [docs/canva.md](docs/canva.md) — the import routes in detail
- [docs/architecture.md](docs/architecture.md) — how a render is actually built

## Requirements

Node 20+. That's it — FFmpeg (`@ffmpeg-installer`), the SVG rasteriser (`@resvg/resvg-js`)
and the fonts all install from npm. `npm run doctor` verifies the lot.
