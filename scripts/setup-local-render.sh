#!/usr/bin/env bash
# Recreate the fully offline youth-camp rendering toolchain after a fresh checkout.
# All downloads come from PyPI, npm or GitHub hosts that this workspace can reach.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

mkdir -p \
  .cache/pydeps \
  .cache/npm-models \
  .cache/models/whisper-small-ct2 \
  .cache/chromium-libs \
  public/edit \
  out

echo "Installing local media, ASR and image dependencies"
python3 -m pip install --disable-pip-version-check --no-input --target .cache/pydeps \
  imageio-ffmpeg \
  faster-whisper \
  pillow \
  opencv-python-headless \
  soundfile \
  brotli \
  requests

echo "Installing npm dependencies"
npm ci --no-audit --no-fund

echo "Downloading split Whisper small int8 model packages from npm"
for i in 0 1 2 3; do
  encoded="$(python3 -c 'import urllib.parse; print(urllib.parse.quote("@skillninja/shortmovie-telop-model-p'"$i"'", safe=""))')"
  url="https://registry.npmjs.org/${encoded}/-/shortmovie-telop-model-p${i}-1.0.0.tgz"
  curl -sSL --fail "$url" -o ".cache/npm-models/p${i}.tgz"
  tar -xzf ".cache/npm-models/p${i}.tgz" -C .cache/models/whisper-small-ct2 --strip-components=1
done

cat \
  .cache/models/whisper-small-ct2/model.bin.part0 \
  .cache/models/whisper-small-ct2/model.bin.part1 \
  .cache/models/whisper-small-ct2/model.bin.part2 \
  .cache/models/whisper-small-ct2/model.bin.part3 \
  > .cache/models/whisper-small-ct2/model.bin

expected="$(awk '{print $1}' .cache/models/whisper-small-ct2/model.sha256)"
actual="$(sha256sum .cache/models/whisper-small-ct2/model.bin | awk '{print $1}')"
if [ "$expected" != "$actual" ]; then
  echo "Whisper model checksum mismatch: expected $expected, got $actual" >&2
  exit 1
fi
rm -f .cache/models/whisper-small-ct2/model.bin.part*

echo "Preparing bundled Chromium headless shell and its shared libraries"
node --input-type=module - <<'JS'
import chromium from "@sparticuz/chromium";
const executablePath = await chromium.executablePath();
console.log(`Chromium ready at ${executablePath}`);
JS

PYTHONPATH=.cache/pydeps python3 - <<'PY'
import brotli, io, tarfile
from pathlib import Path
source = Path("node_modules/@sparticuz/chromium/bin/al2023.tar.br")
archive = tarfile.open(fileobj=io.BytesIO(brotli.decompress(source.read_bytes())), mode="r:")
archive.extractall(Path(".cache/chromium-libs"))
PY

echo "Creating a placeholder cut video if one is not present"
if [ ! -f public/edit/cut.mp4 ]; then
  FF="$(PYTHONPATH=.cache/pydeps python3 -c 'import imageio_ffmpeg; print(imageio_ffmpeg.get_ffmpeg_exe())')"
  "$FF" -hide_banner -loglevel error \
    -f lavfi -i "color=c=0x10182F:s=1280x720:r=30:d=72" \
    -vf "drawbox=x=440:y=120:w=400:h=520:color=0x25335A:t=fill" \
    -c:v libx264 -preset veryfast -crf 28 -pix_fmt yuv420p \
    -movflags +faststart -y public/edit/cut.mp4
fi

cat <<'EOF'

Local render setup is ready.

Use these environment values for Remotion stills and renders:
  export LD_LIBRARY_PATH="$PWD/.cache/chromium-libs/lib${LD_LIBRARY_PATH:+:$LD_LIBRARY_PATH}"
  npx remotion still YouthCampReel out/preview.png --frame=300 --browser-executable=/tmp/chromium
  npx remotion render YouthCampReel out/youth-camp-reel.mp4 --codec=h264 --pixel-format=yuv420p --browser-executable=/tmp/chromium

The offline ASR model lives at:
  .cache/models/whisper-small-ct2
EOF
