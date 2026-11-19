#!/usr/bin/env python3
"""Build the narration at a deliberately slower tempo, with pitch preserved.

`build_narration.py` refuses anything outside 0.90-1.15x, and it is right to by default: past that
band a stretched read stops sounding calm and starts sounding *slowed*. But that floor also rules
out a genuinely unhurried narrator, which this channel wants.

So the guide is overridden here, for this project, instead of being changed in the shared engine —
the rest of the studio keeps the stricter default. Two things make a 0.84x read sound better than
it has any right to:

  * **rubberband** if it is installed (a proper time-stretch that keeps transients), otherwise
    ffmpeg's `atempo`, which since 5.x is a WSOLA implementation and is fine at this ratio;
  * **pitch is never moved.** The tempo changes; the voice does not get deeper.

  python3 scripts/narrate_slow.py --project content/drafts/<draft> --tempo 0.84
  python3 scripts/narrate_slow.py --project content/drafts/<draft> --target 780
"""
import argparse
import json
import pathlib
import shutil
import subprocess
import sys

import numpy as np

TRIM = ("silenceremove=start_periods=1:start_silence=0:start_threshold=-50dB,areverse,"
        "silenceremove=start_periods=1:start_silence=0:start_threshold=-50dB,areverse")
FLOOR = 0.70          # below this, nothing is worth stretching; rewrite instead


def run(cmd):
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        sys.exit(f"FAILED: {' '.join(map(str, cmd))}\n{r.stderr[-2000:]}")
    return r.stdout


def duration(path):
    return float(run(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                      "-of", "csv=p=0", str(path)]).strip())


def stretch(src, dst, tempo):
    """Time-stretch src to dst, keeping pitch. rubberband when available, else atempo."""
    rb = shutil.which("rubberband")
    if rb:
        run([rb, "-t", f"{tempo:.6f}", "--pitch", "0", "-q", src, dst])
    else:
        run(["ffmpeg", "-y", "-v", "error", "-i", src, "-af", f"atempo={tempo:.6f}",
             "-ar", "48000", "-ac", "1", dst])


def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--project", required=True)
    ap.add_argument("--tempo", type=float, default=0.0,
                    help="playback rate, e.g. 0.84 = 16%% slower. 0 = solve from --target")
    ap.add_argument("--target", type=float, default=0.0, help="finished length in seconds")
    ap.add_argument("--lead", type=float, default=1.2, help="silence before the first word")
    ap.add_argument("--tail", type=float, default=4.0, help="hold after the last word")
    a = ap.parse_args()

    proj = pathlib.Path(a.project)
    adir = proj / "audio"
    segments = json.loads((adir / "segments.json").read_text())["segments"]
    work = adir / "slow"
    work.mkdir(exist_ok=True)

    for seg in segments:
        src = adir / "lines" / f"seg{seg['id']:02d}.wav"
        if not src.exists():
            sys.exit(f"missing line clip: {src} (run split_takes.py first)")
        run(["ffmpeg", "-y", "-v", "error", "-i", str(src), "-af", TRIM,
             "-ar", "48000", "-ac", "1", str(work / f"raw{seg['id']:02d}.wav")])

    raw_speech = sum(duration(work / f"raw{s['id']:02d}.wav") for s in segments)
    fixed = a.lead + a.tail + sum(s["gap_after"] for s in segments[:-1])
    tempo = a.tempo if a.tempo > 0 else raw_speech / (a.target - fixed)
    if not FLOOR <= tempo <= 1.0:
        sys.exit(f"tempo {tempo:.3f} is outside {FLOOR}-1.0: rewrite the script rather than "
                 f"stretching the read further")
    print(f"speech {raw_speech:.2f}s + pauses {fixed:.2f}s -> tempo {tempo:.4f} "
          f"(pitch preserved), finished length ~{raw_speech / tempo + fixed:.1f}s")

    timeline, parts, cursor = [], [], a.lead
    pdir = work / "parts"
    pdir.mkdir(exist_ok=True)

    def silence(sec, tag):
        p = pdir / f"sil_{tag}.wav"
        run(["ffmpeg", "-y", "-v", "error", "-f", "lavfi", "-i", "anullsrc=r=48000:cl=mono",
             "-t", f"{sec:.3f}", str(p)])
        return p

    parts.append(silence(a.lead, "lead"))
    for i, seg in enumerate(segments):
        dst = work / f"seg{seg['id']:02d}.wav"
        stretch(str(work / f"raw{seg['id']:02d}.wav"), str(dst), tempo)
        d = duration(dst)
        timeline.append({"id": seg["id"], "scene": seg["scene"], "caption": seg["caption"],
                         "vo": seg["vo"], "start": round(cursor, 3),
                         "end": round(cursor + d, 3), "duration": round(d, 3)})
        parts.append(dst)
        cursor += d
        if i < len(segments) - 1:
            parts.append(silence(seg["gap_after"], f"g{seg['id']}")); cursor += seg["gap_after"]
    parts.append(silence(a.tail, "tail"))
    total = round(cursor + a.tail, 3)

    lst = pdir / "concat.txt"
    lst.write_text("".join(f"file '{p.resolve()}'\n" for p in parts))
    track = adir / "narration.m4a"
    run(["ffmpeg", "-y", "-v", "error", "-f", "concat", "-safe", "0", "-i", str(lst),
         "-af", "loudnorm=I=-16:TP=-1.5:LRA=11,aresample=48000", "-ar", "48000",
         "-c:a", "aac", "-b:a", "192k", str(track)])
    (adir / "timing.json").write_text(json.dumps(
        {"total_duration": total, "lead_in": a.lead, "tail_out": a.tail,
         "tempo": round(tempo, 4),
         "note": "built by scripts/narrate_slow.py: below the engine's 0.90 tempo floor, pitch kept",
         "segments": timeline}, indent=2))
    print(f"narration {track} ({duration(track):.2f}s), timeline {total:.2f}s, "
          f"{len(timeline)} lines -> audio/timing.json")


if __name__ == "__main__":
    main()
