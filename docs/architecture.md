# How a render is built

```
projects/x.json
      │
      ├─ ffprobe the clip                    duration, dimensions, rotation, audio?
      ├─ resolve duration                    (trim.end − trim.start) ÷ speed
      │
      ├─ layers → PNG                        src/core/svg.js → resvg
      │     static full-length layers are flattened into ONE png
      │     animated layers get one each
      │
      ├─ build the filtergraph               src/server/render/filtergraph.js
      │     scale/crop · colour · overlay×N · audio mix
      │
      └─ FFmpeg                              progress parsed from `-progress pipe:1`
            └─ media/exports/<name>.mp4 + .jpg poster + .json sidecar
```

## Shared core

`src/core/` is plain ESM with no Node built-ins, imported by the server, the CLI **and** the
browser:

| Module | Responsibility |
|---|---|
| `formats.js` | Canvas sizes and platform safe areas |
| `layout.js` | Text measurement, wrapping, anchoring, baselines |
| `svg.js` | Layer → SVG. The single source of truth for appearance |
| `timeline.js` | Visibility, opacity and motion at time *t* |
| `easing.js` | Curves, as JS **and** as FFmpeg expression strings |
| `project.js` | Schema, defaults, normalisation, style presets |

## Text, twice, identically

Line breaking needs font metrics. Rather than measure in the browser (Canvas2D) and again in
Node (fontkit) and hope they agree, `npm run fonts` precomputes an advance-width table per
face into `assets/fonts/metrics/metrics.json` (~96 KB, Latin-1 + Latin Extended-A +
typographic punctuation). Both sides read that one file through `layout.js`, so a line
breaks in the same place in the preview and in the export.

The browser then loads the same `.ttf` via `@font-face` that resvg loads via `fontFiles`.

## Overlay compositing

Each rasterised layer becomes a looped PNG input:

```
[3:v]format=rgba,fade=t=in:st=2:d=0.5:alpha=1,fade=t=out:st=7.6:d=0.4:alpha=1[ov0]
[base][ov0]overlay=x=0:y='67.2*(1-(1-pow(1-min(1,max(0,(t-2)/0.5)),3)))'
            :enable='between(t,2,8)'[v0]
```

- **Opacity** → the `fade` filter, which is linear; the preview is linear too.
- **Movement** → an `overlay` x/y expression generated from the same easing table the
  browser uses.
- **Position** is already baked into the PNG by the SVG generator, so FFmpeg only ever
  handles time and offset.

Layers that are visible for the whole video with no animation are flattened into a single
PNG first — a ten-layer design usually collapses to two or three overlay passes.

The progress bar is a uniform bar slid in from off-canvas left: the visible portion grows
from nothing to full width, which reads as a bar filling up without needing a per-frame
redraw.

## Fitting the clip

Crop offsets are computed as integers from the ffprobe dimensions rather than left as
FFmpeg expressions:

- **cover** → `scale` up to cover, then `crop` to the canvas with a pan offset
- **contain + blur** → `split`, one branch covered and `gblur`'d as a backdrop, the other
  scaled to fit and overlaid centred
- **contain + colour** → `scale` then `pad`

## Audio

Every branch is normalised to `fltp / 48 kHz / stereo` first, which keeps `adelay` and
`amix` predictable:

```
clip audio   → atempo (if speed ≠ 1) → volume → atrim
music track  → atrim(offset) → volume → afade in/out → adelay(start)
ducking      → [music][clip]sidechaincompress
mix          → amix → volume×N → alimiter
```

The gain compensation is deliberate: this FFmpeg build predates `amix`'s `normalize`
option, so `amix` always divides by the input count and the gain has to be put back.

## Preview fidelity: the exceptions

Everything matches except:

1. **`pop`** (scale) previews but exports as a fade — animating an overlay's scale per frame
   is expensive in FFmpeg. It's labelled "preview only" in the UI.
2. **Glyph shaping.** The browser and resvg both shape each line internally; kerning may
   differ by a fraction of a pixel. Line breaks and block positions, which are what you'd
   actually notice, come from the shared layout code and are identical.
3. **Video filters** (`brightness`/`contrast`/`saturation`) are CSS filters in the preview
   and `eq` in the export. Very close, not bit-identical.

## Jobs and progress

`POST /api/render` returns a job id immediately; `GET /api/render/:id/stream` is an SSE feed
of progress events parsed out of FFmpeg's `-progress pipe:1`. The CLI calls the same engine
function directly with an `onProgress` callback — no server involved.
