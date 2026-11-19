# Abba's Table — production standard

This is how every Abba's Table episode is made. It exists because the first two episodes were
rebuilt four times: not from a lack of ideas, but because decisions that had been agreed in
conversation were never written down where the next session could find them.

Read this before making anything. If a rule here conflicts with a fresh idea, the rule wins unless
the owner says otherwise — then change the rule, in this file, in the same commit.

---

## 1. What the channel is

**Abba's Table** — scripture, told rather than lectured. Each episode is a *story* first: the
viewer is put inside the scene and the meaning arrives through it. A short prayer closes the film.
Anything that explains before the story has landed is cut.

| | |
|---|---|
| Episode length | **12–20 minutes.** Not a constraint to bump against — a floor. The story is given room. |
| Narration pace | Slow. See §4. |
| Scripture | **WEB** (World English Bible) — copyright-free to quote. Every reference verified against the text. |
| Delivery | 1920×1080 · 30 fps · H.264 · AAC · soft captions · **−14 LUFS** |
| Music | Present, always. Soft. See §5. |

---

## 2. The canvas

Every episode has two surfaces, and it has both:

**(a) The gallery.** Full-frame illustrations. No paper page, no border, no mat, no drop shadow —
a picture fills the frame edge to edge or it is not in the film. Pictures are stacked at one point
in world space and **cross-fade**; a picture gives way at the exact instant the next begins
dissolving in, so the frame is a picture at every single frame.

> Do not park pictures side by side, do not pan between them, do not "cut" between them. All three
> leave the viewer looking at bare background for a fraction of a second, which is the one thing
> this channel never shows. This was tried and rejected three times; see §9.

**(b) The sketchbook.** A canvas where a **hand writes and draws while the narrator speaks** — the
thing that makes these films feel made rather than assembled. Ink appears under the voice at the
same rhythm as the speaking, and the marks that appear are the marks the narration is describing.

The two alternate. The gallery shows what the story *looks* like; the sketchbook shows what the
narrator is *drawing out* of it — a word, a shape, a small diagram, a verse being written.

### Rules for the sketchbook

- **It writes what is being said, at the speed it is said.** A line of ~60 characters takes its own
  line-length in the narration, not a fixed 2 seconds. If the narrator pauses, the pen pauses.
- **The hand is visible.** Nib on the paper, moving with the stroke. A canvas that fills itself is
  a mask reveal, not drawing.
- **It is a real surface, and it is a page in shadow — not white paper.** This is the single most
  important line in this section. Cream paper cannot be laid into a film graded this dark: however
  carefully the colour is measured against the grade, it reads as a bright slide dropped over the
  picture, because nothing else in the frame is that bright and paper does not glow. Use dark warm
  stock, put a *lamp pool* over it (a radial gradient, not a flat fill), and let the **writing** be
  the bright thing — candle-coloured ink catching the light. Flat mid-tone card still reads as a
  panel; light falling off across the page is what makes it a surface.
- **Ruled to the writing.** The rules on the page and the lines of writing must be the same lines.
  Compute the rule positions from the type size and line count, not from a fixed grid.
- **One hand, one pen.** Fix the type size and let the *number of lines* vary. Fitting the type size
  to the text makes short lines enormous and long lines tiny, and the pages stop reading as the
  same notebook.
- **Cut the sheet to its content.** A page is as tall as what is written on it. A fixed rectangle
  with the writing stranded in the top third is a graphic, not a notebook.
- **Legible from across a room.** Body text no smaller than ~44 px at 1080p.
- **Short.** 6–14 seconds, then back to the gallery. A sketchbook that overstays becomes a slide.
  Pick the lines by *duration*, filtering narration segments to ≥6 s **first** — the memorable
  short punches are 2–3 s and the page opens and shuts before it reads as writing at all.
- **Not under the title, and not on a verse line.** The opening title owns the frame until ~32 s;
  a page beneath it reads as a mistake. Skip any line that already carries scripture type.

---

## 3. Pictures

- **24+ per episode**, one per story beat. More is better than fewer.
- **16:9, full frame.** If a plate is portrait, crop it around the ink — never letterbox it.
- **Prepped to exactly 1920 wide**, Lanczos + a light unsharp pass. The shared `Res.image()` caps
  at 1100 px, which is invisible on a pinned photo and obviously soft full-frame, so the project
  installs its own full-resolution loader (`art2.install_full_res_loader()`).
- **Enhancement is allowed, invention is not.** Upscaling, colour harmony, grain and dust are fine.
  Do not regenerate a plate the owner has approved unless asked.

---

## 4. Voice

- **Voice audition is a hard gate.** `add_voice` first, the owner picks, then `generate_speech`.
- **Slow.** Target ~120–135 words per minute. The studio's `build_narration.py --target` solves for
  the tempo change with pitch preserved; anything outside 0.90–1.15× is refused, which is the
  right refusal — outside that band a slowed read *sounds slowed* rather than calm. So **reach a
  slow read by writing and pausing, not by stretching**:
  - silence after each line: **0.85 s** (not 0.45)
  - paragraph break: **1.30 s**
  - between movements: **2.0 s**
  - and write longer sentences. A deep breath belongs between thoughts, not inside them.
- One line = one sentence = one caption. Lines are the unit the film is built from.

---

## 5. Music

A bed under the whole film, **felt and not followed**.

- Duck it under the voice so it never competes: `mix_soundtrack.py` side-chains it to the narration.
  Working levels for a quiet, devotional film:
  `--music-db -6 --duck-ratio 4 --duck-threshold 0.03 --music-level 0.055 --music-eq-dip 5`
  (music lands ~-32 LUFS under a -15 LUFS mix).
- **Harmony marks the cuts, not volume.** A loud accent on a transition reads as a jump scare.
  Measured: +7 to +10 dB jumps startle; +3 to +5 dB with a chord change reads as a clean edit.
  Every cut lands on a downbeat; each scene walks home to the dominant and the cut arrives on tonic.
- No percussion-heavy bed on prayer. Nothing with a vocal.
- Check it: `node scripts/verify/sync-check.mjs <file>.mp4 --cues-file <file>.cues.json` — fails on
  OFF-BEAT (>±100 ms) or STARTLE (>+6 dB). Every remaining STARTLE must be a stinger you can name.

---

## 6. Type

- Serif for scripture (the film's own serif). Reference in small tracked capitals beneath.
- **Never** a rounded UI panel, a card with a drop shadow, or a script/handwriting face for body
  text. Scripture is set like a page in a book, over the picture, inside a soft elliptical
  darkening — not inside a box.
- Section markers live in the lower third with a soft shadow. Centred, they land on people's faces.

---

## 7. Structure

| Beat | Length | Job |
|---|---|---|
| Cold open | 20–40 s | The scene, no title yet. The narrator is already talking. |
| Title | 4–6 s | Over the open picture. Name, then reference. |
| Story | 70–80% | Gallery and sketchbook alternating. |
| Prayer | 60–90 s | Softer music, slower still. |
| Close | 30–40 s | One verse, one blessing. Fade. **≥20 s held** so an end screen can sit on it. |

**Intro:** 3–5 s maximum, logo hit at 1–2 s. Longer costs measurable retention.
**Outro:** the last 20 s must be quiet, held layout with the left third clear of anything you
want read — YouTube stamps its subscribe and next-video elements over the right two thirds.

---

## 8. Verify before delivering

Never say "done" from a log line. Check the encoded file.

```bash
scripts/verify/probe-mp4.sh out/videos/<file>.mp4 1920x1080 30   # assert the real spec
scripts/verify/contact-sheet.sh sheet.png a.png b.png c.png       # start | mid | end at a glance
ffmpeg -v error -i <file>.mp4 -f null -                         # decode check, look for silence
ffmpeg -hide_banner -i <file>.mp4 -af loudnorm=print_format=summary -f null -  # -14 LUFS
```

Then, and only then, upload with the `google_drive` connector and make it public.

**The delivery encode is `scripts/deliver.sh`** — it derives the bitrate from the file's own
duration so the result cannot exceed the 100 MB Drive upload ceiling, then asserts the spec and the
size. 754 s lands at 950 kbps video + 112 kbps audio = 95 MiB. Two-pass x264, subtitles muxed in.
Do not hand-roll the encode: a single-pass VBR at a guessed bitrate bands the dark gradients and,
on a long cut, overshoots the ceiling after the render is already finished.

---

## 9. Things already learned the hard way

- **A sandbox reset wipes `out/`, `audio/`, `tools/`, `.venv`.** Commit and push after every stage,
  not at the end. Four resets have cost this project three rebuilds.
- **Pictures side by side, camera travel, and fast cuts all show bare background.** Stack and
  cross-fade. Verified numerically, not by eye.
- **`drawImageRect` needs an explicit src rect** or Skia draws the bitmap at its native pixel size
  and a full-frame picture appears as a small block in the corner.
- **Never `-shortest`** on the delivery encode — it truncates the film when narration is a hair longer.
- **`build_narration.py` refuses tempo outside 0.90–1.15.** Slow the read by writing, not stretching.
- **`generate_image` stops at 10 per turn.** Batch and commit; plan 24+ plates across several turns.
- **`tools/` is gitignored.** Anything worth keeping from it belongs in `content/` or `scripts/`.
  If a draft needs a change to the engine itself, put a shim in the draft — do not edit `tools/`.
- **Skia's radial gradients run backwards in this stack.** The *first* colour lands at the radius
  and the *last* at the centre, the reverse of the argument order. A lamp pool drawn the intuitive
  way comes out as a black hole with a bright rim. Check any gradient against a test surface before
  trusting it on a frame.
- **Additive lifts beat dark washes for surviving the night grade.** `paint(..., blend="plus")` in a
  warm colour raises a surface's red channel; a dark warm fill can only make it browner.
- **`burn_captions.py` crashes on an absolute `--out`.** Pass a path relative to the project.
- **The outro needs the last 20 s.** YouTube's end-screen elements only appear in the final 5–20 s
  and occupy the right two thirds. Put the channel mark in the left third and leave the right side
  as real picture — a dark plate there looks like a rendering fault.
- **`ffmpeg` is not on `PATH`.** Source `scripts/activate-studio.sh` before any verify script.

---

## 10. Sources

Craft references this standard draws on:
`iart-ai/motion-skills` — `javascript-animation-skills/soundtrack` (§5), `lower-thirds-skills`,
`youtube-video-skills` (§7), and `tools/verify/` (§8). Music craft: iart `soundtrack`.
`Moh4696/cinematic-skill` — the engine (`cinematic-film`).
