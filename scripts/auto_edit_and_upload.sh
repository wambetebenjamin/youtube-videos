#!/usr/bin/env bash
set -euo pipefail

export PATH="$HOME/.local/bin:$PATH"

DRIVE_SOURCE="${1:-https://drive.google.com/file/d/1SA1KtYkXGz1LOtPnNjar7b4nJUmBS0rD/view?usp=sharing}"
DRIVE_DEST_FOLDER="${2:-AI-Video-Studio}"
INPUT_VIDEO="public/raw-footage/marketing.mp4"
OUTPUT_VIDEO="out/marketing-unique.mp4"

echo "=== [Step 1/4] Ensuring FFmpeg, fonts, Pillow & faster-whisper are installed ==="
if command -v apt-get >/dev/null 2>&1 && (! command -v ffmpeg >/dev/null 2>&1 || [ ! -f /usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf ]); then
  SUDO=""
  if [ "$(id -u)" -ne 0 ] && command -v sudo >/dev/null 2>&1; then
    SUDO="sudo"
  fi
  $SUDO apt-get update -y && $SUDO DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
    ffmpeg fonts-dejavu-core python3-pip rclone || true
fi

python3 -m pip install --user --break-system-packages -q gdown Pillow faster-whisper 2>/dev/null \
  || python3 -m pip install --user -q gdown Pillow faster-whisper

echo "=== [Step 2/4] Checking source video ($INPUT_VIDEO) ==="
mkdir -p public/raw-footage out
if [ ! -s "$INPUT_VIDEO" ]; then
  python3 -m gdown --continue "$DRIVE_SOURCE" -O "$INPUT_VIDEO"
fi
ls -lh "$INPUT_VIDEO"

echo "=== [Step 3/4] Running Automated Unique Studio Edit ==="
python3 scripts/make_unique_edit.py "$INPUT_VIDEO" "$OUTPUT_VIDEO"
ls -lh "$OUTPUT_VIDEO"

echo "=== [Step 4/4] Uploading '$OUTPUT_VIDEO' to Google Drive & generating link ==="
bash scripts/gdrive.sh push "$OUTPUT_VIDEO" "$DRIVE_DEST_FOLDER"
