#!/usr/bin/env bash
set -euo pipefail

if [ -z "${NODE_EXTRA_CA_CERTS:-}" ] && [ -f "/etc/ssl/certs/ca-certificates.crt" ]; then
  export NODE_EXTRA_CA_CERTS="/etc/ssl/certs/ca-certificates.crt"
fi

install_system_packages() {
  if ! command -v apt-get >/dev/null 2>&1; then
    return 0
  fi

  local SUDO=""
  if [ "$(id -u)" -ne 0 ]; then
    if command -v sudo >/dev/null 2>&1 && sudo -n true 2>/dev/null; then
      SUDO="sudo"
    else
      echo "Skipping apt system package installation (no passwordless sudo available)."
      return 0
    fi
  fi

  echo "Installing FFmpeg, Python 3, Git LFS, fonts, and Remotion headless Chromium libraries..."
  if ! $SUDO apt-get update -y; then
    echo "Warning: apt-get update could not reach mirrors; skipping system package installation."
    return 0
  fi

  local ASOUND_PKG="libasound2"
  if apt-cache show libasound2t64 >/dev/null 2>&1; then
    ASOUND_PKG="libasound2t64"
  fi

  $SUDO DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
    ffmpeg \
    git-lfs \
    python3 \
    python3-pip \
    rclone \
    ca-certificates \
    curl \
    unzip \
    fonts-liberation \
    fonts-noto-color-emoji \
    libnss3 \
    libdbus-1-3 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libpango-1.0-0 \
    libcairo2 \
    "$ASOUND_PKG" || {
    echo "Warning: system apt package installation incomplete (mirrors unreachable in restricted network)."
    return 0
  }
}

install_system_packages

echo "Installing Google Drive CLI downloader (gdown)..."
python3 -m pip install --user --break-system-packages -q gdown 2>/dev/null \
  || python3 -m pip install --user -q gdown 2>/dev/null \
  || true

echo "Setting up Git LFS for videos, images, and audio..."
if command -v git-lfs >/dev/null 2>&1 || git lfs version >/dev/null 2>&1; then
  git lfs install --skip-repo || true
  git lfs track "*.mp4" "*.mov" "*.mkv" "*.webm" "*.png" "*.jpg" "*.jpeg" "*.webp" "*.wav" "*.mp3" "*.m4a"
else
  echo "git-lfs binary not detected; keeping preconfigured .gitattributes LFS rules."
fi

echo "Creating asset folders..."
mkdir -p public/raw-footage public/pics public/fonts public/music out
for dir in public/raw-footage public/pics public/fonts public/music out; do
  touch "$dir/.gitkeep"
done

echo "Initializing Remotion video engine (if not already present)..."
if [ ! -f "package.json" ]; then
  TMP_REMOTION_DIR="$(mktemp -d)"
  npx -y create-video@latest --yes --blank --tailwind "$TMP_REMOTION_DIR/app"
  rm -rf "$TMP_REMOTION_DIR/app/.git" "$TMP_REMOTION_DIR/app/README.md"
  cp -rn "$TMP_REMOTION_DIR/app/." .
  rm -rf "$TMP_REMOTION_DIR"
fi

echo "Installing npm dependencies..."
npm install

echo "Ensuring Remotion headless browser is ready..."
npx remotion browser ensure || true

echo "Installing Remotion & FFmpeg Agent Skills..."
npx -y skills@latest add remotion-dev/skills -a claude-code github-copilot cursor codex --copy -y || true
npx -y skills@latest add Remocn/remocn -a claude-code github-copilot cursor codex --copy -y || true
npx -y ffmpeg-skill@latest --project || true
npx -y ffmpeg-skill@latest --dir ./.agents/skills || true
npx -y remotion-ffmpeg-skill@latest --project || true
npx -y remotion-ffmpeg-skill@latest --dir ./.agents/skills || true

if [ ! -f "AGENTS.md" ]; then
  echo "Creating AI Agent Instructions (AGENTS.md)..."
  cat << 'EOF' > AGENTS.md
# AI Video Studio Instructions
- Always check `public/raw-footage/` and `public/pics/` for user-uploaded media.
- Use Remotion (`src/`) for motion graphics, animated captions, lower thirds, and transitions.
- Use FFmpeg for trimming silence, reframing 16:9 YouTube videos into 9:16 Reels, and audio normalization.
- Export all finished videos to the `out/` folder as `.mp4` (H.264, 1080p or 4K).
- Always render a preview frame or short test clip to verify typography and layout before final render.
EOF
fi

if [ ! -f "CLAUDE.md" ]; then
  cp AGENTS.md CLAUDE.md
fi

echo ""
echo "=========================================================="
echo "AI Video Studio setup complete!"
echo "  Node.js : $(node -v 2>/dev/null || echo 'not found')"
echo "  Python  : $(python3 --version 2>/dev/null || echo 'not found')"
echo "  FFmpeg  : $(ffmpeg -version 2>/dev/null | head -n 1 || echo 'installs automatically in Codespaces')"
echo ""
echo "Next steps:"
echo "  1. Upload photos to public/pics/ and clips to public/raw-footage/"
echo "  2. Preview in Remotion Studio: npm run dev"
echo "  3. Render YouTube (16:9):      npm run render:youtube"
echo "  4. Render Reel/Short (9:16):   npm run render:reel"
echo "=========================================================="
