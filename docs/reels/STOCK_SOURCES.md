# Stock & Generation Sources

**Priority 1 — Real footage (no AI look):**
- Pexels `orientation=portrait` `size=large` — `scripts/reels/fetch-pexels.mjs` (needs `PEXELS_API_KEY` env)
- Pixabay vertical video, Unsplash portrait
- Queries must be grounded: `vertical night city skyline river reflection 4k`, `sunset beach waves walking pov`, `misty forest road walking back view`

**Priority 2 — Generate only if no stock matches:**
- Prompt constraints from AGENT_PROMPT Step 3 + anti-AI prompt in `scripts/reels/generate-photoreal.mjs`
- Save to `public/reels/slides/` (tracked) or `public/reels/raw/` (video). Never commit `public/reels/slides/hdri/` (gitignored).

**Toolkit repos (cloned to `references/viral-toolkit/`):**
- `SamurAIGPT/open-ai-video-agent` — AGENTS.md playbook for planning/shots/consistency
- `gyoridavid/short-video-maker` — Remotion MCP + Pexels stock fetcher
- `Chamanrajragu/purffle-shorts` — Python faceless/MCP, Pexels + captions, 9:16
- `andrewpeterson-dev/TikTokUploadManager` — Cinematic FFmpeg pipeline (grain/vignette/color)
- `OnlineSolutionsGroupBV/Video-Creation-Automation-Scripts` — MoviePy concat/text/audio utils
- Python libs: `librosa` (beat detection), `pexels_api` / `pypexels`

See `scripts/reels/README.md` for commands.
