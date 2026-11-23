#!/usr/bin/env bash
set -e
ROOT="$(cd "$(dirname "$0")/../.."; pwd)"
DEST="$ROOT/references/viral-toolkit"
mkdir -p "$DEST"
clone_or_pull() { url="$1"; name="$2"; if [ -d "$DEST/$name/.git" ]; then echo "↻ pull $name"; git -C "$DEST/$name" pull --ff-only; else echo "→ clone $name"; git clone --depth 1 "$url" "$DEST/$name"; fi; }
clone_or_pull https://github.com/SamurAIGPT/open-ai-video-agent open-ai-video-agent
clone_or_pull https://github.com/gyoridavid/short-video-maker short-video-maker
clone_or_pull https://github.com/Chamanrajragu/purffle-shorts purffle-shorts
clone_or_pull https://github.com/andrewpeterson-dev/TikTokUploadManager TikTokUploadManager
clone_or_pull https://github.com/OnlineSolutionsGroupBV/Video-Creation-Automation-Scripts Video-Creation-Automation-Scripts
echo "✓ toolkit in $DEST (gitignored, not committed)"
