#!/usr/bin/env bash
# Vercel build entrypoint for the AI Video Studio cloud render.
#
# When GDRIVE_SESSION_URI is present this build behaves like a render worker:
#   download source -> unique portrait edit -> stream finished master to Google Drive
# Otherwise it emits a small static status page so normal deploys stay cheap.
set -euo pipefail

mkdir -p dist-web

if [ -n "${GDRIVE_SESSION_URI:-}" ]; then
  echo "=== Installing uv (isolated Python toolchain) ==="
  curl -LsSf https://astral.sh/uv/install.sh | sh
  export PATH="$HOME/.local/bin:$HOME/.cargo/bin:$PATH"

  echo "=== Installing FFmpeg build with libass (Vercel image has none) ==="
  if ! ffmpeg -hide_banner -filters 2>/dev/null | grep -qw "ass"; then
    mkdir -p /tmp/ffmpeg-static
    curl -fsSL -o /tmp/ffmpeg-static/ffmpeg.tar.xz \
      https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz
    tar -xJf /tmp/ffmpeg-static/ffmpeg.tar.xz -C /tmp/ffmpeg-static --strip-components=1
    export PATH="/tmp/ffmpeg-static:$PATH"
  fi
  ffmpeg -hide_banner -version | head -n 1
  ffmpeg -hide_banner -filters 2>/dev/null | grep -qw "ass" \
    && echo "libass subtitles filter: available" \
    || echo "libass subtitles filter: unavailable (captions will be skipped)"

  echo "=== Running render + Google Drive upload pipeline ==="
  uv run \
    --python 3.11 \
    --with gdown \
    --with imageio-ffmpeg \
    --with Pillow \
    --with faster-whisper \
    python scripts/vercel_render_and_upload.py
else
  cat << 'EOF' > dist-web/index.html
<!doctype html>
<html><head><meta charset="utf-8"><title>AI Video Studio</title></head>
<body style="background:#060913;color:#f8fafc;font-family:sans-serif;display:grid;place-items:center;min-height:100vh;margin:0">
  <h1>AI Video Studio Ready</h1>
</body></html>
EOF
fi
