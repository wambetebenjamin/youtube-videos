# Reels Toolkit

**Agent prompt:** `docs/reels/AGENT_PROMPT.md` — paste into agent orchestrator.
**Blueprints:** `docs/reels/BLUEPRINTS.md` — archetypes A/B/C/D mapping to 8 TikToks.
**Stock:** `docs/reels/STOCK_SOURCES.md`

## Scripts

| Script | What |
|---|---|
| `clone-toolkit.sh` | Shallow-clone 5 OSS repos to `references/viral-toolkit/` (gitignored) |
| `analyze-beats.mjs` / `analyze_beats.py` | Beat/drop detection: JS energy fallback, or `pip install librosa` for true BPM |
| `fetch-pexels.mjs` | Real portrait stock: `PEXELS_API_KEY=xxx node fetch-pexels.mjs "vertical night city ... 4k" --out public/reels/raw/` |
| `generate-photoreal.mjs` | Anti-AI prompt builder for fallback stills (`buildPrompt()`) |
| `../build-reels-ffmpeg.mjs` | FFmpeg assembly: grain+vignette, beat-synced cuts, -14 LUFS, 1080x1920 H264 |

## Blueprints in reels-config.json

Add to each reel:
```json
{
  "blueprint": "B1" | "B2" | "B3",
  "pexelsQueries": ["vertical night city skyline river reflection 4k", "..."],
  "lut": "teal-orange-dusk" | "purple-twilight" | "desaturated-dark"
}
```
Builder auto-applies: B1=1–2 long holds + slow zoom, B2=N cuts on beats + divider line, B3=dark grain + pulsing.

## Pexels key

Get free key at https://www.pexels.com/api/ — set `PEXELS_API_KEY` env. Without it, builder uses existing dark cards (no AI look).
