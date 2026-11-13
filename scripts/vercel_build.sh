#!/usr/bin/env bash
# Vercel build entrypoint for the AI Video Studio cloud render.
#
# When GDRIVE_SESSION_URI is present this build behaves like a render worker:
#   download source -> unique portrait edit -> stream finished master to Google Drive
# Otherwise it emits a small static status page so normal deploys stay cheap.
set -euo pipefail

mkdir -p dist-web

if [ -z "${GDRIVE_SESSION_URI:-}" ] && [ -z "${VERIFY_DRIVE_ID:-}" ]; then
  cat << 'EOF' > dist-web/index.html
<!doctype html>
<html><head><meta charset="utf-8"><title>AI Video Studio</title></head>
<body style="background:#060913;color:#f8fafc;font-family:sans-serif;display:grid;place-items:center;min-height:100vh;margin:0">
  <h1>AI Video Studio Ready</h1>
</body></html>
EOF
  exit 0
fi

echo "=== Installing uv (isolated Python toolchain) ==="
curl -LsSf https://astral.sh/uv/install.sh | sh
export PATH="$HOME/.local/bin:$HOME/.cargo/bin:$PATH"
export UV_PYTHON_DOWNLOADS=automatic
uv python install 3.12 >/dev/null 2>&1 || true

echo "=== FFmpeg selection is handled by the pipeline (imageio-ffmpeg bundles libass) ==="

echo "=== Selecting a Python 3 interpreter for the pipeline ==="
PY_TARGET=""
for candidate in 3.12 3.11 3.13 3.10 3; do
  if uv run --no-project --python "$candidate" python -c "import sys" >/dev/null 2>&1; then
    PY_TARGET="$candidate"
    break
  fi
done

if [ -z "$PY_TARGET" ]; then
  echo "No usable Python 3 interpreter found." >&2
  exit 1
fi
echo "Using Python $PY_TARGET"

if [ -n "${VERIFY_DRIVE_ID:-}" ]; then
  echo "=== Verification pass: inspecting uploaded Drive file $VERIFY_DRIVE_ID ==="
  uv run --no-project --python "$PY_TARGET" \
    --with gdown --with imageio-ffmpeg \
    python -u scripts/vercel_render_and_upload.py
  exit 0
fi

echo "=== Running render + Google Drive upload pipeline ==="
uv run \
  --no-project \
  --python "$PY_TARGET" \
  --with gdown \
  --with imageio-ffmpeg \
  --with Pillow \
  --with faster-whisper \
  python -u scripts/vercel_render_and_upload.py
