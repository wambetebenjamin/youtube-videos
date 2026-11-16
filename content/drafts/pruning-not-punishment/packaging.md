# Pruning Is Not Punishment — packaging

## Title options

Following the deduced title engine: `[NUMBER] Signs God Is [DOING X] (Even If [DOUBT])`

| Option | Why |
| --- | --- |
| **5 Signs God Is Pruning You (And It's Not Punishment)** | Closest to the proven pattern. "Pruning" is a search term with real volume in this niche, and the parenthetical resolves the fear immediately |
| 5 Signs God Is Preparing You (Even If Nothing Has Grown Back Yet) | Better if the audience skews anxious rather than guilty |
| Why God Cuts Back What He Loves | Strongest literary line, weakest for search; use as the thumbnail line |

**Recommended:** option 1 for the title, "Why God cuts back what He loves" as the thumbnail sub-line
(already rendered in `out/graphics/pruning-not-punishment-thumb.png`).

## Description

```
5 Signs God Is Pruning You (And It's Not Punishment)

You were faithful — and things still came off. A gift that worked. A room you felt at home in.
A way of praying that now feels like talking to a ceiling. And nothing obviously went wrong.

So you've been doing the only thing you know to do: apologising. Repenting of things you didn't do,
asking God what you did wrong.

That's the wrong question. Scripture doesn't describe a courtroom here. It describes a vineyard.

God prunes where He intends to produce — and pruning is not removal. It's reduction with an intent.

📖 WHAT YOU'LL LEARN
✔️ Why the branch God cuts back is usually the healthy one, not the dying one
✔️ What John 15:2 actually says about who gets pruned (it's not who you think)
✔️ How Moses leaving a still-working position shows what "outgrowing the container" looks like
✔️ Why God's silence in a pruning season is not His absence — and what Joseph's 13 quiet years prove
✔️ How Gideon's army going from 32,000 to 300 reframes "my resources are shrinking"
✔️ Why your competence suddenly failing is a relocation of confidence, not a retirement
✔️ How to tell pruning from punishment without guessing
✔️ The five things to actually do this week if you suspect you're being pruned

✝️ SCRIPTURE COVERED (WEB — public domain)
📖 John 15:2 — The fruitful branch is the one that gets pruned
📖 Hebrews 11:24–25 — Moses refuses a position that was still green
📖 Genesis 50:20 — Joseph: what was meant for evil, God meant for good
📖 Habakkuk 2:3 — The vision is for an appointed time; waiting is not failure
📖 Judges 7:2 — Gideon reduced so Israel couldn't take the credit
📖 Luke 5:5 — Peter's competence fails before the word works
📖 Isaiah 40:31 — Strength renewed, not restored
📖 1 Peter 1:7 — Gold is tested because it is valuable
📖 Exodus 14:14 — Be still; the Lord will fight for you
📖 Psalm 46:10 — Be still, and know
📖 Philippians 4:7 — Peace that surpasses understanding guards you
📖 Isaiah 43:19 — "It springs out now"

Not every hard thing is a promotion, and this video doesn't claim otherwise. But if you have been
reading a pruning season as a verdict, this is for you.

#BibleTeaching #PruningSeason #John15 #ChristianWalk #BibleStudy
```

## Chapters

| Time | Chapter |
| --- | --- |
| 00:00 | When nothing obviously went wrong |
| 00:41 | The trap: we think God cuts in anger |
| 01:19 | Not a courtroom — a vineyard |
| 02:03 | Sign 1 — What leaves is green |
| 02:57 | Sign 2 — It is quiet |
| 03:57 | Sign 3 — Reduced, not corrected |
| 05:04 | Sign 4 — The old tools go blunt |
| 06:08 | Sign 5 — Fruit you did not plant |
| 07:08 | What to actually do this week |
| 08:18 | The promise that makes it bearable |

> Note: the times above come from the **placeholder narration** (a synthetic timing track). After the
> real voiceover is recorded, re-run `build_narration.py` and regenerate this table from
> `content/drafts/pruning-not-punishment/beats.md` — the chapter times must match the real read.

## Short-form cut-downs (from the same script)

Three vertical pieces, each one sign — the sign block is already a self-contained 5-part unit.

| Short | Source lines | Hook (first 1.5s) | CTA |
| --- | --- | --- | --- |
| "The branch God cuts is green" | 31–44 | "The branch God cuts back is usually not the dying one." | Full teaching in the long video |
| "God's silence is not absence" | 45–59 | "Thirteen years. No voice, no angel, no verse." | Full teaching in the long video |
| "32,000 → 300" | 60–75 | "God reduced the army before He gave the victory." | Full teaching in the long video |

**Build each short as its own project, not by re-cropping the long one.** `scene.py` is the layout,
and a landscape world (5,600pt-wide cards) inside a 1,080pt-wide frame leaves most of the screen
empty — verified. A dedicated 9:16 project lets you stack the card above the narration line and
use the full height:

```bash
source scripts/activate-studio.sh
npm run film:new -- content/drafts/pruning-short-1 --title "The branch God cuts is green"
#   copy only lines 31-44 from the long script.json into the short's script.json,
#   then edit scene.py for a portrait layout (card 900x1400, stacked, camera locked tight)
#   and run the same tts -> split -> narration -> render chain.
```

## Thumbnail

`out/graphics/pruning-not-punishment-thumb.png` (1920×1080) — 3-word-per-line high contrast,
readable at 120px. Swap the accent bar colour per series episode for a recognisable shelf.
