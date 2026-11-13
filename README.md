# YouTube Videos — AI Video Studio

Cloud-ready AI Video Studio built for **GitHub Codespaces**, combining **Remotion 4**, **Tailwind CSS v4**, **FFmpeg**, **Git LFS**, and pre-configured **AI Agent Skills** for Claude Code, GitHub Copilot, Cursor, and Codex.

## What's Included

- **`.devcontainer/devcontainer.json`** — Launches a 4-core / 8 GB Debian 13 (`trixie`) + Node.js 22 container with Git LFS, forwarded port `3000` for Remotion Studio, and GitHub Copilot + Claude Code extensions.
- **`setup-video-studio.sh`** — One-click idempotent setup script (`postCreateCommand`) that installs FFmpeg 7+, Python 3, Remotion's headless Chromium dependencies, npm packages, and all 4 AI video skill packs:
  - [`remotion-dev/skills`](https://github.com/remotion-dev/skills) — Official Remotion best practices, captions, markup, rendering, and Studio interactivity skills
  - [`Remocn/remocn`](https://github.com/Remocn/remocn) — Production-ready Remotion animations, transitions, backgrounds, and storyboard workflows
  - [`kajisho5/ffmpeg-skill`](https://github.com/kajisho5/ffmpeg-skill) — 42 local FFmpeg editing, silence-trimming, captioning, loudness, and platform compliance tools
  - [`kajisho5/remotion-ffmpeg-skill`](https://github.com/kajisho5/remotion-ffmpeg-skill) — Measured Remotion motion graphics overlaid onto real camera/screen recordings
- **Starter Remotion Compositions (`src/`)**:
  - `YouTubeVideo` (`1920×1080`, 16:9, 30 fps) — Title card, Ken Burns media backdrop, lower third, and animated word-highlight captions
  - `VerticalReel` (`1080×1920`, 9:16, 30 fps) — Reels / Shorts / TikTok vertical template with hook badge, animated captions, and CTA
- **Asset Folders & Git LFS (`.gitattributes`)**:
  - `public/raw-footage/` — Drop raw `.mp4`, `.mov`, `.mkv`, or `.webm` clips here
  - `public/pics/` — Drop `.png`, `.jpg`, `.jpeg`, or `.webp` photos here
  - `public/music/` — Drop `.mp3`, `.wav`, or `.m4a` background tracks/voiceovers here
  - `public/fonts/` — Custom brand fonts
  - `out/` — Exported `.mp4` renders and preview stills (gitignored)

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

# Render a preview frame to verify layout & typography
npm run render:preview

# Export 16:9 YouTube video (1920x1080 H.264)
npm run render:youtube

# Export 9:16 Vertical Reel / Short (1080x1920 H.264)
npm run render:reel

# Type-check & lint compositions
npm run lint
```
