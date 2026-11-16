# YouTube Videos — AI Video, Poster & Ebook Studio

Cloud-ready production studio built for **GitHub Codespaces**, combining **Remotion 4**, **Tailwind CSS v4**, **FFmpeg**, **Git LFS**, and pre-configured **AI Agent Skills** for Claude Code, GitHub Copilot, Cursor, and Codex. It produces **videos**, **posters/graphics**, and **PDF ebooks**.

## What's Included

- **`.devcontainer/devcontainer.json`** — Launches a 4-core / 8 GB Debian 13 (`trixie`) + Node.js 22 container with Git LFS, forwarded port `3000` for Remotion Studio, and GitHub Copilot + Claude Code extensions.
- **`requirements.txt`** — Python runtime for the code-drawn film engines (`skia-python`, `numpy`, `pillow`, `scipy`, `faster-whisper`), installed into `.venv/` by the setup script.
- **`setup-video-studio.sh`** — One-click idempotent setup script (`postCreateCommand`) that installs FFmpeg 7+, Python 3, Remotion's headless Chromium dependencies, npm packages, all 6 AI Agent Skills, and the 6 cloned tool repositories:
  - [`remotion-dev/skills`](https://github.com/remotion-dev/skills) — Official Remotion best practices, captions, markup, rendering, and Studio interactivity skills
  - [`Remocn/remocn`](https://github.com/Remocn/remocn) — Production-ready Remotion animations, transitions, backgrounds, and storyboard workflows
  - [`kajisho5/ffmpeg-skill`](https://github.com/kajisho5/ffmpeg-skill) — 42 local FFmpeg editing, silence-trimming, captioning, loudness, and platform compliance tools
  - [`kajisho5/remotion-ffmpeg-skill`](https://github.com/kajisho5/remotion-ffmpeg-skill) — Measured Remotion motion graphics overlaid onto real camera/screen recordings
  - [`jiemianduan/poster-style-transfer`](https://github.com/jiemianduan/poster-style-transfer) — Transfer a reference poster's visual style onto new content
  - [`Chenruishuo/posterly`](https://github.com/Chenruishuo/posterly) — Poster layout and composition generation
- **Cloned tool repositories (`tools/`, gitignored)** — provisioned by the setup script:
  - **Video**
    - [`cinematic-skill`](https://github.com/Moh4696/cinematic-skill) — `cinematic-film`: long-form narrated documentary / Vox-style explainers, one continuous camera over a code-drawn world
    - [`animate`](https://github.com/cth9191/animate) — short-form procedural animation in 7 built-in styles (cut paper, riso, crosshatch, pixel, isometric, math, sketchbook)
    - [`3dviz-pro-max`](https://github.com/viettranx/3dviz-pro-max) — Three.js 3D scenes, product and scientific visualisation
    - [`claude-make-an-anime`](https://github.com/makevoid/claude-make-an-anime) — narrative anime: character sheets, shots, voices, score
    - [`claude-remotion-skill`](https://github.com/haidrrrry/claude-remotion-skill) & [`herk-edit-kit`](https://github.com/nateherkai/herk-edit-kit) — Remotion motion-graphics and transcript-driven editing workflows
  - **Posters** — [`poster-maker`](https://github.com/dabodamjan/poster-maker) & [`duduhaibao`](https://github.com/Shine8592/duduhaibao) (HTML/CSS flyers, print-grade Typst)
  - **Ebooks** — [`ebook-generator`](https://github.com/RyanFitzgerald/ebook-generator) & [`markdown-to-pdf-book-converter`](https://github.com/romankurnovskii/markdown-to-pdf-book-converter) (Markdown → styled PDF)
  - All ten are MIT-licensed.
- **`content/drafts/_template/`** — copy per project: `brief.md` (incl. engine choice), `script.md`, `beats.md`, `credits.md`, `delivery.md`
- **Starter Remotion Compositions (`src/`)**:
  - `YouTubeVideo` (`1920×1080`, 16:9, 30 fps) — Title card, Ken Burns media backdrop, lower third, and animated word-highlight captions
  - `VerticalReel` (`1080×1920`, 9:16, 30 fps) — Reels / Shorts / TikTok vertical template with hook badge, animated captions, and CTA
- **Studio Folder Layout & Git LFS (`.gitattributes`)**:
  - `public/raw-footage/` — Drop raw `.mp4`, `.mov`, `.mkv`, or `.webm` clips here
  - `public/pics/` — Drop `.png`, `.jpg`, `.jpeg`, or `.webp` photos here
  - `public/music/` — Drop `.mp3`, `.wav`, or `.m4a` background tracks/voiceovers here
  - `public/fonts/` — Custom brand fonts
  - `templates/posters/` — Uploaded poster reference templates to match
  - `templates/ebooks/` — Uploaded ebook style templates to match
  - `content/drafts/` — Raw text drafts for ebooks and scripts
  - `out/videos/` — Final video exports (`.mp4`)
  - `out/graphics/` — Final poster & graphic exports (`.png` / `.pdf`)
  - `out/ebooks/` — Final PDF/ebook exports
  - `tools/` — Cloned third-party tool repositories (gitignored)
  - Git LFS tracks `*.mp4 *.mov *.mkv *.webm *.png *.jpg *.jpeg *.webp *.pdf *.wav *.mp3 *.m4a *.aac`

## Verified Working Pipelines

All three were run end to end in this repo and produced real output.

| Pipeline | Command | Output |
| --- | --- | --- |
| Long-form film (Skia) | `npm run film:check` then `render.py --project ... --out out/videos/x.mp4` | H.264 1080p MP4 |
| Poster (Typst) | `npm run poster -- --title "..." --out out/graphics/x --format story` | PNG @216ppi + PDF |
| Ebook (pandoc → Typst) | `npm run ebook -- --src content/drafts/book --out out/ebooks/x.pdf --title "..."` | multi-page PDF |

Start with `source scripts/activate-studio.sh` (or `npm run env`). It puts the bundled
`ffmpeg`/`ffprobe`, the venv, and the software-GL shims on the right paths.

Two environment problems are solved in-repo:
- **ffmpeg**: the `@ffmpeg-installer` build is from 2018 and breaks `loudnorm,aresample`; the studio
  uses the modern static ffmpeg from `imageio-ffmpeg` (9.x) at `tools/bin/ffmpeg`.
- **skia-python**: needs `libEGL`/`libGL` merely to import. `scripts/build-gl-shims.sh` builds stub
  libraries that report "no GL context" so Skia falls back to CPU raster — identical output, no GPU.

## Choosing a Video Engine

| You want | Use |
| --- | --- |
| Branded motion graphics, lower thirds, kinetic captions over your own footage | **Remotion** (`src/`) |
| A long-form narrated documentary or Vox-style explainer | **`cinematic-film`** (`tools/cinematic-skill`) |
| A short illustrated explainer/story in a distinctive style | **`animate`** (`tools/animate`) |
| A 3D scene, product or scientific visualisation | **`3dviz-pro-max`** (`tools/3dviz-pro-max`) |
| A narrative anime | **`make-an-anime`** (`tools/claude-make-an-anime`) |
| Cutting, reframing, loudness, captions on existing footage | **FFmpeg** (`ffmpeg-skill`) |

Render each engine's segment to `out/videos/`, then conform and join with FFmpeg. Full routing rules
live in `AGENTS.md`.

### Media toolchain on PATH

The Python and Node skills call `ffmpeg`/`ffprobe` by name. The bundled binaries are symlinked into
`tools/bin/` by the setup script:

```bash
export PATH="$PWD/tools/bin:$PATH"
```

## How to Launch in GitHub Codespaces

1. On your GitHub repository page, click the green **`<> Code`** button, switch to the **Codespaces** tab, and click **Create codespace on main**.
2. Wait ~2 minutes while Codespaces builds the container and runs `setup-video-studio.sh` automatically.
3. **Upload your media**: Drag and drop photos into `public/pics/` and raw video clips into `public/raw-footage/` in the Codespaces file explorer.
4. **Prompt your AI agent** (Claude Code or GitHub Copilot Chat):
   - *"Check `public/pics/` and build a 45-second 1080p YouTube slideshow with smooth transitions, Ken Burns zoom, and lower-third captions, then render to `out/intro.mp4`."*
   - *"Trim the silences from `public/raw-footage/talk.mp4`, reframe it to a 9:16 Reel with animated captions, normalize audio to -14 LUFS, and export to `out/reel.mp4`."*

## Useful Commands

```bash
# Open interactive Remotion Studio on port 3000
npm run dev

# Render a preview frame to out/videos/preview.png
npm run render:preview

# Export 16:9 YouTube video (1920x1080 H.264) -> out/videos/
npm run render:youtube

# Export 9:16 Vertical Reel / Short (1080x1920 H.264) -> out/videos/
npm run render:reel

# Print the resolved ffmpeg binary path
npm run ffmpeg

# Type-check & lint compositions
npm run lint
```
