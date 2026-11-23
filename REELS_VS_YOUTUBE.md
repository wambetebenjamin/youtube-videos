# Reels vs YouTube — Separation Contract

**Rule: They never share a folder, composition, or Drive upload.**

|  | YouTube (horizontal) | Social Reels (vertical) |
|---|---|---|
| **Composition IDs** | `YouTubeVideo`, `AbbasStories`, `PeaceBeStillV6` | `SocialReelWisdom`, `SocialReelMotivation` (both use `SocialReel.tsx`) |
| **Dimensions** | 1920×1080, 30fps, 14m30s for Peace Be Still | 1080×1920, 30fps, **≥60s (≥1800 frames)** |
| **Source separation** | `public/youtube/raw/` + `public/raw-footage/` | `public/reels/{raw,slides,music}/` — **never** put YouTube footage in reels raw |
| **Output separation** | `out/youtube/` | `out/reels/` (`out/*.mp4` is gitignored; subfolders keep them distinct) |
| **Drive separation** | Existing: `1dCzAYOqa6dihXSaJO2KFaTRVfHYuzcH2` (Abbas Stories) | New folder to create: `Social Media Reels — Wisdom + Motivation (9:16)` — create via `scripts/build-social-reels.mjs --create-drive-folder` or manually |
| **Design** | Reference: W4iVXGBuQlQ warm grade, lower-thirds, ProgressBar bottom | Replicates uploaded TikTok *structure* (hook badge → caption cues → closing card) but different palette, top progress bar, AI slides, no people-mids |
| **Footage rule** | Raw sermons, scripture lower-thirds | **No mids with identifiable other people** — use new stock (Pexels/Pixabay licensed) or AI slides with transitions. The 10 TikToks in `reels-reference/` are *reference only*, not source |
| **Music** | 871s cinematic bed (piano+strings) or sparse stabs | Per-reel track in `public/reels/music/`. If track <60s, render to current length and log `need full song` — fetch online when license allows (see `content/reels/reels-config.json`) |

## Building

```bash
# YouTube (unchanged)
npx remotion render PeaceBeStillV6 out/youtube/peace-be-still.mp4

# Reels (new)
node scripts/build-social-reels.mjs   # reads content/reels/reels-config.json
# — auto-handles music duration: extends picture if song >60s, warns if <60s
# — AI slides come from Blender MCP (scripts/blender/*.py) or direct images in public/reels/slides/
```

## Uploaded TikToks on GitHub (reference only)

10 mp4s are now in `reels-reference/` (pulled from `origin/main`, 58 MB total, gitignored locally):
`1000853322.mp4` (18s HEVC 576×1024) … `ssstik.io_…mp4` (6s 1080×1920)
**Do not** cut their middles for reels with other people. Use new footage/AI slides as above.
