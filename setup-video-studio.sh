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

echo "Setting up Git LFS for videos, images, and audio..."
if command -v git-lfs >/dev/null 2>&1 || git lfs version >/dev/null 2>&1; then
  git lfs install --skip-repo || true
  git lfs track "*.mp4" "*.mov" "*.mkv" "*.webm" "*.png" "*.jpg" "*.jpeg" "*.webp" "*.wav" "*.mp3" "*.m4a"
else
  echo "git-lfs binary not detected; keeping preconfigured .gitattributes LFS rules."
fi

echo "Creating studio folder structure..."
STUDIO_DIRS=(
  public/raw-footage public/pics public/fonts public/music
  templates/posters templates/ebooks
  content/drafts
  out out/videos out/graphics out/ebooks
  tools
)
mkdir -p "${STUDIO_DIRS[@]}"
for dir in public/raw-footage public/pics public/fonts public/music \
           templates/posters templates/ebooks \
           content/drafts \
           out/videos out/graphics out/ebooks; do
  touch "$dir/.gitkeep"
done
touch out/.gitkeep

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

echo "Cloning third-party studio tools into tools/ ..."
clone_tool() {
  local name="$1" url="$2"
  if [ -d "tools/$name/.git" ]; then
    echo "  tools/$name already cloned, skipping."
    return 0
  fi
  rm -rf "tools/$name"
  GIT_LFS_SKIP_SMUDGE=1 git clone --depth 1 "$url" "tools/$name" || \
    echo "  Warning: could not clone $name from $url"
}
mkdir -p tools
clone_tool poster-maker                 https://github.com/dabodamjan/poster-maker.git
clone_tool duduhaibao                   https://github.com/Shine8592/duduhaibao.git
clone_tool ebook-generator              https://github.com/RyanFitzgerald/ebook-generator.git
clone_tool markdown-to-pdf-book-converter https://github.com/romankurnovskii/markdown-to-pdf-book-converter.git
clone_tool claude-remotion-skill        https://github.com/haidrrrry/claude-remotion-skill.git
clone_tool herk-edit-kit                https://github.com/nateherkai/herk-edit-kit.git

echo "Installing Agent Skills (video, FFmpeg, posters)..."
install_skill() {
  npx -y skills add "$1" --yes </dev/null || \
    echo "  Warning: could not install skill $1"
}
install_skill remotion-dev/skills
install_skill Remocn/remocn
install_skill kajisho5/ffmpeg-skill
install_skill kajisho5/remotion-ffmpeg-skill
install_skill jiemianduan/poster-style-transfer
install_skill Chenruishuo/posterly

if [ ! -f "AGENTS.md" ]; then
  echo "Warning: AGENTS.md is missing; restore it from git (it is a tracked studio file)."
fi
if [ ! -f "CLAUDE.md" ] && [ -f "AGENTS.md" ]; then
  cp AGENTS.md CLAUDE.md
fi

echo ""
echo "=========================================================="
echo "AI Video / Poster / Ebook Studio setup complete!"
echo "  Node.js : $(node -v 2>/dev/null || echo 'not found')"
echo "  Python  : $(python3 --version 2>/dev/null || echo 'not found')"
FFMPEG_BIN="$(command -v ffmpeg || true)"
if [ -z "$FFMPEG_BIN" ] && [ -d node_modules/@ffmpeg-installer ]; then
  FFMPEG_BIN="$(node -e "process.stdout.write(require('@ffmpeg-installer/ffmpeg').path)" 2>/dev/null || true)"
fi
echo "  FFmpeg  : ${FFMPEG_BIN:-not found (run: apt-get install ffmpeg)}"
echo "  Tools   : $(ls tools 2>/dev/null | tr '\n' ' ')"
echo "  Skills  : $(ls .agents/skills 2>/dev/null | wc -l) installed"
echo ""
echo "Next steps:"
echo "  1. Video   : clips -> public/raw-footage/, photos -> public/pics/, then npm run dev"
echo "     Render  : npm run render:youtube  |  npm run render:reel   (saved to out/videos/)"
echo "  2. Posters : drop reference templates in templates/posters/   (export to out/graphics/)"
echo "  3. Ebooks  : drop raw text in content/drafts/, styles in templates/ebooks/ (export to out/ebooks/)"
echo "=========================================================="
