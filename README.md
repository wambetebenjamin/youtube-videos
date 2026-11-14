# YouTube Videos — AI Video, Poster & Ebook Studio

Cloud-ready production studio built for **GitHub Codespaces**, combining **Remotion 4**, **Tailwind CSS v4**, **FFmpeg**, **Git LFS**, and pre-configured **AI Agent Skills** for Claude Code, GitHub Copilot, Cursor, and Codex. It produces **videos**, **posters/graphics**, and **PDF ebooks**.

## What's Included

- **`.devcontainer/devcontainer.json`** — Launches a 4-core / 8 GB Debian 13 (`trixie`) + Node.js 22 container with Git LFS, forwarded port `3000` for Remotion Studio, and GitHub Copilot + Claude Code extensions.
- **`setup-video-studio.sh`** — One-click idempotent setup script (`postCreateCommand`) that installs FFmpeg 7+, Python 3, Remotion's headless Chromium dependencies, npm packages, all 6 AI Agent Skills, and the 6 cloned tool repositories:
  - [`remotion-dev/skills`](https://github.com/remotion-dev/skills) — Official Remotion best practices, captions, markup, rendering, and Studio interactivity skills
  - [`Remocn/remocn`](https://github.com/Remocn/remocn) — Production-ready Remotion animations, transitions, backgrounds, and storyboard workflows
  - [`kajisho5/ffmpeg-skill`](https://github.com/kajisho5/ffmpeg-skill) — 42 local FFmpeg editing, silence-trimming, captioning, loudness, and platform compliance tools
  - [`kajisho5/remotion-ffmpeg-skill`](https://github.com/kajisho5/remotion-ffmpeg-skill) — Measured Remotion motion graphics overlaid onto real camera/screen recordings
  - [`jiemianduan/poster-style-transfer`](https://github.com/jiemianduan/poster-style-transfer) — Transfer a reference poster's visual style onto new content
  - [`Chenruishuo/posterly`](https://github.com/Chenruishuo/posterly) — Poster layout and composition generation
- **Cloned tool repositories (`tools/`, gitignored)** — provisioned by the setup script:
  - [`poster-maker`](https://github.com/dabodamjan/poster-maker) & [`duduhaibao`](https://github.com/Shine8592/duduhaibao) — poster/flyer generation (HTML/CSS and print-grade Typst)
  - [`ebook-generator`](https://github.com/RyanFitzgerald/ebook-generator) & [`markdown-to-pdf-book-converter`](https://github.com/romankurnovskii/markdown-to-pdf-book-converter) — Markdown → styled PDF ebooks
  - [`claude-remotion-skill`](https://github.com/haidrrrry/claude-remotion-skill) & [`herk-edit-kit`](https://github.com/nateherkai/herk-edit-kit) — Remotion motion-graphics and transcript-driven editing workflows
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
