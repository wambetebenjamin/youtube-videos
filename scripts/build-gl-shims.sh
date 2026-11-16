#!/usr/bin/env bash
# Build the software-GL shims that let skia-python (and therefore the
# cinematic-film engine) run on machines without libEGL/libGL installed.
#
# Why this exists
#   skia-python is built with GPU hooks: its extension module has undefined
#   references to eglQueryString / glGetString / glXGetCurrentContext and ~107
#   more GL entry points. On a host without libEGL.so.1 and libGL.so.1 the
#   dynamic linker fails the import outright, even though every code path we
#   use (skia.Surface -> CPU raster) never touches the GPU.
#
#   These stubs answer "there is no GL context" so Skia selects its CPU
#   backend. Rendering is unaffected and fully deterministic.
#
# Install the real libraries when you can (libegl1, libgl1); they are better.
# This is the fallback for sandboxes, CI images and hosts where apt is blocked.
#
# Usage:
#   bash scripts/build-gl-shims.sh        # build into tools/lib
#   source scripts/activate-studio.sh     # puts tools/lib on LD_LIBRARY_PATH
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SRC="$ROOT/scripts/gl-shims"
OUT="${1:-$ROOT/tools/lib}"

if ! command -v gcc >/dev/null 2>&1 && ! command -v cc >/dev/null 2>&1; then
  echo "No C compiler found; cannot build GL shims." >&2
  echo "Install libegl1/libgl1 instead (they are preferred anyway)." >&2
  exit 1
fi

CC="$(command -v gcc || command -v cc)"
mkdir -p "$OUT"

# Only skip building if the real libraries are genuinely absent -- otherwise
# our stub could shadow a working driver.
if ldconfig -p 2>/dev/null | grep -q "libEGL\.so\.1"; then
  echo "Real libEGL.so.1 found on this system; shims not required."
  exit 0
fi

echo "Building GL shims in $OUT ..."
"$CC" -shared -fPIC -O2 -o "$OUT/libEGL.so.1" "$SRC/egl_stub.c"
"$CC" -shared -fPIC -O2 -o "$OUT/libGL.so.1"  "$SRC/gl_stub.c"
echo "  $OUT/libEGL.so.1"
echo "  $OUT/libGL.so.1"

echo
echo "Verify with:"
echo "  LD_LIBRARY_PATH=\"$OUT:\$LD_LIBRARY_PATH\" .venv/bin/python -c 'import skia; print(skia.__version__)'"
