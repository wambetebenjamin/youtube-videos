# Peace, Be Still — Abba's Table, episode 2

Second episode for the channel [@abbastablestories](https://youtube.com/@abbastablestories) —
and the **first one shaped as a story rather than a teaching**.

**Text:** Mark 4:35–41 (parallel: Matthew 8:23–27)
**Shape:** pure retelling — no teaching section, no communion, ending in prayer
**Runtime:** 7:20 at ~155 wpm (real narration: 440.2 s)

## The rule that shapes this episode

Episode 1 argued. This one only tells. The line written into `script.md` and obeyed line by line:

> **Nothing is interpreted until the story has finished.**
> You don't explain the storm while it is still blowing.

Practically, that means three things Mark does that the script refuses to tidy up:

1. **The accusation stays an accusation.** *"Teacher, don't you care that we are dying?"* is not
   softened into a polite request. The next line says plainly: fear left alone becomes accusation.
   Then: *"They went to Him angry. Still they went to Him."*
2. **He asks "why are you afraid?" *after* the calm.** Not during the panic. Mark puts the question
   on flat water, and the script keeps it there.
3. **The episode ends inside Mark's own question.** *"Who then is this?"* is asked and left open —
   no answer is supplied. The prayer is where the listener answers it, if they answer it at all.

| File | What it is |
| --- | --- |
| `script.md` | The readable episode — 6 story sections, prayer, blessing |
| `script.json` | Engine narration: **104 lines, 8 takes** (1153 words) |
| `beats.md` | Beat table from `make_beats.py` — **104 beats, 6:39.4 est., 0 warnings** |
| `scene.py` | The crossing: 8 verse cards laid out left→right, one camera travelling the journey |
| `verses.md` | **10 passages verified against WEB** (public domain), with wording notes |
| `packaging.md` | Title, description, chapters, companion Short, publish checklist |

## The scene

The world is a **crossing**, not a desk. `NEAR_SHORE_X` (−9000) → `DEEP_WATER_X` (0) →
`FAR_SHORE_X` (+9000), one `Route` drawn across the water, and the camera makes the trip once.

Verse cards are **spaced by index, not by story time**: `x = -3.5 * STEP + i * STEP` with
`STEP = 2400` and cards alternating `y = ∓3400`. This matters — the first version derived `x` from
the line id, and because the gaps between scripture lines are uneven the cards piled on top of each
other (MARK 4:38 / 4:39, then MARK 4:37 / DO YOU NOT CARE). Index spacing is the only version that
cannot overlap: two cards in the same row are always `2 × STEP` apart.

Starting at `-3.5 * STEP` makes the eight cards run **−8400 … 8400**, symmetric around the deep
water, which is what lets the closing shot frame every verse of the story at once.

Each card is keyed to the **line that actually speaks it**, not to the nearest line id — an earlier
pass had MARK 4:41 appearing during the prayer and MARK 4:37 during the crossing, so verify the
mapping against `script.json` whenever the script is re-cut.

`PEACE.  BE STILL.` sits alone as BigText at `DEEP_WATER_X, 1550`, clear of the route line at y≈1500.

Colour: `ACCENT` terracotta `(176,116,74)`, `INK (58,50,44)`, `SOFT (128,116,104)`, and `COLD
(96,104,116)` used **only** on the storm cards, so the storm looks colder than the room it interrupts.

## Status

- ✅ Script written, all scripture checked verse by verse against WEB
- ✅ `make_beats.py` → **0 warnings**
- ✅ `scene.py` builds; **12 probe stills verified** at 1080p across the whole timeline
  (t=1.5, 31, 62, 152, 222, 232, 308, 376, 410, 440, 505, 533, 546, 553)
- ✅ 24 s draft rendered: `out/videos/abbas-table-storm-draft24s.mp4` (H.264 1080p30 + AAC, 98 MB)
- ✅ Thumbnail: `out/graphics/abbas-table-storm-thumb.png` + `.pdf` (warm theme, `--format wide`)
- ⚠️ **Audio is a placeholder** — synthesized tone at scripted line lengths, used only to exercise
  the render chain. **Not committed.** Record a real read before the final render.

## Render

```bash
source scripts/activate-studio.sh

# probe stills first — always
.venv/bin/python tools/cinematic-skill/skills/cinematic-film/scripts/render.py \
  --project content/drafts/abbas-table-storm --probe 120,215,300,470 --size 1920x1080

# short draft (--audio MUST be an absolute path; render.py resolves it against the project dir)
.venv/bin/python tools/cinematic-skill/skills/cinematic-film/scripts/render.py \
  --project content/drafts/abbas-table-storm --t0 0 --t1 24 --size 1920x1080 --workers 2 \
  --out "$PWD/out/videos/abbas-table-storm-draft24s.mp4" \
  --audio "$PWD/content/drafts/abbas-table-storm/audio/narration.m4a"
```

Measured: the full 7:20 at 1080p30 / crf 18 with `--workers 2` took **2950 s (~49 min), 2.2 fps
per worker**, producing a 1.25 GB master. A crf 16 render is ~3 MB/s and would land near 2 GB.

**Delivery encoding.** The crf 18 master is archival only — it is far over Drive's 100 MB upload
cap. The deliverable is a second encode of that master: `libx264 -b:v 1500k -maxrate 1800k`,
96 kbps mono AAC, `movflags +faststart`, plus the `.srt` muxed in as a `mov_text` subtitle track
and audio conformed to −14 LUFS. That is **64 MB for 7:20** with the type still crisp:

```bash
ffmpeg -i <master>.mp4 -i abbas-table-storm.srt \
  -c:v libx264 -preset slow -b:v 1500k -maxrate 1800k -bufsize 3200k -pix_fmt yuv420p \
  -c:a aac -b:a 128k -ac 1 -af "loudnorm=I=-14:TP=-1.5:LRA=11" \
  -c:s mov_text -movflags +faststart abbas-table-storm-final.mp4
```

## Next steps

Published. The film was delivered to Drive at
`https://drive.google.com/file/d/1Qnwy6NvwjVwAn_NoG6crhMligoII-cbM/view`.
If the read is ever re-recorded: re-run `build_narration.py`, regenerate the chapters from
`audio/timing.json`, and check that nothing in the edit has moved interpretation before the
prayer at 05:40.
