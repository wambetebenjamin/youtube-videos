#!/usr/bin/env bash
set -euo pipefail

mkdir -p dist-web

if [ -n "${GDRIVE_SESSION_URI:-}" ]; then
  echo "=== Installing uv for fast isolated Python video pipeline ==="
  curl -LsSf https://astral.sh/uv/install.sh | sh
  export PATH="$HOME/.local/bin:$HOME/.cargo/bin:$PATH"

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
