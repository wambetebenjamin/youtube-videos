# Peace, Be Still — packaging

**Channel:** Abba's Table (@abbastablestories)
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

## Chapters

| Time | Chapter | Scene |
| --- | --- | --- |
| 00:00 | "Let's go over to the other side" | T01 |
| 01:29 | The storm | T02 |
| 02:38 | "Don't you care?" | T03 |
| 03:40 | Peace, be still | T04 |
| 04:57 | Why are you afraid? | T05 |
| 06:13 | Who then is this? | T06 |
| 07:15 | Prayer | T07 |
| 08:54 | A blessing to sleep on | T08 |

> Times are from the **placeholder narration** (`build_narration.py`, 562.9 s total). Re-run after
> the real read and regenerate from `audio/timing.json`.

## Companion Short (9:16)

The strongest 40 seconds in this episode is **the four words** — lines 40–54, from
*"He awoke"* through *"watched a man do it."* It needs no setup: storm in, voice, flat water.

| Item | Value |
| --- | --- |
| Hook (first 1.5 s) | "The wind was louder than the voice — until He stood up." |
| Lines | 40–54 (`script.json`, scene `T04_peace_be_still`) |
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

- [ ] Real voiceover recorded — warm, unhurried, **~145 wpm**; keep the pause before "Peace" long
- [ ] Loudness to **-14 LUFS**, true peak **-1 dBTP**
- [ ] Burned captions + `.srt` (this channel is watched with captions on)
- [ ] Chapters pasted after the real read
- [ ] Thumbnail: `out/graphics/abbas-table-storm-thumb.png` (1920×1080, text **PEACE, BE STILL**)
- [ ] End screen: next story + subscribe
- [ ] `verses.md` re-checked — every quote from WEB, public domain
- [ ] No interpretation before 07:15 — if you edit, keep the story clean to the prayer
