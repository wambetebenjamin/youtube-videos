#!/usr/bin/env python3
"""Create the premium-looking grade and mastered audio for the youth-camp reel.

This is a post-process over the already verified cut/mix, so it does not need
the original large Drive source files. It produces:

  public/edit/cut-premium.mp4
  public/edit/audio-premium.wav
"""

from __future__ import annotations

import hashlib
import json
import os
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PYDEPS = ROOT / ".cache" / "pydeps"
if PYDEPS.exists():
    sys.path.insert(0, str(PYDEPS))

import imageio_ffmpeg  # noqa: E402

PUBLIC = ROOT / "public" / "edit"
SOURCE_CUT = PUBLIC / "cut.mp4"
SOURCE_AUDIO = PUBLIC / "audio.wav"
PREMIUM_CUT = PUBLIC / "cut-premium.mp4"
PREMIUM_AUDIO = PUBLIC / "audio-premium.wav"
ANALYSIS = ROOT / ".cache" / "youth-camp-work" / "analysis"

VIDEO_FILTER = (
    "eq=contrast=1.06:brightness=0.012:saturation=1.08:gamma=1.02,"
    "colorbalance=rs=0.02:gs=0.005:bs=-0.015:"
    "rm=0.015:gm=0.005:bm=-0.01:rh=0.01:gh=0.005:bh=-0.01,"
    "vignette=PI/4.6:eval=frame,"
    "noise=alls=3:allf=t+u,"
    "unsharp=5:5:0.35:5:5:0.0,"
    "format=yuv420p"
)

AUDIO_PRE_FX = (
    "highpass=f=65,"
    "acompressor=threshold=-20dB:ratio=1.8:attack=12:release=140"
)


def ffmpeg_exe() -> str:
    return imageio_ffmpeg.get_ffmpeg_exe()


def md5(path: Path) -> str:
    digest = hashlib.md5()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def loudnorm_stats(ff: str) -> dict[str, float]:
    cmd = [
        ff,
        "-hide_banner",
        "-nostats",
        "-i",
        str(SOURCE_AUDIO),
        "-af",
        f"{AUDIO_PRE_FX},loudnorm=I=-14:TP=-1.5:LRA=7:print_format=json",
        "-f",
        "null",
        "-",
    ]
    result = subprocess.run(
        cmd,
        cwd=ROOT,
        check=True,
        text=True,
        capture_output=True,
    )
    blocks = re.findall(r"\{[^{}]*\}", result.stderr, re.S)
    for block in reversed(blocks):
        try:
            data = json.loads(block)
        except json.JSONDecodeError:
            continue
        if "input_i" in data:
            return {
                "measured_I": float(data["input_i"]),
                "measured_LRA": float(data["input_lra"]),
                "measured_TP": float(data["input_tp"]),
                "measured_thresh": float(data["input_thresh"]),
                "offset": float(data["target_offset"]),
            }
    raise RuntimeError("Could not parse loudnorm measurement JSON")


def build_premium_video(ff: str) -> None:
    cmd = [
        ff,
        "-y",
        "-hide_banner",
        "-loglevel",
        "error",
        "-i",
        str(SOURCE_CUT),
        "-vf",
        VIDEO_FILTER,
        "-an",
        "-c:v",
        "libx264",
        "-preset",
        "medium",
        "-crf",
        "17",
        "-pix_fmt",
        "yuv420p",
        "-movflags",
        "+faststart",
        str(PREMIUM_CUT),
    ]
    subprocess.run(cmd, cwd=ROOT, check=True)


def build_premium_audio(ff: str, stats: dict[str, float]) -> None:
    measured = ":".join(
        [
            f"measured_I={stats['measured_I']:.6f}",
            f"measured_LRA={stats['measured_LRA']:.6f}",
            f"measured_TP={stats['measured_TP']:.6f}",
            f"measured_thresh={stats['measured_thresh']:.6f}",
            f"offset={stats['offset']:.6f}",
        ]
    )
    loudnorm = (
        "loudnorm=I=-14:TP=-1.5:LRA=7:"
        f"{measured}:linear=true:print_format=summary"
    )
    audio_filter = ",".join(
        [
            AUDIO_PRE_FX,
            loudnorm,
            "alimiter=limit=0.95",
            "afade=t=in:st=0:d=0.35",
            "afade=t=out:st=67.55:d=0.47",
            "aresample=48000",
        ]
    )
    cmd = [
        ff,
        "-y",
        "-hide_banner",
        "-loglevel",
        "error",
        "-i",
        str(SOURCE_AUDIO),
        "-af",
        audio_filter,
        "-c:a",
        "pcm_s16le",
        "-ar",
        "48000",
        "-ac",
        "2",
        str(PREMIUM_AUDIO),
    ]
    subprocess.run(cmd, cwd=ROOT, check=True)


def main() -> None:
    for path in (SOURCE_CUT, SOURCE_AUDIO):
        if not path.exists():
            raise SystemExit(f"Missing source asset: {path}")

    PUBLIC.mkdir(parents=True, exist_ok=True)
    ANALYSIS.mkdir(parents=True, exist_ok=True)
    ff = ffmpeg_exe()

    stats = loudnorm_stats(ff)
    build_premium_video(ff)
    build_premium_audio(ff, stats)

    report = {
        "inputs": {
            "video": str(SOURCE_CUT.relative_to(ROOT)),
            "audio": str(SOURCE_AUDIO.relative_to(ROOT)),
        },
        "outputs": {
            "video": str(PREMIUM_CUT.relative_to(ROOT)),
            "audio": str(PREMIUM_AUDIO.relative_to(ROOT)),
        },
        "videoFilter": VIDEO_FILTER,
        "audioTarget": {"I": -14, "TP": -1.5, "LRA": 7},
        "loudnormMeasured": stats,
        "premiumVideo": {
            "bytes": PREMIUM_CUT.stat().st_size,
            "md5": md5(PREMIUM_CUT),
        },
        "premiumAudio": {
            "bytes": PREMIUM_AUDIO.stat().st_size,
            "md5": md5(PREMIUM_AUDIO),
        },
    }
    (ANALYSIS / "premium-report.json").write_text(json.dumps(report, indent=2))
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
