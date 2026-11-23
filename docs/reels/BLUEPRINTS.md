# Blueprints — How the 8 TikToks map to your reels

All eight uploaded videos follow the same **aesthetic/mood-edit** formula. We encode it as 3 blueprints. Your `reels-config.json` picks one per reel via `blueprint`.

| Archetype | Source examples | Visual & pacing | Text | Blueprint |
|---|---|---|---|---|
| **A. POV / Aesthetic Transition** | Video 2 `@nhiancapturebeauty`, Video 4 `@d001122334455`, Video 5 `@all_afrohouse` | Single-take or slow-pan real scenes — rocks→beach sunset, night skyline across water, plane at dusk. Slow build then sharp cut/speed-ramp on bass drop. | Minimalist lowercase clean sans-serif, top or center | **Blueprint 1 — Aesthetic POV** |
| **B. Multi-Clip Lyric / Narrative Montage** | Video 3 `@cam.xlyrics` | 6–8 short clips (2–4s each): dirt bikes on purple twilight beach, roller-skating sunset, blue Ferris wheel, misty road. Cuts on musical phrases | Centered small white sans-serif + thin divider line underneath | **Blueprint 2 — Lyric Montage** |
| **C. Dark Minimalist Quote / Stoic Edit** | Video 6 `@itsmeeqo`, Video 7 `@mushinjournal`, Video 8 `@bull.priest.alpha` | High-contrast dark bg (night streets, textured grain, samurai silhouette). Static / ultra-slow 8–15s so viewer re-reads | Centered white bold contrast, hook + heavy bass/phonk/slowed-reverb | **Blueprint 3 — Dark Stoic** |
| **D. Slowed+Reverb Visualizer** | Video 1 `@akslowed16` | 3s hook (headphones → black) → static dark floral with pulsing graphic + timer | Clean title + `slowed reverb` subtitle center | Variant of B3 (use same bg, add pulsing) |

## Mapping to current reels

| Reel | Blueprint | Why |
|---|---|---|
| `wisdom-01-storm` (3m35s) | **B3 Dark Stoic** — long dark quote edit, centered-bold white over textured black, bass/phonk drop on “show you who calms it” | Long audio, stoic message — single dark vibe, text does the work |
| `wisdom-02-still` (2m05s) | **B3 Dark Stoic (samurai-quote variant)** — samurai serif, stillness theme | Meditative, slow, needs serif authority |
| `motivation-01-becoming` (48s) | **B2 Lyric Montage** — 4-beat motivational lines, each line = clip | Short, punchy — montage keeps retention |
| `motivation-02-rise` (24s) | **B1 Aesthetic POV** — single sunset/night-skyline push | Very short — one powerful POV beats 6 cuts |
| *Future lyric reels* | B2 | Add `pexelsQueries: [...]` per line to fetch matching vertical stock |

## Blueprint → Builder behavior

| Blueprint | `scripts/build-reels-ffmpeg.mjs` | Stock |
|---|---|---|
| B1 Aesthetic POV | 1–2 cards, long holds (½ duration each), slow zoom 1.0→1.04 + vignette + grain | 1–2 portrait clips: `night city skyline river reflection vertical 4k`, `sunset beach waves walking pov` |
| B2 Lyric Montage | N cards (one per bodyLine/headline), cuts on beats, divider line under text, grain+vignette | N portrait clips, one per line: `twilight beach dirt bikes`, `roller skating sunset`, etc. |
| B3 Dark Stoic | 1–3 cards on dark textured grain, centered-bold/samurai-quote, subtle pulsing on drop | Dark high-contrast stills: `night street rain vertical`, `samurai silhouette slow motion`, or solid `#080c14` + grain |

Anti-AI rules always on: no glossy 3D skin, no neon, no AI faces — handheld shake, dusk grain, 35mm, candid framing. All clips get same LUT (teal-orange dusk / purple-twilight / desaturated dark).

