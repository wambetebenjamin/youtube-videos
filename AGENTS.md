# AI Video Studio Instructions

## Core Workflow Rules
- Always check `public/raw-footage/` and `public/pics/` (plus `public/music/` and `public/fonts/`) first for user-uploaded media before building or editing a composition.
- Reference local assets inside Remotion using `staticFile("pics/...")`, `staticFile("raw-footage/...")`, `staticFile("music/...")`, and `staticFile("fonts/...")`.
- Use **Remotion** (`src/`) for motion graphics, title cards, animated captions, lower thirds, Ken Burns photo slideshows, and scene transitions.
- Use **FFmpeg** (and the installed `ffmpeg-skill` / `remotion-ffmpeg-skill` tools) for probing source media (`ffprobe`), trimming silence, reframing 16:9 YouTube videos into 9:16 Reels/Shorts, converting VFR/HDR clips to CFR/SDR (`bt709`), and loudness normalization (`-14 LUFS`, `-1 dBTP`).
- Export all finished videos and preview stills to the `out/` folder as `.mp4` (H.264, `yuv420p`, `+faststart`, 1080p or 4K).
- Always render a preview frame (`npx remotion still <CompId> out/preview.png --frame=45`) or a short test clip (`--frames=0-90`) to verify typography, safe margins, contrast, and layout before running a full final render.

## Available Starter Compositions (`src/Root.tsx`)
- `YouTubeVideo` — **1920×1080** (16:9 landscape, 30 fps) with title card, Ken Burns media showcase, animated captions, and lower-third speaker banner.
- `VerticalReel` — **1080×1920** (9:16 vertical Reels / Shorts / TikTok, 30 fps) with top hook badge, framed media showcase, pop-in karaoke captions, and call-to-action pill.

## Helpful Commands
- `npm run dev` — Launch Remotion Studio for interactive timeline preview.
- `npm run render:preview` — Render a single still frame to `out/preview.png` for quick layout inspection.
- `npm run render:youtube` — Render `YouTubeVideo` to `out/youtube-video.mp4`.
- `npm run render:reel` — Render `VerticalReel` to `out/vertical-reel.mp4`.
- `npm run lint` — Run ESLint and TypeScript type-checking across `src/`.
- `npx ffmpeg-skill doctor` — Verify local FFmpeg and Python capabilities.
