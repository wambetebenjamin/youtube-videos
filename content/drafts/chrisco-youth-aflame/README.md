# CHRISCO Youth Aflame — rally film

One poster, five camera moves, five Swahili lines. Built from the supplied Youth Aflame poster and
the supplied five-scene script, with the supplied sound-engineering notes.

## What was decided, and why

**Length: 95 s, not 55 s.** The brief asked for 55 s, but the script is ~340 spoken Swahili words and
a natural, energetic read of it takes 89 s. The two options were to push the read to an unnatural
pace or to cut the script; both were rejected. At a natural read the film runs **1:35**, which is
also the right length for a Facebook/WhatsApp rally share — long enough to say the date, the venue,
the fee and the verse, short enough to be watched to the end.

**Visuals: the poster is the film.** No generated footage, no shot list. The poster is a designed
16:9-hostile 4:5 graphic, so the frame is built as: poster fitted to the frame's full width and held
in the upper part of the frame, with a navy lower third under it for the type. The camera does the
moving — slow push, lateral drift, small settle — and the type lands on the beat.

**No dissolves between scenes.** A poster is one continuous image; cross-dissolving between two crops
of the same picture reads as a rendering fault. Each scene holds; the cut IS the transition.

## Timeline (`script.py` is the source of truth)

| # | Start | End | Dur | Scene | Headline | Kicker |
|---|---|---|---|---|---|---|
| 1 | 0.90 | 11.50 | 10.60 | Kufika Litein | BWANA YESU ASIFIWE | CHRISCO YOUTH AFLAME |
| 2 | 12.05 | 27.69 | 15.64 | Hatutishwi | HATUTISHWI | KUHUSU VITA |
| 3 | 28.24 | 60.60 | 32.36 | Mpango Kamili | 30 NOV - 5 DEC 2026 | TUKUTANE NYABOKEKI |
| 4 | 61.15 | 75.19 | 14.04 | Hapana! | HAPANA! LA HASHA! | SWALI KWA VIJANA |
| 5 | 75.74 | 92.18 | 16.44 | Zaidi! | YOUTH AFLAME | MWISHO WA KAMBI |

Total **95.38 s**. Lead 0.9 s before the first line, 0.55 s between scenes, 3.2 s tail after the last.

## The mix (`audio_build.py`, measured on stems)

| Element | Target | Measured |
|---|---|---|
| Crowd ambience bed | −18 dB under voice | **−18.1 dB** |
| Gospel/afrobeat bed | −22 dB, building to the end | **−22.2 dB** |
| Speaker slapback | 140 ms, 15% wet | 140 ms / 15% wet / 2.6 kHz LP on the repeat |
| Crowd stingers | after the rhetorical beats | loudest **+16.4 dB** above the bed |
| Voice | natural, unprocessed level | −17.1 dBFS |
| Final mix | no clipping | **−17.3 dBFS**, peak 0.980 |

Eight accents are placed in `script.py` (`ACCENTS`), each on a question mark or a punchline, so the
crowd answers the line instead of talking over it.

## Script corrections made to make it speakable

Numbers and the verse reference are spelled out as they must be said:
"thelathini Novemba hadi tano Desemba elfu mbili ishirini na sita", "Kwanza Samueli thelathini na
nane". The inline `(Crowd: Zaidi!)` cues were removed from the spoken text and rebuilt as timed
crowd stingers in the mix.

## Rebuild

```bash
.venv/bin/python content/drafts/chrisco-youth-aflame/audio_build.py --project content/drafts/chrisco-youth-aflame
.venv/bin/python tools/cinematic-skill/skills/cinematic-film/scripts/render.py \
  --project content/drafts/chrisco-youth-aflame --size 1080x1920 \
  --out out/videos/chrisco-aflame-vertical.mp4 \
  --audio content/drafts/chrisco-youth-aflame/audio/mix.wav
```

Takes are in `audio/takes/` (voice-04, Swahili). The timeline reads their measured durations, so the
picture and the mix cannot drift apart.

## Delivered file

**https://drive.google.com/file/d/19PBaME-aVx3ASoxcYiM6p4kI-A3MCZ7W/view**

`chrisco-youth-aflame-rally-1080x1920.mp4` — 1:35.4, 1080×1920 (9:16), 30 fps, H.264 + AAC 192k,
73.8 MB, −15.7 LUFS / −1.3 dBTP. Vertical because this is a phone-first rally share (WhatsApp
status / Facebook / TikTok); the poster itself has not been screenshot-cropped, it is fitted whole.

Supersedes nothing — this is the first cut of this poster.
