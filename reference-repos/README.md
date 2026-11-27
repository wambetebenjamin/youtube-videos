# External video-automation reference repositories

Cloned locally on 2026-11-27 14:08 UTC.

All six are shallow, single-branch clones of the latest default branch for local reference only.
`MendesCorporation/ai-promo-video` is additionally blob-filtered with a sparse checkout that omits
large example MP4 renders; its source, docs, and project files are present. The remaining clones
contain their normal working trees. Git LFS smudging was skipped.

These directories are intentionally excluded from this repository by `.gitignore`; only this
inventory README is tracked.

| Repository | Status | Local path | Default branch | Commit | GitHub size | Local size |
|---|---|---|---|---|---:|---:|
| `MendesCorporation/ai-promo-video` | cloned | `reference-repos/MendesCorporation/ai-promo-video/` | `main` | `91e43c7` | 59206 KB | 2.4M |
| `creatify-ai/video-ad-generator` | cloned | `reference-repos/creatify-ai/video-ad-generator/` | `main` | `d35e249` | 21 KB | 151K |
| `ayushozha/AdobePremiereProMCP` | cloned | `reference-repos/ayushozha/AdobePremiereProMCP/` | `main` | `36574e4` | 24432 KB | 7.3M |
| `jhd3197/after-effects-automation` | cloned | `reference-repos/jhd3197/after-effects-automation/` | `main` | `52711aa` | 627 KB | 2.2M |
| `SailorClippers/Adobe-After-Effects-Motion-Graphics-Templates` | cloned | `reference-repos/SailorClippers/Adobe-After-Effects-Motion-Graphics-Templates/` | `main` | `01e4d77` | 4 KB | 115K |
| `inlife/nexrender` | cloned | `reference-repos/inlife/nexrender/` | `master` | `79b6789` | 8420 KB | 8.6M |

## Restore the omitted example videos

```bash
git -C reference-repos/MendesCorporation/ai-promo-video sparse-checkout disable
```

## Update commands

From this repository root:

```bash
for d in reference-repos/*/*; do git -C "$d" pull --ff-only; done
```

To convert a shallow clone to a full-history clone:

```bash
git -C reference-repos/<owner>/<repo> fetch --unshallow
```
