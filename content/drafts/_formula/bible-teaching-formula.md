# The Bible-Teaching Video Formula

Deconstructed from **"6 Signs God Is Moving You Into a New Season (Even If Nothing Has Changed Yet)"**
— BibleCue, published 2026-10-19, **18:53**, ~120k views, ~2.7k likes, category Education.

This file is the reusable template. `content/drafts/pruning-not-punishment/` is a full original
teaching built with it.

---

## 1. The title engine

```
[NUMBER] Signs God Is [DOING X]
(Even If [THE THING THAT MAKES THEM DOUBT IT])
```

The parenthetical is the whole trick. It names the objection before the viewer can:

| Element | In the reference | Why it works |
| --- | --- | --- |
| Number | **6** | Finite, finishable, clickable. 5–7 is the sweet spot |
| Promise | *God is moving you into a new season* | Second-person, present-tense, about **them** |
| Pre-emption | *(Even If Nothing Has Changed Yet)* | Answers "but nothing happened" → converts skeptics in the feed |

The title makes a **private feeling** feel **diagnosable**. It is not information; it is recognition.

## 2. The emotional premise (the real product)

The video does not sell new facts. It sells a **re-diagnosis of a painful ambiguity**:

> You feel something is wrong → you assume X → the truth is Y

Reference version: *"I'm failing / God left"* → **"God is transitioning me."**

The whole 19 minutes is one long act of **re-labelling**. That is why it holds attention. The viewer
is not learning about Moses; they are being told their confusion has a name.

**A strong premise must be:**
- Felt by the audience *this week*, not abstractly
- Commonly **misread** in one predictable direction
- Resolvable by scripture into something **hopeful and actionable**

## 3. Beat map (18:53)

| Time | Beat | Job |
| --- | --- | --- |
| 0:00–1:05 | **Cold open: the felt problem** | Name 4–5 concrete symptoms of their week. *"Same job, same conflict, same obstacles."* No scripture yet |
| 1:05–2:20 | **The trap / misdiagnosis** | "Here is a dangerous trap that catches millions." Names the wrong interpretation and its cost (panic, forcing doors, clinging) |
| 2:20–3:10 | **The thesis (the reframe)** | One sentence, said plainly: *"God almost always shifts your internal reality long before your external environment."* |
| 3:10–3:40 | **Promise of the payoff** | "Six signs... a practical blueprint." + channel welcome line |
| 3:40–15:30 | **Signs 1–6** (≈2 min each, identical shape — see §4) | The body |
| 15:30–17:40 | **The turn: what to do** | Moves from diagnosis to action. Prayer, surrender, "the next obedient step" |
| 17:40–18:53 | **Close + CTA** | Like / subscribe / share with "someone stuck in the waiting room" / comment **which sign** they're in |

### Pacing notes
- A new idea lands every **~40 seconds**.
- Music stings sit **under** transitions, never over a punchline — the transcript is peppered with
  marked music cues at every section boundary.
- Scripture is **always read aloud**, then immediately paraphrased into modern life. Never quoted and left.
- Speaking pace ≈ **150–165 wpm** (documentary pace), which the `cinematic-film` engine defaults to.

## 4. The sign block — the atomic unit

Every one of the six signs uses the same five-part shape. This is the engine of the video.

```
1. STATE THE SIGN          "Sign number two: relational shifts and unexplained distances."
2. NAME THE FELT SYMPTOM   "Friends who used to text you every day suddenly stop reaching out."
3. THE MISREADING          "Your flesh feels rejected, abandoned, deeply offended."
4. THE SCRIPTURE           "Look at Samuel in 1 Samuel 16..." (read the verse)
5. THE REFRAME + PRINCIPLE "Their departure isn't human rejection. It is divine protection."
```

The reframe is always delivered as a **swap**: *not A, but B.*

> "This isn't because they're bad people — it's because they don't have the spiritual equipment to
> travel to the altitude where God is taking you."
> "Their departure isn't an act of human rejection. It is an act of divine protection."

Copy that move. It is the single most quotable thing in the video and the reason people screenshot it.

### The six signs in the reference (for pattern only)

| # | Sign | Scripture | Reframe |
| --- | --- | --- | --- |
| 1 | Sudden discontent with what used to satisfy | Hebrews 11:24–25 | God is stirring the nest |
| 2 | Relational shifts, unexplained distance | 1 Samuel 16:1 | Divine protection, not rejection |
| 3 | Urge to prepare before provision arrives | 2 Kings 4:3–4 | Provision is limited by preparation |
| 4 | Usual strategies stop working | Luke 5:5–6 | God breaks self-reliance |
| 5 | Heightened spiritual warfare | Matthew 3:17–4:1 | Confirmation you're gaining ground |
| 6 | Peace that doesn't match the circumstances | Philippians 4:7 / Exodus 14:14 | Peace as anchor, not absence of chaos |

## 5. Voice and style rules

- **Second person, present tense.** "You are waking up to the same job."
- **Short sentences.** Average under 15 words. Fragments for impact: *"The environment is identical."*
- **Concrete over abstract.** Not "financial difficulty" but "every time you pull into the parking lot,
  you feel a heaviness in your chest."
- **Name the objection first.** "Your flesh will tell you, *you're just being ungrateful*."
- **Repeat the thesis** in sign 1, mid-video, and the close.
- **Never leave a verse unapplied.** Read → paraphrase → apply to a Tuesday.
- **One metaphor per sign**, sustained. (Eagle stirring the nest; empty jars; fishing nets.)

## 6. Packaging (what gets the click)

- **Thumbnail**: dark, high-contrast, 3–5 word text, one emotive image. Title text must be readable
  at 120px wide.
- **Description**: hook paragraph (3–4 short lines) → "📖 WHAT YOU'LL LEARN" checklist of ✔️ bullets →
  "✝️ KEY BIBLE VERSES COVERED" list with one-line glosses per verse. This is both SEO and a
  scannable proof-of-value.
- **Chapters**: cut on the sign boundaries, exactly matching the beat table.
- **End screen**: next video + subscribe.

## 7. Ethical guardrails for our version

The reference walks a line between pastoring and engagement-farming. Some lines ("God is about to
flood you with wealth", "this is confirmation you're gaining ground") are unfalsifiable. Hold these:

- **Every claim ties to a verse we can read.** No "God is telling you" without scripture.
- **No unnamed "season" promises** about money, spouses, or timelines.
- **Leave room for lament.** Not every hard thing is a promotion; some things are just hard, and
  scripture permits groaning (Romans 8:22–26).
- **Never diagnose a person's life for them.** Offer categories, invite discernment.
- **Credit and cite.** Every quotation gets a translation and a source in `verses.md`.

---

## 8. Build it in this repo

```bash
source scripts/activate-studio.sh

# 1. Scaffold the film
npm run film:new -- content/drafts/<slug> --title "<Title>"

# 2. Write script.md  (this file's §3 beat map is the skeleton)
# 3. Generate the beat table, then narration
python3 tools/cinematic-skill/skills/cinematic-film/scripts/make_beats.py --project content/drafts/<slug>
#    ...record/TTS the takes, then:
python3 tools/cinematic-skill/skills/cinematic-film/scripts/split_takes.py   --project content/drafts/<slug>
python3 tools/cinematic-skill/skills/cinematic-film/scripts/build_narration.py --project content/drafts/<slug>

# 4. Confirm the look with stills BEFORE the full render
python3 tools/cinematic-skill/skills/cinematic-film/scripts/render.py \
  --project content/drafts/<slug> --probe 5,20,45 --size 1920x1080

# 5. Full render
python3 tools/cinematic-skill/skills/cinematic-film/scripts/render.py \
  --project content/drafts/<slug> --size 1920x1080 \
  --out out/videos/<slug>.mp4 --audio content/drafts/<slug>/audio/mix.m4a

# 6. Thumbnail + companion short
npm run poster -- --title "<Hook>" --eyebrow "<CHANNEL>" --sub "<promise>" \
  --out out/graphics/<slug>-thumb --format wide
```
