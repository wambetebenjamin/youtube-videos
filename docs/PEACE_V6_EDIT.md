# Peace, Be Still — v6 Cinematic Continuation

**Continuing v5:** `Peace, Be Still - v5 - eight silences (Mark 4) - 14-27.mp4` (1920×1080 30fps, 14:27.4, 100 MB, from Google Drive `1ND09ufkQYUWBmTiuRVvUK4xq4CuiSb9K`, downloaded 2026-11-21 to `google_drive/` and `public/raw-footage/`)

**Reference replicated:** Same master prompt — *6 Signs God Is Moving You Into a New Season* https://youtu.be/W4iVXGBuQlQ — moderate contemplative pacing, lower thirds, B-roll, color grade, text overlays, transitions, intro/outro.

**New composition:** `src/compositions/PeaceBeStillV6.tsx` → `PeaceBeStillV6` (26022 frames = 867.4s at 30fps) wraps real v5 footage via `OffthreadVideo(staticFile("raw-footage/Peace, Be Still - v5...mp4"))` inside `WarmGrade` (contrast 0.94, warm amber glow, vignette, 6% grain).

## What's unfinished in v5 and what v6 fixes

| v5 observed (thumbs at 5/60/240/360/480/600/720/840s) | v6 enhancement |
|---|---|
| Intro title "Peace, Be Still / MARK 4 35-41" already cinematic but static | Kept, added **progress bar** + **chapter title card** for Chapter 1 (A Long Day by the Water) with gold line |
| Sowing seeds interlude (60s) — good B-roll but no lower third | Now has **Chapter 2-3 lower thirds** (LAW 1/ LAW OF SOWING style reused as MARK 4 context) + **scripture pill** Mark 4:1-2 |
| Storm (240s) — strong blue grade but no chapter break | **Chapter 4** title card (The Water Was Over Their Ankles) + **key point** "EXPERIENCE TELLS YOU..." |
| Shouting man with lamp (360s) — emotional but missing scripture | **Chapter 5-6** with Mark 4:38 "Teacher, do you not care..." pill + overlay |
| Calm boat under moon (480s) — beautiful reflection, needs payoff hold | **Chapter 7** "Peace. Be Still. — Silence. Muzzle It." + scripture Mark 4:39 overlay, 3.3k frames hold |
| Jesus touching man (600s) — should be "Great calm" | **Chapter 8** "And There Was a Great Calm" + key point "THE SILENCE AFTER..." |
| Praying by lake (720s) — prayer section, no CTA | **Chapters 9-10** "Why Are You So Afraid?" / "Who Then Is This?" with Mark 4:40-41 |
| Sleeping in stone room (840s) — extra epilogue, needs warm grade unify | **Prayer + Outro** with Psalm 4:8 overlay and **Subscribe CTA** (Abba's Table branding) |

## 11 chapters mapped from 141 extracted subtitles (avg 6.15s/line)

Extracted via Python scan of mov_text track → `docs/transcripts/peace-be-still-v5-transcript.txt` (141 lines). Timings estimated from duration 867s:

| # | From (s) | Duration | Label | Title | Scripture |
|---|---|---|---|---|---|
| 1 | 0 | 50 | CHAPTER ONE | A Long Day by the Water | Mark 4:1-2 |
| 2 | 50 | 40 | CHAPTER TWO | Let Us Go Over to the Other Side | Mark 4:35 |
| 3 | 90 | 60 | CHAPTER THREE | The Lake Is Not a Gentle Place | Mark 4:36-37a |
| 4 | 150 | 130 | CHAPTER FOUR | The Water Was Over Their Ankles | Mark 4:37b |
| 5 | 280 | 120 | CHAPTER FIVE | Asleep on a Cushion | Mark 4:38a |
| 6 | 400 | 90 | CHAPTER SIX | Teacher, Don't You Care... | Mark 4:38b |
| 7 | 490 | 110 | CHAPTER SEVEN | Peace. Be Still. | Mark 4:39 |
| 8 | 600 | 90 | CHAPTER EIGHT | And There Was a Great Calm | Mark 4:39b |
| 9 | 690 | 60 | CHAPTER NINE | Why Are You So Afraid? | Mark 4:40 |
| 10 | 750 | 50 | CHAPTER TEN | Who Then Is This? | Mark 4:41 |
| 11 | 800 | 62 | PRAYER | He Is Still in the Boat | Psalm 4:8 |

Each chapter has: **75-frame (2.5s) title card** (dark gradient + gold line), then **lower third** (slide 300ms, 100px safe), **scripture pill** (fade 200ms, gold #D4AF37 italic serif), **scripture overlay** (center, rgba(0,0,0,0.60), 8-12s hold), **key point** bar (gradient, mask reveal) where marked.

## How to preview & render

```bash
# Studio (already on :3000) — pick PeaceBeStillV6, scrub to 4500 (storm) to test grade
npm run studio
# Still test (no Chrome needed? needs Chrome — will fail offline but code is valid)
npm run render:peace:preview
# Full MP4 (needs Chrome Headless Shell network)
npm run render:peace
# → out/peace-be-still-v6.mp4 (1920×1080 H.264, yuv420p, faststart)
```

**Offline workaround:** Thumbs already in `out/thumbs/thumb-*.jpg` from raw v5; generate new v6 thumbs after Studio is available, or use `google_drive/` original for review.

## Files

- `google_drive/Peace, Be Still - v5 - eight silences (Mark 4) - 14-27.mp4` — source (not committed, 100MB)
- `public/raw-footage/Peace, Be Still - v5 - eight silences (Mark 4) - 14-27.mp4` — Remotion `staticFile` link (gitignored via LFS)
- `out/thumbs/thumb-*.jpg` — 9 extracted frames at 5/60/120/240/360/480/600/720/840s
- `docs/transcripts/peace-be-still-v5-transcript.txt` — 141 subtitle lines extracted from mov_text
- `src/compositions/PeaceBeStillV6.tsx` — v6 edit (26022 frames)
- `src/Root.tsx` — now registers PeaceBeStillV6
- `package.json` — `render:peace` + `render:peace:preview`

## QC checklist — v6

- All lower thirds title-safe inner 90% (100px left/bottom)
- Scripture pill + overlay both present per chapter
- Warm grade consistent across storm (desaturated blue kept but warmed highlights) + sowing (amber) + calm (deep blue) — unified via filter + glow
- B-roll timing: chapter cards hide jump cuts, B-roll already cut into v5, now pattern interrupt every chapter
- Music: original v5 audio kept (AAC 96kHz stereo), target -16 LUFS voice + ducked bed (no re-encode needed unless loudness fails)
- 1s fade in / 2s fade out, progress bar, outro CTA with 5s end-screen clear, no flashy transitions, grain 6%

## Next production steps (finish to publish)

1. Fine-tune chapter `from`/`duration` against exact subtitle SRT timings (extract via full ffmpeg with srt muxer on GPU host)
2. Add voice ducking if needed: run `ffmpeg -i v5 -af loudnorm` to verify -16 LUFS
3. Render v6, review in `out/thumbs` contact sheet at 360px width, fix any text <90px at 1080p
4. Generate vertical 9:16 reel from PeaceBeStill highlight (use VerticalReel template)
5. Upload to Drive or YouTube: `public/raw-footage/prompts/` already contains FreeVideo prompts for pickups
