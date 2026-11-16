# Pruning Is Not Punishment

A complete long-form Bible teaching built on the formula in
`content/drafts/_formula/bible-teaching-formula.md`.

| File | What it is |
| --- | --- |
| `script.md` | The readable teaching — 5 marks of pruning, with the turn and close |
| `script.json` | The same material as engine narration lines (136 lines, 10 takes) |
| `beats.md` | Beat table from `make_beats.py` — **0 lint warnings** |
| `scene.py` | The film: one camera over one world, five mark cards + a thesis card |
| `verses.md` | Every scripture, verified against WEB (public domain) |
| `packaging.md` | Title options, description, chapters, 3 short-form cut-downs |
| `audio/timing.json` | Line timings used by the beat table |

## Status

- ✅ Script written and linted clean
- ✅ `scene.py` builds; probe stills verified at 1080p
- ✅ 20s draft rendered: `out/videos/pruning-not-punishment-draft20s.mp4` (H.264 1080p30 + AAC)
- ✅ Thumbnail rendered: `out/graphics/pruning-not-punishment-thumb.png`
- ⚠️ **Audio is a placeholder.** `narration.m4a` was synthesized as a sine tone at the scripted
  line lengths purely to exercise the render chain — it is not a voice. Delete it and record a real
  read (or use a TTS) before rendering the final.

## Getting to a finished video

```bash
source scripts/activate-studio.sh

# 1. Real voiceover. Either record one WAV per take into audio/takes/,
#    or point tts_say.py at any command-line TTS:
python3 tools/cinematic-skill/skills/cinematic-film/scripts/tts_say.py \
  --project content/drafts/pruning-not-punishment --cmd '<your tts> -f {out} < {txt}'
python3 tools/cinematic-skill/skills/cinematic-film/scripts/split_takes.py \
  --project content/drafts/pruning-not-punishment
python3 tools/cinematic-skill/skills/cinematic-film/scripts/build_narration.py \
  --project content/drafts/pruning-not-punishment

# 2. Check the look on stills BEFORE spending render time
python3 tools/cinematic-skill/skills/cinematic-film/scripts/render.py \
  --project content/drafts/pruning-not-punishment --probe 8,166,305,473 --size 1920x1080

# 3. Sound effects, then the mix
python3 tools/cinematic-skill/skills/cinematic-film/scripts/render.py \
  --project content/drafts/pruning-not-punishment --cues
python3 tools/cinematic-skill/skills/cinematic-film/scripts/build_sfx.py \
  --project content/drafts/pruning-not-punishment
python3 tools/cinematic-skill/skills/cinematic-film/scripts/mix_soundtrack.py \
  --project content/drafts/pruning-not-punishment

# 4. Full render (about 2.3 fps/worker at 1080p — ~10 min of film ≈ 2.5 h on 2 workers)
python3 tools/cinematic-skill/skills/cinematic-film/scripts/render.py \
  --project content/drafts/pruning-not-punishment --size 1920x1080 \
  --out out/videos/pruning-not-punishment.mp4 \
  --audio "$PWD/content/drafts/pruning-not-punishment/audio/mix.m4a" --workers 4

# 5. Burn captions and write an SRT
python3 tools/cinematic-skill/skills/cinematic-film/scripts/burn_captions.py \
  --project content/drafts/pruning-not-punishment
```
