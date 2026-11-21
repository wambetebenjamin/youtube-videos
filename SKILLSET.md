# Skillset Analysis — Cloned External Repositories

## Overview
Explored and cloned two external video-generation skill repositories referenced via Facebook redirect links:

- **FlashML-org/FreeVideo** — https://github.com/FlashML-org/FreeVideo
- **talsiach/take-one** — https://github.com/talsiach/take-one

Both clones are available locally under `/tmp/freevideo` and `/tmp/take-one` and vendored reference docs under `skills/` for offline use.

---

## 1) FlashML-org/FreeVideo (MiniMax H3 Local Engine)

**What it is:** Local inference engine for MiniMax H3 (8-step VDN-H3 via Video DeltaNet) on consumer GPUs (8 GB VRAM + 16 GB RAM minimum). Hardware-adaptive execution: picks int8 vs FP8 weight format, attention backend (SageAttention2 → FlashAttention etc.), residency of 50 transformer blocks across VRAM/host/disk, with streaming/prefetch/chunking.

**News (Nov 2026):**
- v0.5.0 H3 Image (16 MP stills on 8 GB VRAM)
- v0.4.0 agent + minute-long videos + timeline edit view
- v0.3.x int8 faster model, preview-first workflow, 4 quality levels (Light/Medium/High/Max)
- ComfyUI plugin + Windows/macOS/Linux launchers
- Community LoRAs, workflow-embedded videos (drop video onto ComfyUI canvas to restore prompt/seed)

**What we can use in this Remotion studio (even without GPU):**

| Capability | How we use it |
|---|---|
| **Text→Video / Image→Video / First+Last Frame / Video+Audio reference** | Generate B-roll hero clips (wilderness, desert, scrolls, doors) for the Abbas edit when a GPU is available; otherwise reuse prompt templates offline |
| **Prompt planning & `freevideo plan --vram-gib 8 --ram-gib 16`** | Estimate feasibility before requesting generation (blocked safely, no model load) |
| **Prompt enhancement + 4 quality levels + preview-first** | Iterate cheap (Light/preview) then finish only keepers (High/Max) |
| **Adaptive Execution Planner** | Understand VRAM/host budgets if we deploy on a 8-32 GB runner; logs to `*.request.json` + `resource-history.sqlite3` |
| **ComfyUI templates (Browse Templates → FreeVideo → All-in-One)** | Node-graph reference for chaining FreeVideo nodes with LoRA / upscaler |
| **Agent SDK (`freevideo_engine/agent/*`)** | Programmatic video generation from our Remotion/Node pipeline: `from freevideo_engine.agent import ...` — see `/tmp/freevideo/freevideo_engine/agent/` |
| **Offline install packs + `freevideo generate --prompt-file`** | CI/CD generation on headless Linux server |

**Limitations here (Codespace has no GPU):** No live `MiniMax H3` renders. We simulate B-roll with Remotion gradients + procedural stills, and keep prompt files ready for a GPU runner (`freevideo` CLI).

**Vendored docs:** `skills/freevideo/` (README, execution-planning.md, community LoRA docs) copied from `/tmp/freevideo`.

---

## 2) talsiach/take-one (Claude Code Skill — Code-Rendered Films)

**What it is:** A single Claude Code skill that turns one line into a finished short film rendered *from code*: a web page is a pure function of `t`, headless Chrome captures frames, ffmpeg muxes MP4. Proven pipeline behind viral Opus 5.5 videos on X. 12 named jobs (strategist … social copywriter) run in one session; fresh reviewer scores each export 1-10, bar = 8, max 3 rounds.

**Core workflow we adopt:**
1. **Brief** — subject, audience/platform (sets length/aspect), assets, brand pack (real fonts/colors/logo from live site)
2. **Look** — brand-derived or gallery style (20+ style recipes in `references/styles/*.md` — watercolor, dark-premium, editorial-HUD, etc.)
3. **Pitch** — one idea + timed words (2 words/sec) + storyboard (time/what happens/read/on-screen words/transition) + 3 routes (code-only / code+pictures / code+pictures+moving shots) with real prices
4. **Build** — shot-by-shot, music + beat map first, springs only (no linear), shared-element handoffs, flood circles
5. **Review** — contact sheet at 360 px + full frames + strips around fast moves + `quality-checklist.md` rubric + fresh reviewer (`reviewer-brief.md`)
6. **Render + sound** — 1920×1080 60fps, `SUB=8` motion blur for smooth styles, `audio-check.mjs` (-14 LUFS, -1 dBTP)
7. **Deliver** — MP4 + `POSTS.md` + review room (click frame → note)

**What we can use directly in this repo:**

| Asset | Location | Use |
|---|---|---|
| `SKILL.md` (main prompt) | `/tmp/take-one/SKILL.md` | Master control flow for any Abbas edit |
| `references/timing.md` (spring presets, reads per shot) | `skills/take-one/references/timing.md` | Drive every camera/zoom/beat punch in Remotion |
| `references/motion-kit.md` (log-space zooms, beat punches, shared-element, flood) | `skills/take-one/references/motion-kit.md` | Implement `zoom()` and `punch()` correctly |
| `references/quality-checklist.md` | `skills/take-one/references/quality-checklist.md` | Pre-export gate (phone legibility, face not covered, etc.) |
| `references/audio.md` + `references/music-engine.md` | `skills/take-one/references/audio.md` | Music beds: Suno prompt vs `scripts/music.mjs` code engine |
| `references/words.md` + `references/voice.md` | `skills/take-one/references/words.md` | Write & time every spoken/on-screen line |
| `references/brand-brief.md` + `references/brand-pass.md` | `skills/take-one/references/brand-brief.md` | Brand pack audit (real palette/fonts/logo) |
| `scripts/*` (doctor, frames.mjs, export.mjs, gate.mjs, text-audit.mjs, plate-audit.mjs, audit-faces.mjs, render-parallel.sh, mux-audio.sh, music.mjs) | `skills/take-one/scripts/` | Copy into our `scripts/` for local QA |
| 20 style recipes | `skills/take-one/references/styles/*.md` | Pick look for Abbas (we chose **dark-premium + ink-wash** hybrid for spiritual tone) |

**Vendored docs:** `skills/take-one/` (SKILL.md + references/ + scripts/) — see `/tmp/take-one`.

---

## How Both Skills Combine for “Abbas Stories”

- **Remotion = primary renderer** (TAKE ONE model: page(t) → Chrome → FFmpeg). This works today in Codespaces — no GPU needed, deterministic, 60 fps, H.264 + faststart.
- **FreeVideo = B-roll generator** (when GPU present): produce 5-10 s hero clips (desert road, ancient scroll, stone tablets, sunrise, hands reaching) via MiniMax H3 prompts stored in `public/raw-footage/prompts/`; otherwise we keep code-drawn B-roll and swap in real clips later without re-editing.
- **TAKE ONE quality gates** = our definition of done: stills gate → text-audit → plate-audit → face-audit → fresh reviewer (or self-review with rubric) before any MP4 is shown.

> Result: a **hybrid studio** — code does type/motion/structure, model does photoreal hero moments, same timeline, same grade, same review bar.
