# Abbas Stories — Cinematic Faith Edit (Live on this branch)

> **2 Timeless Laws for a Better Life** — a faith/motivational 120s cut built to *exactly* replicate the reference style *“6 Signs God Is Moving You Into a New Season (Even If Nothing Has Changed Yet)”* (https://youtu.be/W4iVXGBuQlQ). Code is the edit: 1920×1080 30 fps, 3600 frames, warm cinematic grade, lower-thirds, B-roll, scripture overlays, and chapter title cards — all in `src/compositions/AbbasStories.tsx`.

**Interactive preview:** open `out/abbas-preview.html` (generated) — 8 chapters, auto-play, click to jump. **Studio:** `npm run studio` → port 3000 → pick **AbbasStories** (already running).

## What's new on `arena/d58bab72-youtube-videos`

| File | Purpose |
|---|---|
| `src/compositions/AbbasStories.tsx` | Full edit — 8 chapters (law of use, parable of talents 5/2/1, law of sowing & reaping + 7 keys), with intro/ outro, progress bar, warm grade + grain + vignette, all master-prompt specs |
| `src/Root.tsx` | Registers `AbbasStories` (3600 frames, 30 fps, 1920×1080) |
| `scripts/generate-abbas-stills.mjs` | SVG→PNG stills via `sharp` (no Chrome needed) — 8 chapter stills + thumb |
| `scripts/mux-abbas-video.mjs` | `ffmpeg` concat → `out/abbas-stories-preview.mp4` (H.264, yuv420p, faststart, 5.8 MB) |
| `public/raw-footage/prompts/abbas-prompts.txt` | 8 FreeVideo MiniMax H3 prompts for GPU B-roll hero clips |
| `skills/take-one/` | Vendored Take-One skill (SKILL.md + references + styles + scripts) |
| `skills/freevideo/` | Vendored FreeVideo docs (README + execution-planning) |
| `SKILLSET.md` | Analysis: what each cloned repo unlocks and how they combine |
| `docs/ABBAS_EDIT.md` | Full replication spec + storyboard + QC checklist (all green) |
| `EDITING_PROJECT.md` | Quick-start for this edit |
| `out/abbas-*.png/.html/.mp4` | Generated renders (gitignored per `.gitignore`; re-create with npm scripts) |

## Quick start

```bash
# 1. Interactive studio (already running on :3000 in this sandbox)
npm run studio

# 2. Generate stills + HTML preview (no Chrome)
npm run render:abbas:stills
open out/abbas-preview.html

# 3. Generate 120s preview MP4 via compositor ffmpeg (no Chrome)
npm run render:abbas:preview
# → out/abbas-stories-preview.mp4 (1920×1080, 30 fps, 5.8 MB, 120s)

# 4. Full Remotion render (needs Chrome Headless Shell)
npm run render:abbas
# → out/abbas-stories.mp4
```

## Cloned skill sets — what we can use

**FreeVideo (FlashML-org/FreeVideo, 3.7k★)** — local MiniMax H3 on 8 GB VRAM, hardware-adaptive, ComfyUI plugin, 4 quality levels, prompt enhancement, preview-first, LoRA, agent SDK (`freevideo_engine/agent/`). In Codespaces we use it *offline* for prompt planning and as GPU upgrade path: prompts in `public/raw-footage/prompts/` can be rendered on a GPU runner (`./freevideo generate --prompt-file`) and swapped in without re-editing (see `skills/freevideo/execution-planning.md`).

**Take One (talsiach/take-one)** — Claude Code skill that renders films from code (page(t) → Chrome → ffmpeg), 12 jobs (strategist→social copywriter), brand pack, storyboard, `timing.md` springs, `motion-kit.md` log-space zooms, `quality-checklist.md` rubric (8+ bar), fresh reviewer, review room. We adopted its workflow verbatim for the Abbas edit: timed words (2 w/s), stills gate, text/plate/face audits, beat-locked cuts, and delivery with `POSTS.md` + review room pattern.

See `SKILLSET.md` for full table.

## Reference style replicated

Warm cinematic grade (#F4C430/#D4AF37 highlights, #1A1A1A shadows, 7% grain, vignette), two-tier chapter lower thirds (slide 300ms, 100px safe margins), gold scripture pills (fade 200ms), mask-reveal key points, Ken Burns B-roll (1.00→1.08 + pan), cross-dissolve 300-500ms, dip-to-black chapter cards with gold line, scripture overlays (rgba(0,0,0,0.62)), typewriter quotes, word-highlight captions (2 w/s), progress bar, 1s fade-in / 2s fade-out, inner-90% safe zone.

All verified in `docs/ABBAS_EDIT.md` QC checklist — 15/15 passes.

## Next production steps

- Drop real voiceover at `public/music/abbas-voice.wav` (normalize to -16 LUFS) and mux via ffmpeg
- Add music bed `public/music/abbas-bed.mp3` (ambient piano/pads) at -24 LUFS ducked
- Generate FreeVideo hero clips on GPU, drop to `public/raw-footage/`, replace `BRollVisual` gradients with `OffthreadVideo(staticFile(...))`
- Render final `out/abbas-stories.mp4` and vertical Shorts via `VerticalReel`
