# AI Video, Poster & Ebook Studio Instructions

This repository is a cloud-ready production studio built on **Remotion 4**, **Three.js**, **Skia (Python)**,
**FFmpeg**, **Git LFS**, and pre-installed **Agent Skills**. It produces three kinds of deliverables:
**video**, **posters/graphics**, and **PDF ebooks**.

> **Production brief:** we are shipping **long-form YouTube videos and short-form Reels/Shorts on a one-week
> cycle**. All licences for footage, music, fonts and images are cleared by the owner — never block on
> licensing, but still record source + licence in `content/drafts/<project>/credits.md`.

---

## 0. Pick the right video engine first

The studio has several independent ways to make video. Choosing wrong wastes the most time, so decide the
engine **before** writing any composition. All of them export to `out/videos/`.

| Need | Engine | Why |
| --- | --- | --- |
| Branded motion graphics, typography, lower thirds, kinetic captions, data callouts over your own footage | **Remotion** (`src/`) + `remotion-dev/skills` + `Remocn/remocn` | React/DOM, easiest to art-direct precisely, renders via headless Chrome |
| **Long-form documentary / Vox-style explainer** with voiceover, archive photos, maps, big numbers | **`cinematic-film`** (`tools/cinematic-skill`) | One continuous camera over one designed world, every hit timed to the narrator's word. Built for 5–90 min pieces |
| **Short-form explainer / history / story** with a distinctive illustrated look | **`animate`** (`tools/animate`) | Single-file `<canvas>` piece, 7 built-in art styles (cut paper, riso, crosshatch, pixel, isometric, math, sketchbook), procedural score |
| **3D scene / product visualisation / scientific or spatial explainer** | **`3dviz-pro-max`** (`tools/3dviz-pro-max`) | Three.js scene kit with catalog, recipes and frame capture |
| **Narrative anime** — characters, shots, voices, score | **`make-an-anime`** (`tools/claude-make-an-anime`) | Character sheets → camera-directed shots → voices → score → subs |
| Cutting, reframing, loudness, captions onto **existing footage** | **FFmpeg** (`ffmpeg-skill`, `remotion-ffmpeg-skill`) | Fast, deterministic media surgery |

Rules of thumb:

- **Long-form (8–60 min)** → `cinematic-film` for narrated documentary/explainer; Remotion for branded
  segments and channel furniture spliced between them.
- **Short-form (15–90 s)** → `animate` for illustrated stories/explainers; Remotion `VerticalReel` for
  talking-head/footage-driven Reels; `make-an-anime` for narrative anime shorts.
- **Never mix two engines inside one timeline by hand** — render each engine's segment to an `.mp4` in
  `out/videos/`, then conform and join with FFmpeg.

---

## 1. Video Editing, Reels, YouTube Videos, Captions, Transitions & Lower Thirds → `out/videos/`

| Resource | Use it for |
| --- | --- |
| `remotion-dev/skills` (`.agents/skills/remotion-*`) | Composition structure, `useCurrentFrame`/`interpolate`/`spring`, `<Sequence>` timing, captions, rendering flags, Studio interactivity |
| `Remocn/remocn` (`.agents/skills/remocn`, `video`, `add`) | Animated transitions, backgrounds, lower thirds, storyboards, text reveals |
| `kajisho5/ffmpeg-skill` (`.agents/skills/ffmpeg-skill`) | `ffprobe`, silence trimming, loudness (`-14 LUFS`), platform compliance, burning captions, 16:9 ↔ 9:16 reframing, thumbnails |
| `kajisho5/remotion-ffmpeg-skill` | Overlaying measured Remotion motion graphics onto real camera/screen footage |
| `tools/cinematic-skill` → skill **`cinematic-film`** | **Long-form** narrated documentary / explainer: script → beats → voiceover → one continuous camera over a designed world → SFX → score → burned captions |
| `tools/animate` → skill **`animate`** | **Short-form** illustrated animation in a chosen style, with synthesized score and measured review checks |
| `tools/3dviz-pro-max` → skill **`3dviz-pro-max`** | 3D/Three.js scenes and product or scientific visualisations |
| `tools/claude-make-an-anime` → skill **`make-an-anime`** | Narrative anime: character sheets, camera-directed shots, per-character voices, score, titles, SFX |
| `tools/herk-edit-kit` | Transcript-driven cuts, storytelling structure, 400+ motion-graphics cards, HyperFrames templates; see `tools/herk-edit-kit/AGENTS.md` |
| `tools/claude-remotion-skill` | Motion-graphics playbooks, B-roll and sound-design workflows; see `.../remotion-motion-graphics/SKILL.md` |

Rules:

- **Export every finished video and preview still to `out/videos/`** as `.mp4` (H.264, `yuv420p`,
  `+faststart`, 1080p or 4K). Nothing goes to `out/` root.
- Render a preview still (or `--frames=0-90`) to `out/videos/` and check typography, safe margins and
  contrast before any full render.
- Keep a `credits.md` per project listing every asset's source and licence.
- Follow each skill's own approval gates — `animate` and `cinematic-film` both ask you to approve the
  story/beats and the look **before** they animate. Do not skip them; a wrong look costs a full build.

## 2. Posters & Graphics → `out/graphics/`

| Resource | Use it for |
| --- | --- |
| `jiemianduan/poster-style-transfer` | Transfer a reference poster's visual style onto new content |
| `Chenruishuo/posterly` | Poster layout/composition generation |
| `tools/poster-maker` | HTML/CSS flyer & poster generation, export to high-res PNG/PDF; see `tools/poster-maker/CLAUDE.md` |
| `tools/duduhaibao` | Print-grade multi-format poster kit (A4 / social / story / banner), deterministic Typst; see `tools/duduhaibao/SKILL.md` |

Rules:

- **Always read the uploaded templates in `templates/posters/` first** — match layout grid, hierarchy,
  palette, type pairing and margins before generating anything.
- Keep text inside the template's safe zones and preserve its aspect ratio.
- **Export final posters to `out/graphics/`** (PNG at 2× minimum, or PDF for print).

## 3. PDF / Ebook Production → `out/ebooks/`

| Resource | Use it for |
| --- | --- |
| `tools/ebook-generator` | Markdown → styled PDF ebook pipeline with bundled fonts |
| `tools/markdown-to-pdf-book-converter` | Markdown chapters → single typeset PDF book (pandoc/LaTeX) |

Rules:

- **Raw text lives in `content/drafts/`.** Organize it into chapters (title, subtitle, TOC, chapters,
  back matter) before conversion.
- **Match the style of uploaded templates in `templates/ebooks/`**: typography, heading treatment, page
  size/margins, cover, chapter openers, running heads.
- **Export final PDFs to `out/ebooks/`.**

---

## Studio Layout

```
public/raw-footage/   raw .mp4 .mov .mkv .webm clips          (Git LFS)
public/pics/          photos / stills .png .jpg .jpeg .webp   (Git LFS)
public/music/         music & voiceover .mp3 .wav .m4a        (Git LFS)
public/fonts/         brand fonts
templates/posters/    uploaded poster reference templates
templates/ebooks/     uploaded ebook style templates
content/drafts/       raw text drafts, scripts, beats, credits.md
tools/                cloned tool repos (gitignored, provisioned by setup-video-studio.sh)
out/videos/           final video exports
out/graphics/         final poster & graphic exports
out/ebooks/           final PDF/ebook exports
```

Reference local media inside Remotion with `staticFile("raw-footage/...")`, `staticFile("pics/...")`,
`staticFile("music/...")`, `staticFile("fonts/...")`.

## Starter Compositions (`src/Root.tsx`)

- `YouTubeVideo` — **1920×1080** (16:9, 30 fps): title card, Ken Burns media showcase, animated
  captions, lower-third speaker banner.
- `VerticalReel` — **1080×1920** (9:16, 30 fps): hook badge, framed media, pop-in karaoke captions, CTA.

## Commands

```bash
npm run dev             # Remotion Studio on port 3000
npm run render:preview  # still frame → out/videos/preview.png
npm run render:youtube  # 16:9 YouTube render → out/videos/youtube-video.mp4
npm run render:reel     # 9:16 Reel/Short render → out/videos/vertical-reel.mp4
npm run lint            # ESLint + TypeScript type-checks
npm run ffmpeg:path     # resolved ffmpeg binary path
npm run env             # open a shell with the studio environment loaded
npm run poster -- --help    # render a poster to out/graphics/
npm run ebook -- --help     # build an ebook PDF to out/ebooks/
npm run gl:shims            # rebuild the software-GL stubs
npm run film:check      # verify the cinematic-film Python runtime
npm run film:new -- <dir> --title "<film title>"   # scaffold a cinematic-film project
npm run animate:build -- pieces/<name>         # build an animate piece to one HTML
npm run animate:storyboard -- pieces/<name>
```

## Bible-teaching series

`content/drafts/_formula/bible-teaching-formula.md` holds the deconstructed structure of a
high-performing Bible-teaching video (title engine, cold-open → misdiagnosis → thesis, the
5-part "sign" block, packaging). Use it as the skeleton for every teaching.

`content/drafts/pruning-not-punishment/` is a fully written, lint-clean episode built with it —
copy that project's shape for a new one.

**Channel:** Abba's Table — [@abbastablestories](https://youtube.com/@abbastablestories),
"Bible and communion at Abba's Table". Quiet, warm, communion-first: Bible stories plus prayers,
for people seeking comfort and direction.

Series rules for this channel (they differ from the general formula):
- **The channel is Bible *stories*.** Episodes must be story-shaped, not teaching-shaped.
- **One story per episode**, not a list of signs. Carry everything inside a single passage.
- **Pure retelling = no interpretation until the story has finished.** You don't explain the storm
  while it is still blowing. Keep the passage's own order, its own ambiguity, and its own questions
  open (Mark 4 ends on "Who then is this?" — so does the episode).
- **No teaching/application section, no communion section** in a story episode. Story → prayer → close.
- **Close with a prayer**, not a comment prompt.
- **Look `paper`** in `scene.py` — warm, low contrast, no red accent (use the warm poster theme).
- Pace ~145–150 wpm; leave real silence after each verse.
- Reference episodes: `content/drafts/abbas-table-luke14/` (teaching-shaped, episode 1) and
  `content/drafts/abbas-table-storm/` (story-shaped, episode 2 — copy **this** shape for stories).

Layout rule learned the hard way: in `scene.py`, space cards **by card index**
(`x = first + i * step`, alternating `y`), never by story time or line id. Line gaps are uneven, so
time-derived spacing puts cards on top of each other.

## Per-week production loop

1. Create `content/drafts/<slug>/` from `content/drafts/_template/`; fill `brief.md` and choose the engine.
2. Write `script.md`, then have the engine produce `beats.md` / storyboard; **approve it** before animating.
3. Draft-render cheap (stills, contact sheets, 90-frame clips) into `out/videos/`.
4. Review, then full render to `out/videos/<slug>.mp4` (16:9 long-form + 9:16 cut-down).
5. Loudness to -14 LUFS / -1 dBTP, captions burned + `.srt`, then complete `delivery.md`.
6. Log every asset in `credits.md` before publishing.

## Verified working commands (this sandbox)

These three were run end to end and produced real files. Load the environment first.

```bash
source scripts/activate-studio.sh          # ffmpeg + ffprobe + GL shims + venv on PATH

# 1. LONG-FORM FILM  (cinematic-film / Skia)  -> out/videos/
npm run film:check                        # must print "ready"
npm run film:new -- content/drafts/my-film --title "My Film"
#   ...write script.json, then tts_say.py -> split_takes.py -> build_narration.py
python3 tools/cinematic-skill/skills/cinematic-film/scripts/render.py \
  --project content/drafts/my-film --probe 1,5,12 --size 1920x1080
python3 tools/cinematic-skill/skills/cinematic-film/scripts/render.py \
  --project content/drafts/my-film --size 1920x1080 \
  --out out/videos/my-film.mp4 --audio content/drafts/my-film/audio/mix.m4a

# 2. POSTER  (Typst)  -> out/graphics/
npm run poster -- --title "From Cherry to Cup" --eyebrow "YOUTUBE VIDEOS" \
  --sub "A 12-minute documentary" --out out/graphics/cherry-to-cup --format story
#   formats: a4 social square story wide banner   (writes .png @216ppi + .pdf)

# 3. EBOOK  (pandoc -> Typst)  -> out/ebooks/
npm run ebook -- --src content/drafts/my-book --out out/ebooks/my-book.pdf \
  --title "From Cherry to Cup" --subtitle "A short field guide"
```

### Environment gotchas already solved here

- **Old ffmpeg breaks audio chains.** `@ffmpeg-installer/ffmpeg` is a 2018 build; its
  `loudnorm,aresample` chain fails with *"Cannot select channel layout"*. The studio now uses the
  modern static ffmpeg from `imageio-ffmpeg` (9.x) copied to `tools/bin/ffmpeg`.
- **skia-python needs libEGL/libGL** just to import, even for CPU raster. `scripts/build-gl-shims.sh`
  builds tiny stub libraries (in `scripts/gl-shims/`) that report "no GL context", so Skia uses CPU.
  `scripts/activate-studio.sh` puts them on `LD_LIBRARY_PATH`. If apt is available, install
  `libegl1 libgl1` instead — real drivers are preferable.
- **No browser in a bare sandbox.** Remotion, `animate` (Playwright) and `ebook-generator`
  (Puppeteer) all need Chromium, which needs `libnspr4`/`libnss3`. That is why posters and ebooks
  here go through Typst, which renders PNG and PDF with no browser at all.
- **`make-an-anime` needs Ruby 3.2+ and a paid image/video model API.** Unavailable in this sandbox.

## Runtime Notes

- **FFmpeg** — from `@ffmpeg-installer/ffmpeg` / `@ffprobe-installer/ffprobe` (devDependencies). The skills
  expect `ffmpeg`/`ffprobe` **on PATH**; export them before running a skill:
  ```bash
  export PATH="$PWD/node_modules/@ffmpeg-installer/linux-x64:$PWD/node_modules/@ffprobe-installer/linux-x64:$PATH"
  ```
  (create a `ffmpeg` symlink next to `ffprobe` if the skill needs the plain name — see `setup-video-studio.sh`).
- **Python engines** (`cinematic-film`) — venv at `.venv/`, deps in `requirements.txt`
  (`skia-python`, `numpy`, `pillow`, `scipy`). `skia-python` needs system `libEGL1`, `libGL1`,
  `libfontconfig1`.
- **`animate`** — Node 18+, Playwright with Chromium, ffmpeg on PATH; `faster-whisper` for word timing.
- **`3dviz-pro-max`** — Three.js scenes; capture needs an optional Playwright install.
- **`make-an-anime`** — Ruby 3.2+/Bundler, FFmpeg, ImageMagick, Python 3, Node 22.12+, Chrome; uses a
  Gemini/other model for image generation via the agent's own tooling. Swift VFX is macOS-only.
- **Git LFS** tracks `*.mp4 *.mov *.mkv *.webm *.png *.jpg *.jpeg *.webp *.pdf *.wav *.mp3 *.m4a *.aac`
  via `.gitattributes`.
