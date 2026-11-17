# Abba's Table — Episode 2: "Peace, Be Still" (Mark 4:35–41), long illustrated edition

**10:32 · 1920×1080 · 30 fps · WEB scripture · narrated · 24 illustrations**

This file is the resume point. If a new session starts and the workspace looks empty,
read this first: it says what is committed (safe), what is regenerable, and how.

---

## If you are picking this up cold

The repo is the source of truth. Everything needed to rebuild the film is committed on
branch `arena/32b07b63-youtube-videos`:

```
content/drafts/abbas-table-storm/
  script2.py         the whole script: 8 takes, 109 lines, each with its picture key
  make_script.py     script2.py -> script.json (gaps/pacing for the narration build)
  art2.py            Photo, Scripture, Chapter, TitleCart + prepare_photos()
  scene.py           build_film(): the gallery, the camera, the typesetting
  art2/*.jpg         the 24 plates (committed, ~5 MB)
  packaging.md       title, description, chapters, pinned comment
```

**Not committed, on purpose** (build artifacts; large):
`audio/`, `assets/`, `out/`. All of them can be rebuilt from the committed sources.

### Rebuild from nothing

```bash
bash setup-video-studio.sh                       # ~200 s: installs tools/ffmpeg + .venv
source scripts/activate-studio.sh

cd content/drafts/abbas-table-storm
python3 make_script.py                           # script.json from script2.py
# record audio/takes/T01..T08.wav (8 takes, voice-00, texts in script2.py)
cd ../../..
.venv/bin/python tools/.../split_takes.py  --project content/drafts/abbas-table-storm
.venv/bin/python tools/.../build_narration.py --project content/drafts/abbas-table-storm
.venv/bin/python tools/.../prep_assets.py  --project content/drafts/abbas-table-storm
.venv/bin/python -c "import sys; sys.path[:0]=['tools/cinematic-skill/skills/cinematic-film/scripts','content/drafts/abbas-table-storm']; from art2 import prepare_photos; prepare_photos('content/drafts/abbas-table-storm/art2','content/drafts/abbas-table-storm/assets/prep')"
```

Then render (see below). Narration regeneration **changes every cue**, so never
regenerate it and expect the old chapter times to hold — `make_script.py` and
`packaging.md` derive from `audio/timing.json`, not from memory.

---

## The design decisions that matter (do not undo these)

**Pictures fill the frame.** No paper page, no photo border, no canvas. Each still is
drawn at exactly one frame width (`SPAN = 3840/zoom × 1.025`) and the camera never
travels. All pictures are stacked at the same world point (`X_STEP = 0`) and
**cross-fade**; a picture gives way at the exact instant the next begins dissolving in,
so the frame is always entirely a picture.

> Three earlier attempts failed and should not be revisited: parking pictures side by
> side (the camera pans across the gap, showing bare background); moving the camera to
> each picture (same gap, mid-move); and fast "cuts" between them (still showed the
> background for ~1 s). Stacking is the only approach that is full-bleed at every frame.

**Scripture is typeset, not boxed.** `Scripture` draws a soft elliptical darkening of
the picture, then the verse in the film's serif, wrapped to a measure, hairline rule,
tracked reference. There are no rounded panels and no handwriting anywhere in the film.

**Full-resolution stills.** The shared `Res.image()` caps images at 1100 px, which is
invisible on a photo pinned to a board and obviously soft when a still fills a 1080p
frame. `art2.install_full_res_loader()` patches in a `Res.photo()` that honours the real
size; `prepare_photos()` resamples each plate once, offline, to 1920 with Lanczos plus a
light unsharp, so the renderer never upsamples.

**Pacing.** `make_script.py` sets the silence after each line (0.55 s normally, 0.95 s at
a paragraph break, 0.70 s in the prayer, 1.5 s between movements). This is what makes it
read as told rather than recited; it is not padding to adjust casually.

---

## Render and deliver

```bash
source scripts/activate-studio.sh
.venv/bin/python tools/cinematic-skill/skills/cinematic-film/scripts/render.py \
  --project content/drafts/abbas-table-storm --size 1920x1080 --crf 18 --workers 2 \
  --out "$PWD/out/videos/abbas-table-storm-long-master.mp4" \
  --audio "$PWD/content/drafts/abbas-table-storm/audio/narration.m4a"
```
≈45–50 min for 632 s at 2 workers (~2.3 fps/worker). Verify the exit code before
claiming a render.

Captions (run from the project dir; `--out` must be relative):
```bash
.venv/bin/python tools/.../burn_captions.py --project . --srt-only --out ../../../out/videos/abbas-table-storm-long.srt
```

Delivery encode — **no `-shortest`**, it truncates the film when the narration is a
fraction longer than the video:
```bash
ffmpeg -v error -y -i out/videos/abbas-table-storm-long-master.mp4 \
  -i out/videos/abbas-table-storm-long.srt \
  -i content/drafts/abbas-table-storm/audio/narration.m4a \
  -map 0:v -map 2:a -map 1:s -c:v libx264 -preset slow -b:v 1600k -maxrate 1900k \
  -bufsize 3400k -pix_fmt yuv420p -c:a aac -b:a 128k -ac 1 \
  -af "loudnorm=I=-14:TP=-1.5:LRA=11" -c:s mov_text -metadata:s:s:0 language=eng \
  -movflags +faststart out/videos/abbas-table-storm-long-final.mp4
```
Target −14 LUFS, ≤100 MB for the Drive upload via the `google_drive` connector.

---

## Pitfalls, in the order they bit

- **A sandbox reset wipes `out/`, `audio/`, `tools/`, `.venv`, `/tmp`.** Let me say that
  again in the way that matters: *commit and push after every stage, not at the end.*
  Three resets cost this project two full rebuilds.
- `rsync` is not installed — use `cp -a`.
- `git stash --include-untracked` sweeps ignored build artifacts into the index; recover
  with `git reset --mixed FETCH_HEAD`.
- `git add -A` will sweep `out/`, `audio/`, `assets/`. Add explicit paths.
- Skia's `drawImageRect` needs an explicit **src** rect, or it draws the bitmap at its
  own pixel size regardless of the dst rect — the bug that made a full-frame picture
  appear as a 1376 px block in the corner.
- `generate_image` refuses a request once 10 images have been made in one turn. Generate
  in batches and they persist; plan for 24 plates across turns, not one.
- The final frame is black by design.
- If the film ends within a second of the narration, encode **without** `-shortest`.

---

## Status

- [x] 24/24 plates generated, prepped to 1920 and committed
- [x] 109 lines of script, narration built (632.5 s), captions (277 cues)
- [x] full render: 18,975 frames, exit 0, 3845 s at 2 workers
- [x] delivery encode: 632.5 s, 97 MB, −14.3 LUFS, −1.3 dBTP, decodes clean, 277 cues
- [x] Drive upload + public link:
      https://drive.google.com/file/d/1FWwcRzm_T_Kq3pJl-MZYxFCpfTT6o2oN/view?usp=drivesdk

### Delivery record (this edition)

| | |
|---|---|
| File | `out/videos/abbas-table-storm-long-final.mp4` |
| Runtime | 10:32 (632.5 s) |
| Video | 1920×1080, 30 fps, H.264, 1600 kbps |
| Audio | AAC 128k mono, −14.3 LUFS, −1.3 dBTP |
| Subtitles | 277 cues, mov_text, soft (not burned in) |
| Size | 97 MB |

Chapters: 0:00 The long day · 1:39 The storm · 3:30 "Do you not care?" · 4:46 Peace, be
still · 6:09 "Why are you so afraid?" · 7:22 "Who then is this?" · 8:48 Let us pray ·
10:05 Sit, listen, and rest
