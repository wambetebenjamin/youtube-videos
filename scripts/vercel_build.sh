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

has_ass_filter() {
  command -v ffmpeg >/dev/null 2>&1 || return 1
  ffmpeg -hide_banner -filters 2>/dev/null | grep -qw "ass"
}

install_ffmpeg_with_ass() {
  local dest=/tmp/ffmpeg-static
  mkdir -p "$dest"

  # BtbN's gpl builds bundle libass (needed for the burn-in captions filter).
  echo "=== Fetching BtbN FFmpeg build (libass enabled) ==="
  if curl -fsSL --retry 3 --max-time 600 -o "$dest/ffmpeg.tar.xz" \
    https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-linux64-gpl.tar.xz; then
    tar -xJf "$dest/ffmpeg.tar.xz" -C "$dest" --strip-components=1 && \
      export PATH="$dest/bin:$PATH"
  fi

  if ! has_ass_filter; then
    echo "=== Falling back to johnvansickle static build ==="
    if curl -fsSL --retry 3 --max-time 600 -o "$dest/jvs.tar.xz" \
      https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz; then
      mkdir -p "$dest/jvs" && tar -xJf "$dest/jvs.tar.xz" -C "$dest/jvs" --strip-components=1 && \
        export PATH="$dest/jvs:$PATH"
    fi
  fi
}

if ! has_ass_filter; then
  install_ffmpeg_with_ass
fi

ffmpeg -hide_banner -version | head -n 1
if has_ass_filter; then
  echo "libass subtitles filter: available (burned-in karaoke captions enabled)"
else
  echo "libass subtitles filter: unavailable (captions will be skipped)"
fi

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
