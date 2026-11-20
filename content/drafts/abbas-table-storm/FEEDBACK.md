# Diagnosis — "something is missing" on the 14:27 cut

The viewer's note is vague, which usually means the problem is not a single broken thing but an
absence they can feel and cannot point at. So the delivered file was measured rather than argued
with. Everything below is a number taken from
`Peace, Be Still - The Story of the Storm (Mark 4) - 14-27.mp4` (867.4 s).

## What the measurements say

| Property | Measured | What it should be for this story |
| --- | --- | --- |
| Speech time | **641 s of 867 s = 74 %** | A retelling with dread in it needs silence. This is a wall of talk. |
| Rate **during speech** | **165 wpm** (hook 163, body **173**, close 144) | ~120–135. The 122 wpm headline was the *average over runtime*, which only looked calm because of the gaps. |
| Breaths > 0.6 s | 108, median **1.60 s**, and they are **clustered around the transitions** | A pause that only appears where the edit changes picture is a cut, not a breath. |
| Short-term loudness | 3 s spread **7.1 dB**; 60 s means −17.6 … −18.8 dBFS | The storm does not get louder and the calm does not get quieter. |
| Spectral balance per minute | identical for 14 minutes (150–600 Hz always ~58 dB, 1k–3k always ~40), including the prayer | The "score" that was fixed is, functionally, a **constant** — the ear stops hearing a constant after ~90 s, and then it is room tone again. |
| Picture motion | 2 fps mean | never rises above ~3 between 7:00 and 13:30 |

**The one sentence version:** the film is 74 % continuous speech at 165 wpm with an unchanging
sound bed — so "something is missing" is **silence**: a place to feel the thing being said.

The last measurement is the diagnosis. A soundtrack whose spectrum is identical at 03:00, 08:00 and
13:00 is not quiet-and-present, it is *flat*. Flat is the audio version of a picture that never
moves.

## What this rules out

- **Not the pace in the ordinary sense.** Another 15 % stretch would take the read to ~140 wpm and
  make it *longer* while still sounding hurried, because the ear hears the speaking rate, not the
  average. That mistake was already made once (see `PACE.md`).
- **Not the words.** The script is the strongest thing in the film: the accusation is left as an
  accusation, the question is asked after the calm, the ending is left open. Do not touch `script.md`.
- **Not the pictures.** Twenty-four full-bleed plates, cross-faded on the beats, is the right
  architecture.

## The fix, in order of how much it will be felt

1. **Cut the script's spoken volume to ~72–75 %, to land near 125 wpm** — and do it by *rewriting the
   narration*, not by stretching audio, which adds warp instead of calm. Target 15:00–15:30.
2. **Let the storm be loud and the calm be quiet.** Today the whole film sits within ±1 dB. The wind
   and water should live under the storm scenes, drop away at *"Peace. Be still."*, and the prayer
   should be the quietest passage in the film.
3. **Hold silence at the four hinges.** After *"asleep on the cushion."* After *"Peace. Be still."*
   After *"Why are you so afraid?"* Two to three seconds of nothing but water, each time.
4. **Make the score tell time.** One harmonic arc across the fifteen minutes, not a loop.
5. **Give the calm a different picture rhythm.** The still water is the only shot in the story that
   should be allowed to sit completely still.

Confirm the direction before any of this is built — re-cutting the narration is the expensive part,
and there is no point paying for it if the missing thing is something else entirely.

---

## What has been built

`out/videos/abbas-table-storm-v5-silence.mp4` — the delivered picture, untouched, with the sound
rebuilt around eight silences. Nothing was re-recorded and not one word of the script changed.

| Hinge | Silence after the line | Delivered | Now |
| --- | --- | --- | --- |
| *"…Jesus was asleep"* | 2.6 s → **4.6 s** | −17.2 dB | −21.0 dB |
| *"Teacher, don't you care…"* | 1.6 s → **2.4 s** | −19.7 dB | −29.3 dB |
| *"Peace. Be still."* | 2.9 s → **4.8 s** | −16.9 dB | −29.4 dB |
| *"…there was a great calm"* | 2.6 s → **4.0 s** | −16.8 dB | −27.7 dB |
| *"…stopped in the middle of a sentence"* | 1.6 s → **3.2 s** | −17.6 dB | −29.1 dB |
| *"…after the water is flat"* | 1.6 s → **3.0 s** | −17.0 dB | −28.5 dB |
| *"Who then is this."* | 2.6 s → **3.4 s** | −17.0 dB | −29.1 dB |
| *"In Jesus' name, amen."* | 1.6 s → **6.0 s** | −18.2 dB | −31.0 dB |

And the one that matters most, at *"Peace. Be still."* — the storm, then nothing:

| 386–392 s (the storm) | 394–404 s (the calm) | drop |
| --- | --- | --- |
| −16.3 dB | −21.9 dB | **−5.6 dB** |

In the delivered cut the same two windows differ by **1.1 dB**, i.e. not at all. That is the
"something missing" in one number.

### What is honestly still wrong

The viewer will still hear an unwanted pad under the prayer, and the storm will still not be as loud
as it should be. That is not laziness: **the delivered score and the voice are in the same stereo
track**, so anything done to the score is done to the narrator. The silences were fixable *because*
they contain no words.

The last step needs a clean narration take — `script.json` is already set up for it, with the eight
`gap_after` values and a `gap_hold` on each hinge so the picture holds across the silence. Then:
fresh narration → `score.py` reaches the bed → `ambience.py` keeps the weather → mix at the levels
above. Runtime lands near the same 14–15 minutes, because the silences add back the nine seconds and
the read is untouched.
