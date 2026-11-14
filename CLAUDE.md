# AI Video, Poster & Ebook Studio Instructions

This repository is a cloud-ready production studio built on **Remotion 4**, **Tailwind CSS v4**,
**FFmpeg**, **Git LFS**, and pre-installed **Agent Skills**. It produces three kinds of deliverables:
**video**, **posters/graphics**, and **PDF ebooks**.

---

## 1. Video Editing, Reels, YouTube Videos, Captions, Transitions & Lower Thirds → `out/videos/`

Use the following skills and tools for **all** video work:

| Resource | What to use it for |
| --- | --- |
| `remotion-dev/skills` (installed in `.agents/skills/`: `remotion-best-practices`, `remotion-create`, `remotion-captions`, `remotion-markup`, `remotion-render`, `remotion-studio`, `remotion-multimedia`, `remotion-interactivity`, `remotion-maps`, `remotion-saas`, `remotion-upgrade`, `remotion-license`, `remotion-docs`, `changelog`) | Official Remotion patterns: composition structure, `useCurrentFrame`/`interpolate`/`spring` animation, `<Sequence>` timing, captions/subtitles, rendering flags, Studio interactivity |
| `Remocn/remocn` (`.agents/skills/remocn`, `video`, `add`) | Production-ready animated components: transitions, backgrounds, lower thirds, storyboards, text reveals |
| `kajisho5/ffmpeg-skill` (`.agents/skills/ffmpeg-skill`) | Probing (`ffprobe`), silence trimming, loudness normalization (`-14 LUFS`), platform compliance, caption burning, reframing 16:9 → 9:16, thumbnail extraction |
| `kajisho5/remotion-ffmpeg-skill` (`.agents/skills/remotion-ffmpeg-skill`) | Overlaying measured Remotion motion graphics onto real camera/screen footage |
| `tools/claude-remotion-skill` (cloned) | Motion-graphics playbooks, B-roll, captions and sound-design agent workflows; see `tools/claude-remotion-skill/remotion-motion-graphics/SKILL.md` |
| `tools/herk-edit-kit` (cloned) | Transcript-driven cuts, storytelling structure, 400+ motion-graphics cards, HyperFrames templates for long-form and Shorts; see `tools/herk-edit-kit/AGENTS.md` and `MOTION_PHILOSOPHY.md` |

Rules:

- Use **Remotion** (`src/`) for anything that must be pixel-perfect or animated: title cards, animated
  word-highlight captions, lower thirds, transitions, Ken Burns slideshows.
- Use **FFmpeg** for media surgery: trimming silence, reframing, loudness normalization, format/CFR/SDR
  conversion, burning captions, extracting thumbnails.
- **Export every finished video and preview still to `out/videos/`** as `.mp4`
  (H.264, `yuv420p`, `+faststart`, 1080p or 4K). Do not export to `out/` root or anywhere else.
- Always render a preview still (or a short `--frames=0-90` clip) to `out/videos/` first and check
  typography, safe margins, and contrast before the full render.

## 2. Posters & Graphics → `out/graphics/`

Use the following skills and tools for **all** poster/graphic work:

| Resource | What to use it for |
| --- | --- |
| `jiemianduan/poster-style-transfer` (`.agents/skills/poster-style-transfer`) | Transfer the visual style of an uploaded reference poster onto new content |
| `Chenruishuo/posterly` (`.agents/skills/posterly`) | Poster layout/composition generation from structured content |
| `tools/poster-maker` (cloned) | HTML/CSS-based AI flyer & poster generation, export to high-res PNG or PDF; see `tools/poster-maker/CLAUDE.md` |
| `tools/duduhaibao` (cloned) | Print-grade multi-format poster kit (A4, social, story, banner) with deterministic Typst rendering; see `tools/duduhaibao/SKILL.md` |

Rules:

- **Always read the user's uploaded poster templates in `templates/posters/` first.** Match their
  layout grid, hierarchy, palette, typography pairing, and margins before generating anything.
- Treat a template as the source of truth for dimensions and safe zones; keep text inside the
  template's text areas and preserve its aspect ratio.
- **Export final posters and graphics to `out/graphics/`** (PNG at 2× minimum, or PDF for print).
  Keep working/intermediate files out of `out/graphics/`.

## 3. PDF / Ebook Production → `out/ebooks/`

Use the following tools for **all** ebook work:

| Resource | What to use it for |
| --- | --- |
| `tools/ebook-generator` (cloned) | Markdown → styled PDF ebook pipeline with bundled fonts and content/output folders; see `tools/ebook-generator/README.md` |
| `tools/markdown-to-pdf-book-converter` (cloned) | Markdown chapter files → single typeset PDF book (LaTeX/pandoc); see `tools/markdown-to-pdf-book-converter/README.md` |

Rules:

- **Raw text lives in `content/drafts/`.** Read everything relevant there, then organize it into clean
  chapter/section structure (title, subtitle, TOC, chapters, back matter) before conversion.
- **Match the style of the uploaded ebook templates in `templates/ebooks/`**: typography, heading
  treatment, page size/margins, cover layout, chapter openers, header/footer conventions.
- **Export final PDFs to `out/ebooks/`.** Keep intermediate Markdown/LaTeX/HTML build files beside the
  source draft in `content/drafts/` or the tool's own workspace, never in `out/ebooks/`.

---

## Studio Layout

```
public/raw-footage/   raw .mp4 .mov .mkv .webm clips          (Git LFS)
public/pics/          photos / stills .png .jpg .jpeg .webp   (Git LFS)
public/music/         music & voiceover .mp3 .wav .m4a        (Git LFS)
public/fonts/         brand fonts
templates/posters/    uploaded poster reference templates
templates/ebooks/     uploaded ebook style templates
content/drafts/       raw text drafts for ebooks and scripts
tools/                cloned third-party tool repos (gitignored)
out/videos/           final video exports
out/graphics/         final poster & graphic exports
out/ebooks/           final PDF/ebook exports
```

Reference local media inside Remotion with `staticFile("raw-footage/...")`, `staticFile("pics/...")`,
`staticFile("music/...")`, and `staticFile("fonts/...")`.

## Starter Compositions (`src/Root.tsx`)

- `YouTubeVideo` — **1920×1080** (16:9, 30 fps): title card, Ken Burns media showcase, animated
  captions, lower-third speaker banner.
- `VerticalReel` — **1080×1920** (9:16, 30 fps): top hook badge, framed media showcase, pop-in karaoke
  captions, call-to-action pill.

## Commands

```bash
npm run dev             # Remotion Studio on port 3000
npm run render:preview  # still frame → out/videos/preview.png
npm run render:youtube  # 16:9 YouTube render → out/videos/youtube-video.mp4
npm run render:reel     # 9:16 Reel/Short render → out/videos/vertical-reel.mp4
npm run lint            # ESLint + TypeScript type-checks
npm run ffmpeg          # ffmpeg version (binary bundled via npm)
```

## Media Tooling Notes

- **Git LFS** tracks `*.mp4 *.mov *.mkv *.webm *.png *.jpg *.jpeg *.webp *.pdf *.wav *.mp3 *.m4a *.aac`
  via `.gitattributes`. In Codespaces / the devcontainer, `git-lfs` is provided by the
  `devcontainers/features/git-lfs` feature.
- If `ffmpeg` is not on `PATH` (e.g. restricted sandbox without apt access), use the npm-bundled
  binaries: `node_modules/@ffmpeg-installer/linux-x64/ffmpeg` and
  `node_modules/@ffprobe-installer/linux-x64/ffprobe`.
