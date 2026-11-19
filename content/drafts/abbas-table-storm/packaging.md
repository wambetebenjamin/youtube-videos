# Peace, Be Still — packaging

**Channel:** Abba's Table (@abbastable)
**Series:** Bible stories — episode 2
**Text:** Mark 4:35–41 (parallel: Matthew 8:23–27)
**Slot:** Sunday evening / any quiet slot
**Shape:** pure story retelling — beginning, middle, end; no teaching section, no communion, closing prayer

---

## Why this episode is shaped as a story

Episode 1 ("There Was Room For You") was built as a *teaching* — a verse, an argument, an
application. This one is built as a **story**, because that is what the channel says it is:
*"A quiet place where Bible stories come alive."*

The rule I wrote into `script.md` and kept for all 104 lines:

> **Nothing is interpreted until the story has finished.**
> You don't explain the storm while it is still blowing.

So Mark's own order carries the weight. The disciples' accusation (*"Teacher, don't you care that we
are dying?"*) is left as an accusation and not softened. Jesus asks *"Why are you so afraid?"*
**after** the calm, not during the panic. And the last line of the episode is Mark's own question,
still unanswered — *"Who then is this?"* — because that is where Mark leaves it.

## Title

| Option | Notes |
| --- | --- |
| **Peace, Be Still** | The four words people already search for; quiet, not clickbait |
| Peace, Be Still — The Story of the Storm (Mark 4) | Best for search; keeps the story framing |
| He Was Asleep in the Storm | Strongest curiosity gap, still true to the text |

**Recommended:** `Peace, Be Still — The Story of the Storm (Mark 4)`.
Thumbnail text should stay just **PEACE, BE STILL**.

## Description

```
Peace, Be Still · Mark 4:35–41

That day, when evening had come, he said to them, "Let's go over to the other side."

They were fishermen. They had grown up on that water. And that night the water was louder than
the voice that had told them to cross.

This is the story, told slowly — the evening, the wind, the sleep, the four words, and the
question they were still asking when the boat touched the far shore.

📖 IN THIS EPISODE
· An ordinary sentence: "let's go over to the other side"
· Why the storm was not a surprise — and why Jesus was asleep on the cushion
· "Teacher, don't you care?" — the wound underneath the question
· "Peace, be still" — the same word Jesus used to silence demons
· Why He asked "why are you afraid?" only after the water went flat
· "Who then is this?" — the question Mark never answers

✝️ SCRIPTURE (WEB — public domain)
Mark 4:35 · Mark 4:36 · Mark 4:37 · Mark 4:38 · Mark 4:39 · Mark 4:40 · Mark 4:41
Matthew 8:25 · Psalm 107:29 · Psalm 4:8

🙏 A QUIET PRAYER
"Lord, You were in the boat — not on the shore. Forgive us for reading Your silence as
indifference. Say peace to what is loud in us tonight."

Sit, listen, and encounter God — one story, one prayer at a time.

#AbbasTable #BibleStory #Mark4 #PeaceBeStill #JesusCalmsTheStorm #Prayer #ChristianEncouragement
```

**Pinned comment:** *"They woke Him angry. They still woke Him. That counts."*

## The pictures

**Twenty-four full-bleed illustrations**, stacked one point apart in world space and cross-faded
where one story beat ends and the next begins. There is no border, no paper page, no mat and no drop
shadow: a picture fills the frame edge to edge or it is not in the film. The camera never travels
between pictures — a picture gives way at the exact instant the next starts dissolving in, so the
frame is a photograph at every single frame of the film.

**Ten of those beats also get the sketchbook**: a page laid over the picture with a hand writing the
line the narrator is speaking, word by word, at the speed she says it. If she slows down the pen
slows down; if she pauses the pen stops. The page is dark warm stock lit by a lamp pool, and the
writing is what catches the light — a sheet of bright paper laid into a film graded this dark reads
as a slide, however well it is drawn.

The two surfaces alternate. The gallery shows what the story *looks* like; the sketchbook shows what
the narrator is drawing out of it. The sketchbook runs 6–14 seconds at a time and then the picture
has the frame back.

## Chapters

| Time | Chapter |
| --- | --- |
| 0:00 | The long day |
| 2:03 | The storm |
| 4:16 | "Do you not care?" |
| 5:50 | Peace, be still |
| 7:27 | "Why are you so afraid?" |
| 8:50 | "Who then is this?" |
| 10:29 | Let us pray |
| 12:00 | Sit, listen, and rest |

> Times are from the **real narration** (`audio/timing.json`, 754.5 s total (12:34)). If the read is
> re-recorded, regenerate the table the same way — never hand-edit it.

## Companion Short (9:16)

The strongest 40 seconds in this episode is **the four words** — lines 40–54, from
*"He awoke"* through *"watched a man do it."* It needs no setup: storm in, voice, flat water.

| Item | Value |
| --- | --- |
| Hook (first 1.5 s) | "The wind was louder than the voice — until He stood up." |
| Lines | 40–54 (`script.json`, scene `T04_peace_be_still`, 2:57–4:02) |
| Length | ~45–55 s |
| Closing card | PEACE. BE STILL. |
| Build | its own 9:16 project, `--format story` thumbnail |

```bash
source scripts/activate-studio.sh
npm run film:new -- content/drafts/abbas-table-short-be-still --title "Peace, Be Still"
```

Second Short, if you want two: **"Teacher, don't you care?"** (T03) — the question everyone has
asked in a hospital corridor.

## Publishing checklist

- [x] Real voiceover recorded — warm, unhurried, ~155 wpm (7:20 total)
- [x] Narration normalized (measured −16.6 dB mean, −1.5 dB peak); master to **-14 LUFS** on export
- [x] `.srt` written: `out/videos/abbas-table-storm.srt` (198 cues)
- [ ] Burned caption pass (optional — YouTube can use the `.srt`)
- [ ] Chapters pasted after the real read
- [ ] Thumbnail: `out/graphics/abbas-table-storm-thumb.png` (1920×1080, text **PEACE, BE STILL**)
- [ ] End screen: next story + subscribe
- [ ] `verses.md` re-checked — every quote from WEB, public domain
- [ ] No interpretation before 07:15 — if you edit, keep the story clean to the prayer
