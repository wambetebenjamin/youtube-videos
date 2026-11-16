# There Was Room For You — Abba's Table, episode 1

First episode of the **At His Table** series, built for the channel
[@abbastablestories](https://youtube.com/@abbastablestories) — "Bible and communion at Abba's Table".

**Structure:** the BibleCue formula (hook → felt problem → scripture reframe → turn → close),
re-shaped for a quiet, communion-first channel: the teaching is carried by **one story**
(Luke 14, the wedding feast), the close is a **prayer** rather than a comment prompt, and the visual
look is the engine's `paper` desk (warm, low contrast, no red).

| File | What it is |
| --- | --- |
| `script.md` | The readable episode — opening, the verse, the door, communion, prayer, close |
| `script.json` | Engine narration: 76 lines, 7 takes, 0 lint warnings |
| `beats.md` | Beat table from `make_beats.py` |
| `scene.py` | Five verse cards arranged around the table, one slow camera |
| `verses.md` | 9 passages verified against WEB (public domain) |
| `packaging.md` | Title, description, chapters, companion Short, publish checklist |

**Runtime:** ~6:33 at 150 wpm.

## Status

- ✅ Script written; `make_beats.py` reports **0 warnings**
- ✅ `scene.py` builds; probe stills verified at 1080p in the `paper` look
- ✅ 24s draft rendered: `out/videos/abbas-table-luke14-draft24s.mp4` (H.264 1080p30 + AAC)
- ✅ Thumbnail: `out/graphics/abbas-table-ep1-thumb.png` (warm theme)
- ⚠️ **Audio is a placeholder** — a synthesized tone at the scripted line lengths, used only to
  exercise the render chain. Not committed. Record a real read before the final render.

## Two channel-specific formatting decisions

1. **"Abba" is used for the Father** (Romans 8:15; Mark 14:36), and the bread and cup are treated
   reverently but without a particular tradition's rules — the episode says explicitly "there is no
   fence around this table except the door you are already standing at." If your church holds a
   closed or fenced communion, change that line before publishing; it is a theological claim, and
   it should be **yours**, not the template's.
2. **No "6 signs" list format here.** Your channel sells quiet, not listicles. The BibleCue
   structure is underneath, but the surface is a story and a prayer.

## Next steps

See `packaging.md` for the publish checklist, and `README.md` in
`content/drafts/pruning-not-punishment/` for the full render commands (identical pipeline).
