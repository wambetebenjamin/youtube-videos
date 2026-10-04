# The project file

One JSON file per video in `projects/`. Plain text, diffable, reviewable in a pull request.
The studio reads and writes these; so does `npm run render`.

Anything you leave out gets a sensible default (see `src/core/project.js`), so a minimal
project is perfectly valid:

```json
{
  "name": "Monday quote",
  "format": "reel",
  "source": { "clip": "media/source/beach.mp4" },
  "layers": [
    { "type": "text", "text": "Keep going", "style": { "fontSize": 0.07 } }
  ]
}
```

---

## Units

Two rules cover almost everything:

- **Positions and sizes are fractions of the frame.** `x: 0.5` is the horizontal centre.
  `fontSize: 0.06` is 6% of the frame *height*. This is what lets one design work on a
  1080×1920 reel and a 1920×1080 YouTube cut.
- **Times are seconds** on the output timeline (after trimming), not on the source clip.

---

## Top level

| Field | Type | Notes |
|---|---|---|
| `id` | string | Matches the filename. |
| `name` | string | Shown in the studio; used for the export filename. |
| `format` | string | `reel` · `reel-hd` · `youtube` · `youtube-4k` · `square` · `portrait45` |
| `canvas` | object | `{width, height, fps, background}` — overrides the format. |
| `source` | object | The clip. See below. |
| `audio.music` | array | Music tracks. See below. |
| `layers` | array | Drawn in order; last one is on top. |
| `export` | object | `{preset, suffix}` — preset ids come from `presets/export.json`. |

## `source`

| Field | Default | Notes |
|---|---|---|
| `clip` | `null` | Repo-relative path. `null` renders onto `canvas.background`. |
| `trim` | `{start: 0, end: null}` | Seconds into the clip. `end: null` = to the end. |
| `fit` | `"cover"` | `cover` crops to fill, `contain` letterboxes. |
| `backdrop` | `"blur"` | For `contain`: `blur` or `color`. |
| `zoom` | `1` | 1.2 = punch in 20%. |
| `offsetX` / `offsetY` | `0` | Pan, as a fraction of the frame. |
| `speed` | `1` | 0.5 = half speed. Audio is pitch-corrected with `atempo`. |
| `volume` | `1` | The clip's own audio. `0` mutes it. |
| `adjust` | | `{brightness, contrast, saturation, vignette, sharpen}` |

## `audio.music[]`

| Field | Default | Notes |
|---|---|---|
| `src` | — | Repo-relative path into `media/music/`. |
| `volume` | `0.35` | |
| `start` | `0` | When it comes in, on the output timeline. |
| `offset` | `0` | Where to start *inside* the music file. |
| `fadeIn` / `fadeOut` | `1` / `2` | Seconds. |
| `loop` | `true` | Repeats to fill the video. |
| `duck` | `false` | Sidechain-compress the music under the clip's own audio. |

Multiple tracks are mixed, gain-compensated and passed through a limiter.

## `layers[]`

Shared by every layer type:

| Field | Default | Notes |
|---|---|---|
| `id` | auto | |
| `type` | `"text"` | `text` · `quote` · `image` · `shape` · `progress` |
| `name` | `""` | Label in the timeline. |
| `enabled` | `true` | |
| `start` | `0` | Seconds. |
| `end` | `0` | `0` means "until the end". |
| `animIn` / `animOut` | fade | `{type, duration, easing, distance}` |
| `box` | | `{x, y, width, height, align, anchor}` |

**Animation types** — `none`, `fade`, `fade-up`, `fade-down`, `slide-left`, `slide-right`,
`rise`, `pop`. **Easings** — `linear`, `easeOut`, `easeOutSoft`, `easeOutSnap`, `easeInOut`.

> `pop` scales, which FFmpeg can't do cheaply on an overlay, so it exports as a plain fade.
> Everything else matches the preview exactly.

**Anchor** is which part of the text box sits at `(x, y)`: `top-left`, `top-center`,
`top-right`, `middle-left`, `center`, `middle-right`, `bottom-left`, `bottom-center`,
`bottom-right`. **Align** is how lines sit inside the box: `left`, `center`, `right`.

### `text` and `quote`

```json
{
  "type": "quote",
  "text": "What stands in the way becomes the way.",
  "attribution": "Marcus Aurelius",
  "start": 2, "end": 8,
  "animIn":  { "type": "fade-up", "duration": 0.5, "easing": "easeOut", "distance": 0.035 },
  "animOut": { "type": "fade", "duration": 0.4 },
  "box": { "x": 0.5, "y": 0.45, "width": 0.82, "align": "center", "anchor": "center" },
  "style": {
    "fontFamily": "playfair-display",
    "fontWeight": 400,
    "italic": true,
    "fontSize": 0.05,
    "color": "#ffffff",
    "lineHeight": 1.32,
    "letterSpacing": 0,
    "textTransform": "none",
    "maxLines": 0,
    "opacity": 1,
    "stroke":  { "color": "#000000", "width": 0.03, "opacity": 1 },
    "shadow":  { "color": "#000000", "blur": 0.2, "dx": 0, "dy": 0.02, "opacity": 0.55 },
    "background": { "mode": "lines", "color": "#f5e663", "opacity": 1,
                    "paddingX": 0.3, "paddingY": 0.18, "radius": 0.1 },
    "attribution": { "fontFamily": "montserrat", "fontWeight": 600, "fontSize": 0.021,
                     "letterSpacing": 0.16, "textTransform": "uppercase", "gap": 0.9 }
  }
}
```

- `fontFamily` is the **id** from `assets/fonts/fonts.json` (`montserrat`, `bebas-neue`,
  `playfair-display`…), not the display name.
- `stroke.width`, `shadow.blur`, `letterSpacing` and the `background` paddings are in **em**
  (multiples of the font size), so they scale with the text.
- `background.mode`: `content` hugs the text block, `lines` draws a plate behind each line
  (the Canva highlight look), `frame` fills the whole text box.
- `attribution` only applies to `quote` layers.

### `image`

```json
{ "type": "image", "src": "media/images/logo.png", "fit": "contain", "radius": 0.1,
  "box": { "x": 0.5, "y": 0.1, "width": 0.3, "height": 0.1, "anchor": "top-center" } }
```

### `shape`

```json
{ "type": "shape",
  "shape": { "kind": "scrim-bottom", "color": "#000000", "opacity": 0.72, "size": 0.42 } }
```

`kind`: `scrim-bottom`, `scrim-top` (gradient fades for readability), `wash` (full-frame
tint), `rect`, `ellipse`.

### `progress`

```json
{ "type": "progress",
  "progress": { "color": "#ffffff", "thickness": 0.0045, "y": 0.988,
                "trackColor": "#ffffff", "trackOpacity": 0.22 } }
```

Fills left to right across the video. Use a solid colour — the renderer animates it by
sliding the bar, which only looks right if it's uniform.

---

## Style presets

`src/core/project.js` exports `STYLE_PRESETS`, used by the studio's **Add** tab and by the
Canva importer: `hook`, `caption`, `highlight`, `quote`, `quote-card`, `lower-third`,
`handle`. Applying one replaces `style` and the box geometry, keeping the layer's position.
