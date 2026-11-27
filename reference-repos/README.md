# External video-automation reference repositories

Last updated 2026-11-27 14:29 UTC.

There are 18 local reference clones under `reference-repos/<owner>/<repo>/`. All are shallow,
single-branch clones of the latest default branch. To keep the workspace light:

- `MendesCorporation/ai-promo-video` is a blob-filtered partial clone with a sparse checkout that omits large example MP4 renders.
- Every second-batch repository is a blob-filtered partial clone with a sparse checkout that omits common large media, archive, font, and binary assets; source, docs, JSON registries, and text files are retained.
- Git LFS smudging was skipped. No submodules were fetched.
- These directories are intentionally excluded from this repository by `.gitignore`; only this inventory README is tracked.

Name-only entries were resolved as follows: **Opus Motion Library** → `GovinduSasanka/opus-motion-library`; **Remotion Templates** → `ali-abassi/remotion-templates`; **Remotion Captions Themes** → `vshukla7/remotion-captions-themes`.

## Batch 1 — AI promo / Adobe automation

| Repository | Status | Local path | Default branch | Commit | GitHub size | Local size |
|---|---|---|---|---|---:|---:|
| [`MendesCorporation/ai-promo-video`](https://github.com/MendesCorporation/ai-promo-video) | cloned | `reference-repos/MendesCorporation/ai-promo-video/` | `main` | `91e43c7` | 59206 KB | 2.4M |
| [`creatify-ai/video-ad-generator`](https://github.com/creatify-ai/video-ad-generator) | cloned | `reference-repos/creatify-ai/video-ad-generator/` | `main` | `d35e249` | 21 KB | 151K |
| [`ayushozha/AdobePremiereProMCP`](https://github.com/ayushozha/AdobePremiereProMCP) | cloned | `reference-repos/ayushozha/AdobePremiereProMCP/` | `main` | `36574e4` | 24432 KB | 7.3M |
| [`jhd3197/after-effects-automation`](https://github.com/jhd3197/after-effects-automation) | cloned | `reference-repos/jhd3197/after-effects-automation/` | `main` | `52711aa` | 627 KB | 2.2M |
| [`SailorClippers/Adobe-After-Effects-Motion-Graphics-Templates`](https://github.com/SailorClippers/Adobe-After-Effects-Motion-Graphics-Templates) | cloned | `reference-repos/SailorClippers/Adobe-After-Effects-Motion-Graphics-Templates/` | `main` | `01e4d77` | 4 KB | 115K |
| [`inlife/nexrender`](https://github.com/inlife/nexrender) | cloned | `reference-repos/inlife/nexrender/` | `master` | `79b6789` | 8420 KB | 8.6M |

## Batch 2 — editors, motion libraries, captions

| Repository | Status | Local path | Default branch | Commit | GitHub size | Local size |
|---|---|---|---|---|---:|---:|
| [`0xsline/OpenChatCut`](https://github.com/0xsline/OpenChatCut) | cloned | `reference-repos/0xsline/OpenChatCut/` | `main` | `f96502a` | 122649 KB | 47M |
| [`jub0t/Concat`](https://github.com/jub0t/Concat) | cloned | `reference-repos/jub0t/Concat/` | `main` | `22dcbdc` | 100102 KB | 41M |
| [`frankShan001/CutVoke`](https://github.com/frankShan001/CutVoke) | cloned | `reference-repos/frankShan001/CutVoke/` | `main` | `289b610` | 226585 KB | 41M |
| [`CutWire-Studios/Drift`](https://github.com/CutWire-Studios/Drift) | cloned | `reference-repos/CutWire-Studios/Drift/` | `main` | `30e7602` | 122734 KB | 74M |
| [`GovinduSasanka/opus-motion-library`](https://github.com/GovinduSasanka/opus-motion-library) | cloned | `reference-repos/GovinduSasanka/opus-motion-library/` | `main` | `7bde15a` | 96798 KB | 31M |
| [`ali-abassi/remotion-templates`](https://github.com/ali-abassi/remotion-templates) | cloned | `reference-repos/ali-abassi/remotion-templates/` | `main` | `6430d42` | 352728 KB | 17M |
| [`haidrrrry/claude-remotion-skill`](https://github.com/haidrrrry/claude-remotion-skill) | cloned | `reference-repos/haidrrrry/claude-remotion-skill/` | `main` | `1dcbe5e` | 14826 KB | 369K |
| [`itsPremkumar/Automated-Video-Generator`](https://github.com/itsPremkumar/Automated-Video-Generator) | cloned | `reference-repos/itsPremkumar/Automated-Video-Generator/` | `main` | `68db464` | 79592 KB | 12M |
| [`iart-ai/lower-thirds-skills`](https://github.com/iart-ai/lower-thirds-skills) | cloned | `reference-repos/iart-ai/lower-thirds-skills/` | `main` | `58d3623` | 1072 KB | 261K |
| [`noeal-dac/Animated-Lower-Thirds`](https://github.com/noeal-dac/Animated-Lower-Thirds) | cloned | `reference-repos/noeal-dac/Animated-Lower-Thirds/` | `master` | `8bb3ff9` | 1742 KB | 1.4M |
| [`nicolaigaina/ai-video-captions`](https://github.com/nicolaigaina/ai-video-captions) | cloned | `reference-repos/nicolaigaina/ai-video-captions/` | `main` | `bd87ac7` | 1788 KB | 1.1M |
| [`vshukla7/remotion-captions-themes`](https://github.com/vshukla7/remotion-captions-themes) | cloned | `reference-repos/vshukla7/remotion-captions-themes/` | `main` | `a8de474` | 5151 KB | 477K |

## Restore omitted large assets

For any partial/sparse clone, materialize the omitted blobs with:

```bash
git -C reference-repos/<owner>/<repo> sparse-checkout disable
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
