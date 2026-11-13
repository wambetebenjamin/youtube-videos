# AI Video Studio Instructions

- Always check `public/raw-footage/` and `public/pics/` (plus `public/music/` and `public/fonts/`) first for user-uploaded media.
- Reference local media in Remotion via `staticFile("pics/...")`, `staticFile("raw-footage/...")`, `staticFile("music/...")`, and `staticFile("fonts/...")`.
- Use Remotion (`src/`) for motion graphics, animated captions, lower thirds, photo slideshows, and transitions.
- Use FFmpeg (and installed `ffmpeg-skill` / `remotion-ffmpeg-skill` tools) for probing source footage, trimming silence, reframing 16:9 YouTube videos into 9:16 Reels/Shorts, and audio normalization (`-14 LUFS`).
- Export all finished videos to the `out/` folder as `.mp4` (H.264, `yuv420p`, `+faststart`, 1080p or 4K).
- Always render a preview frame (`npx remotion still <CompId> out/preview.png --frame=45`) or short test clip before running a full render.
