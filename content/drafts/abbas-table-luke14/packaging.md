# There Was Room For You — packaging

**Channel:** Abba's Table (@abbastablestories)
**Series:** At His Table — episode 1
**Slot:** Sunday / before communion

---

## Why this video fits the channel

The channel is 519 subscribers, 125 videos, ~39.6k views (joined Nov 2025) with the promise:

> "A quiet place where Bible stories come alive… and prayers draw you closer to God."

So the format here is deliberately **not** a BibleCue-style list video. Same underlying structure
(hook → felt problem → scripture reframe → turn → prayer), but held inside **one Bible story**, at a
slower pace, ending in prayer rather than a comment prompt. Same craft, gentler container — matches
what your existing audience already comes for.

## Title

| Option | Notes |
| --- | --- |
| **There Was Room For You** | Warm, invitational, no clickbait. Best match for the channel's register |
| There Was Still Room (Luke 14:22) | Stronger for search; the phrase is in the text itself |
| The Table Has Room For You — Even If You Stopped Walking | Long-form version if you want the hook doing more work |

**Recommended:** `There Was Room For You` with the verse in the description's first line.

## Description

```
There Was Room For You · Luke 14:22

The servant came back and said, "Lord, it is done as you commanded, and there is still room."

Most of us have been standing on the step for years — knocking politely, offering to eat in the
kitchen, apologising for our shoes. Tonight the door is open, and the place is already set.

📖 IN THIS EPISODE
· Why "enter his gates with thanksgiving" is a doorway, not an obstacle
· What Jesus noticed about the people grabbing the best seats (Luke 14:7)
· Why the Host is the one walking around the table, lifting people up
· The one still in the hedge — the one who stopped walking toward the door
· What the bread and the cup actually are, and what they are not
· A prayer you can pray tonight, if you would like to sit down

✝️ SCRIPTURE (WEB — public domain)
Psalm 100:4 · Luke 14:7 · Luke 14:10 · Luke 14:21–23 · James 4:8 · John 1:12 · Mark 14:22–24 · John 6:37

🙏 A QUIET PRAYER
"Father, thank You for the door that is open. I have stood outside it so long I started calling it
closed. Tonight I would like to sit down."

Sit, listen, and encounter God — one story, one prayer at a time.

#AbbasTable #BibleStory #Communion #Prayer #Luke14 #StillRoom #ChristianEncouragement
```

**Pinned comment:** *"If you are the one standing in the hedge tonight — the room is not full. There
is still room."*

## Chapters

| Time | Chapter |
| --- | --- |
| 00:00 | You do not come crawling in |
| 00:46 | The verse that makes people nervous |
| 02:00 | The Host is the one who lifts people |
| 03:10 | "And there is still room" |
| 04:20 | The one standing in the hedge |
| 04:58 | What this table asks |
| 05:30 | Communion — take, eat |
| 06:00 | Prayer |

> Times are from placeholder narration. Re-run `build_narration.py` after the real read and
> regenerate from `beats.md`.

## Companion Short (9:16)

One moment carries a Short on its own: **the servant's line — "there is still room."**

| Item | Value |
| --- | --- |
| Hook (first 1.5s) | "The servant came back with one sentence." |
| Lines | 33–35 (script.json) |
| Length | ~35–45s |
| Closing card | THERE WAS ROOM FOR YOU |
| Build | its own 9:16 project (see below) |

```bash
source scripts/activate-studio.sh
npm run film:new -- content/drafts/abbas-table-short-still-room --title "There Is Still Room"
# copy lines 33-35 into it, keep look="paper", portrait card 900x1300, camera locked tight
```

## Publishing checklist

- [ ] Real voiceover recorded (warm, unhurried, ~145–150 wpm)
- [ ] Loudness to **-14 LUFS**, true peak **-1 dBTP**
- [ ] Burned captions + `.srt` (a quiet video is watched with captions on)
- [ ] Chapters pasted from `beats.md` after the real read
- [ ] Thumbnail: `out/graphics/abbas-table-ep1-thumb.png`
- [ ] End screen: next episode + subscribe
- [ ] `verses.md` checked — all quoted from WEB
