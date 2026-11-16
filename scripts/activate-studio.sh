# Source this before running any studio engine:
#
#   source scripts/activate-studio.sh
#
# It puts the bundled ffmpeg/ffprobe and the software-GL shims on the right
# paths so the Python and Node skills behave the same here as in Codespaces.

STUDIO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")/.." && pwd)"

# ffmpeg + ffprobe by name (cinematic-film, animate, make-an-anime all shell out to them)
export PATH="$STUDIO_ROOT/tools/bin:$PATH"

# skia-python needs libEGL/libGL to import; the shims report "no GL context"
# so Skia uses CPU raster. Harmless when the real libraries exist.
if [ -d "$STUDIO_ROOT/tools/lib" ]; then
  case ":$LD_LIBRARY_PATH:" in
    *":$STUDIO_ROOT/tools/lib:"*) ;;
    *) export LD_LIBRARY_PATH="$STUDIO_ROOT/tools/lib${LD_LIBRARY_PATH:+:$LD_LIBRARY_PATH}" ;;
  esac
fi

# Use the venv by default so `python3 scripts/...` in a skill hits the right deps
if [ -x "$STUDIO_ROOT/.venv/bin/python" ]; then
  export PATH="$STUDIO_ROOT/.venv/bin:$PATH"
  export VIRTUAL_ENV="$STUDIO_ROOT/.venv"
fi

# Remotion renders with the local Chrome if one was installed
[ -n "${STUDIO_ROOT:-}" ] && export REMOTION_PROJECT_ROOT="$STUDIO_ROOT"

echo "studio env: ffmpeg=$(command -v ffmpeg || echo missing)  python=$(command -v python3 || echo missing)"
