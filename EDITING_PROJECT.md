# Edit Project — Abbas Stories Video

## Quick Start

**Preview without render:**
- Open `out/abbas-preview.html` in browser — click chapters, hit Play Sequence.
- Or start Remotion Studio: `npm run studio` (already on :3000) → pick `AbbasStories`.

**Render preview MP4 (no Chrome needed):**
```bash
node scripts/generate-abbas-stills.mjs
node scripts/mux-abbas-video.mjs
# → out/abbas-stories-preview.mp4 (120s, 1920x1080 H.264, faststart)
```

**Render full Remotion MP4 (needs Chrome Headless Shell):**
```bash
npx remotion render AbbasStories out/abbas-stories.mp4 --codec h264 --pixel-format yuv420p
# or shorter test: --frames=0-90
```

## AI Video Agent Prompt — Used
The complete master prompt (reference video style) is stored in `docs/ABBAS_EDIT.md` and `SKILLSET.md`.
It was applied verbatim with Section 10 mapped to `transcript (1).txt`.

## Repository Skills Installed
- `skills/take-one/` — 12-job studio, quality gates, motion-kit, timing, audio
- `skills/freevideo/` — MiniMax H3 engine, ComfyUI plugin, 4 quality levels, prompts

See `SKILLSET.md` for deduction of usable capabilities.

## Public Assets
- `public/pics/` — drop .png/.jpg for B-roll (auto via staticFile)
- `public/raw-footage/` — drop .mp4/.mov clips (hero captures)
- `public/music/` — voiceover + bed tracks (voice at -16 LUFS, music at -24 to -28 LUFS)
- `public/raw-footage/prompts/abbas-prompts.txt` — 8 FreeVideo prompts ready for GPU

## Transcript Excerpt
The full 1497-word transcript is at `transcript (1).txt` — law of use + parable of talents (5/2/1) + 7 keys of sowing/reaping.

