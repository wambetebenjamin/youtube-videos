# Build 8K 15-minute Master — One Command

This repo can render true 7680×4320 8K from images + voice + music.

## Quick build (local or GitHub runner)

```bash
# 1. Generate voice (after you pick voice below) — auto-splits
node scripts/build-youtube-tts.mjs --script docs/abbas-table-psalm42-15min/Script-8K-Psalm42.5.md

# 2. Render 8K video (7680x4320, 30fps, 15:30)
node scripts/build-youtube-VIDEO-bg.mjs --config content/youtube/abbas-table-psalm42.json --8k

# Output: out/youtube/abbas-table-psalm42-15min-8K.mp4 (8K h.264, AAC, -14 LUFS)
# Thumbnail: out/youtube/abbas-table-thumb-8k.jpg
```

Config template at `content/youtube/abbas-table-psalm42.json`:
```json
{
  "id": "abbas-table-psalm42",
  "title": "When Your Soul Is Downcast — Psalm 42:5",
  "width": 7680, "height": 4320, "fps": 30,
  "voice": "out/youtube/voice/*.mp3",
  "music": "public/reels/music/1000853416.mp3",
  "broll": "public/reels/raw/dataset-*.mp4",
  "script": "docs/abbas-table-psalm42-15min/Script-8K-Psalm42.5.md"
}
```

## YouTube upload
- Upload `out/youtube/abbas-table-psalm42-15min-8K.mp4` as Unlisted → check 8K processing → add description + chapters → thumbnail → Publish.
- YouTube will downscale to 4K/1080p automatically; 8K master future-proofs.
