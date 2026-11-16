#!/usr/bin/env python3
"""Synthesize a placeholder voice track from script.json, so the render chain can be exercised
before a real voiceover exists.

    source scripts/activate-studio.sh
    python3 scripts/placeholder-voice.py --project content/drafts/my-film
    python3 tools/cinematic-skill/skills/cinematic-film/scripts/build_narration.py \
        --project content/drafts/my-film

Each narration line becomes one short tone clip whose length approximates how long the line takes
to say (~2.45 words/second, never shorter than 1.4 s). `build_narration.py` then assembles
`audio/narration.m4a` and `audio/timing.json`, which is what the film is actually built on.

Why a tone and not silence: ffmpeg's silence removal strips a pure-silence clip to zero length, so
every line would collapse and the timeline would be meaningless. The tone keeps the clip measurable
while staying obviously wrong to the ear — nobody mistakes this for a finished read.

Writes  audio/lines/segNN.wav, audio/segments.json
This output is a build artifact. Do not commit it.
"""
import argparse
import json
import pathlib
import subprocess
import sys

WORDS_PER_SEC = 2.45
MIN_SEC = 1.4
RATE = 24000
TONE_HZ = 196.0      # a low, quiet tone; present, never musical
# ffmpeg's default sine is already about -18 dBFS peak. Anything quieter than the -50 dB
# silenceremove threshold used by build_narration.py gets trimmed to nothing, so do NOT reduce this.
TONE_DB = 0


def duration(path):
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(path)],
        capture_output=True, text=True, check=True,
    ).stdout.strip()
    return float(out)


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--project", required=True)
    ap.add_argument("--rate", type=float, default=WORDS_PER_SEC, help="words per second to assume")
    a = ap.parse_args()

    proj = pathlib.Path(a.project)
    script = json.loads((proj / "script.json").read_text())
    adir = proj / "audio"
    lines_dir = adir / "lines"
    lines_dir.mkdir(parents=True, exist_ok=True)

    segments = []
    n = 0
    for take in script["takes"]:
        for line in take["lines"]:
            n += 1
            spoken = (line.get("spoken") or line.get("text") or "").strip()
            words = max(1, len(spoken.split()))
            dur = max(MIN_SEC, round(words / a.rate, 2))
            path = lines_dir / f"seg{n:02d}.wav"
            subprocess.run(
                ["ffmpeg", "-y", "-v", "error", "-f", "lavfi",
                 "-i", f"sine=frequency={TONE_HZ}:sample_rate={RATE}:duration={dur}",
                 "-af", f"volume={TONE_DB}dB", "-ac", "1", str(path)],
                check=True,
            )
            clipped = duration(path)
            if clipped <= 0:
                sys.exit(f"line {n} produced a zero-length clip; the tone is below the trim threshold")
            segments.append({
                "id": n,
                "scene": take["take"],
                "caption": line.get("text", ""),
                "vo": spoken,
                "gap_after": line.get("gap_after", 0.8),
            })

    (adir / "segments.json").write_text(json.dumps({"segments": segments}, indent=2, ensure_ascii=False))
    total = sum(duration(lines_dir / f"seg{s['id']:02d}.wav") + s["gap_after"] for s in segments)
    print(f"{len(segments)} lines from {len(script['takes'])} takes -> ~{total / 60:.2f} min of placeholder speech")
    print(f"wrote {adir / 'segments.json'}")
    print("next: build_narration.py --project", a.project)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
