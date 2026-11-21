# Peace, Be Still — the reference re-edit

A second cut of the Mark 4 film, built to the editing and finishing style of the reference video the
channel is modelling itself on, using the pictures and the narration that already exist. Nothing in
the script was rewritten: the six "signs" of the reference become the six **movements** the
narration already divides into, and the reframe line under each one is drawn from the script.

## The reference

**Reference:** [6 Signs God Is Moving You Into a New Season (Even If Nothing Has Changed Yet)](https://youtu.be/W4iVXGBuQlQ)
— BibleCue, 18:53.

Credit and thanks: the pacing, the chapter-break structure, the two-tier lower thirds, the gold
scripture references and the continuous ducked music bed in this cut are a direct study of that
video. The story, the words and the pictures here are the channel's own.

The citation belongs in the video description and the pinned comment — see **Packaging** below.

## What is different from v5

| | v5 | this cut |
| --- | --- | --- |
| Structure | continuous retelling, eight silences | six numbered **movements**, each opening on a chapter card |
| Chapter breaks | none | card, then a dip through near-black into the next movement |
| Lower thirds | none | two-tier chapter bars, gold-keyed scripture references |
| Scripture | read aloud only | 9 full-screen verse overlays in serif italic, fading in 0.4 s |
| Stills | full-bleed, no movement | full-bleed with a slow push, 1.000 → 1.008 over each shot |
| Music | score, plus a rebuilt bed | a bed that rises in every gap in the narration |
| Grade | warm, dark | warm amber highlights, desaturated blue shadows, grain |

The narration, the words and the 24 plates are unchanged. The voice is the same recorded read.

## Chapters

| Time | Movement |
| --- | --- |
| 0:00 | The long day |
| 1:27 | **1.** The holy dissatisfaction |
| 3:06 | **2.** The water coming in |
| 5:21 | **3.** The question underneath |
| 6:09 | **4.** The four words |
| 8:07 | **5.** The question after the calm |
| 9:57 | **6.** Who then is this |
| 11:56 | The turn — let us pray |
| 13:50 | Sit, listen, and rest |

Times are generated from `audio/timing.json`, never hand-edited.

## How it is built

| File | What it does |
| --- | --- |
| `recover_timing.py` | aligns the delivered SRT to the 109 script lines by word budget; writes `audio/timing.json` and a narration-only `audio/voice.wav` |
| `content_map.py` | the six movements, the nine verses, the plate plan, the B-roll cutaways, the chapter cards — with a `check()` that proves line coverage |
| `graphics.py` | palette, text fitting, chapter bars, chapter cards, verse overlays, the reframe card, the end card, the grade |
| `scene.py` | builds the film: plates, pushes, cutaways, cards, verses, grade |
| `bed.py` | the soundtrack: weather shaped to *this* cut's timeline, score, and the ducking that keeps both under the voice |
| `qc.py` | checks the finished file against the brief and writes `QC.md` |

```bash
python3 recover_timing.py --project . --srt /tmp/subs.srt --audio /tmp/narr.wav
python3 bed.py --project .
python3 ../../../tools/cinematic-skill/skills/cinematic-film/scripts/render.py \
    --project . --size 1920x1080 --out out/videos/final.mp4 --audio audio/mix.wav
python3 qc.py --project . --video out/videos/final.mp4
```

## Packaging

`packaging.md` in this folder has the description, tags and the pinned comment for this cut,
including the reference citation.
