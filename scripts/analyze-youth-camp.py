#!/usr/bin/env python3
"""Analyze the verified youth-camp source videos and build editing data.

The raw MP4s in `.cache/raw/` are the exact Google Drive source bytes (MD5
verified). This script creates compact proxies, mono audio, contact sheets,
RMS/silence data, and a word-timestamped transcript from the real audio.
"""

from __future__ import annotations

import argparse
import json
import math
import re
import subprocess
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parent.parent
WORK = ROOT / ".cache" / "youth-camp-work"
RAW = ROOT / ".cache" / "raw"
PROXIES = WORK / "proxies"
AUDIO = WORK / "audio"
FRAMES = WORK / "frames"
CONTACT = WORK / "contact-sheets"
ANALYSIS = WORK / "analysis"

SOURCES = {
    "short1": {
        "file": RAW / "short1.mp4",
        "duration": 551.194,
        "md5": "0241e46dfbaba2c5c85648957297b5c8",
    },
    "short2": {
        "file": RAW / "short2.mp4",
        "duration": 305.189,
        "md5": "0e70c4f806baf4ecc8a8ae0012e74df0",
    },
}

INITIAL_PROMPT = (
    "A Christian youth camp message to parents and teenagers. "
    "Themes may include Pursue, Overtake, Recover All, Hannah, Samuel, courage, "
    "social capital, spiritual covering, and parents watching from home."
)


def ffmpeg_exe() -> str:
    import imageio_ffmpeg

    return imageio_ffmpeg.get_ffmpeg_exe()


def run(cmd: list[str], *, capture: bool = False, check: bool = True) -> subprocess.CompletedProcess[str]:
    print("+", " ".join(cmd[:8]), "..." if len(cmd) > 8 else "", flush=True)
    return subprocess.run(
        cmd,
        cwd=ROOT,
        text=True,
        check=check,
        stdout=subprocess.PIPE if capture else None,
        stderr=subprocess.STDOUT if capture else None,
    )


def make_proxy(key: str, src: Path) -> Path:
    out = PROXIES / f"{key}.mp4"
    if out.exists() and out.stat().st_size > 1_000_000:
        return out
    ff = ffmpeg_exe()
    run(
        [
            ff, "-y", "-hide_banner", "-loglevel", "error",
            "-i", str(src),
            "-map", "0:v:0", "-map", "0:a:0?",
            "-vf", "fps=30,scale=960:-2:flags=lanczos",
            "-c:v", "libx264", "-preset", "veryfast", "-crf", "30",
            "-pix_fmt", "yuv420p", "-r", "30", "-fps_mode", "cfr",
            "-c:a", "aac", "-b:a", "96k", "-ac", "1", "-ar", "48000",
            "-movflags", "+faststart", str(out),
        ]
    )
    return out


def make_wav(key: str, src: Path) -> Path:
    out = AUDIO / f"{key}.wav"
    if out.exists() and out.stat().st_size > 1_000_000:
        return out
    ff = ffmpeg_exe()
    run(
        [
            ff, "-y", "-hide_banner", "-loglevel", "error",
            "-i", str(src), "-vn", "-ac", "1", "-ar", "16000",
            "-c:a", "pcm_s16le", str(out),
        ]
    )
    return out


def extract_frames(key: str, proxy: Path, duration: float) -> list[Path]:
    ff = ffmpeg_exe()
    FRAMES.mkdir(parents=True, exist_ok=True)
    paths: list[Path] = []
    fractions = [0.02, 0.10, 0.18, 0.26, 0.34, 0.42, 0.50, 0.58, 0.66, 0.74, 0.82, 0.92]
    for index, fraction in enumerate(fractions):
        timestamp = min(max(0.0, duration * fraction), duration - 0.2)
        out = FRAMES / f"{key}-{index:02d}.jpg"
        if not out.exists():
            run(
                [
                    ff, "-y", "-hide_banner", "-loglevel", "error",
                    "-ss", f"{timestamp:.3f}", "-i", str(proxy),
                    "-frames:v", "1", "-vf", "scale=480:-2", str(out),
                ]
            )
        paths.append(out)
    return paths


def make_contact_sheet(key: str, paths: list[Path], duration: float) -> Path:
    from PIL import Image, ImageDraw, ImageFont

    CONTACT.mkdir(parents=True, exist_ok=True)
    cols, rows = 3, 4
    cell_w, cell_h = 500, 310
    sheet = Image.new("RGB", (cols * cell_w, rows * cell_h), (10, 14, 28))
    draw = ImageDraw.Draw(sheet)
    font = ImageFont.load_default()
    fractions = [0.02, 0.10, 0.18, 0.26, 0.34, 0.42, 0.50, 0.58, 0.66, 0.74, 0.82, 0.92]
    for index, (path, fraction) in enumerate(zip(paths, fractions)):
        image = Image.open(path).convert("RGB")
        image.thumbnail((cell_w - 16, cell_h - 48))
        x = (index % cols) * cell_w + (cell_w - image.width) // 2
        y = (index // cols) * cell_h + 34
        sheet.paste(image, (x, y))
        label = f"{key}  {duration * fraction:6.1f}s"
        draw.text(((index % cols) * cell_w + 10, (index // cols) * cell_h + 10), label, fill=(255, 216, 77), font=font)
        draw.rectangle(
            [(index % cols) * cell_w, (index // cols) * cell_h, (index % cols + 1) * cell_w - 1, (index // cols + 1) * cell_h - 1],
            outline=(55, 70, 100),
            width=1,
        )
    out = CONTACT / f"{key}-contact.jpg"
    sheet.save(out, quality=88)
    return out


def rms_envelope(wav: Path, key: str) -> dict[str, Any]:
    import numpy as np
    import soundfile as sf

    data, samplerate = sf.read(str(wav), dtype="float32", always_2d=False)
    window = int(samplerate * 0.05)
    count = len(data) // window
    trimmed = data[: count * window].reshape(count, window)
    rms = np.sqrt(np.mean(trimmed * trimmed, axis=1) + 1e-12)
    db = 20 * np.log10(np.maximum(rms, 1e-6))
    peak_db = float(np.percentile(db, 98))
    threshold_db = peak_db - 32
    voiced = db > threshold_db
    silences: list[dict[str, float]] = []
    start: float | None = None
    for i, flag in enumerate(voiced):
        t = i * 0.05
        if not flag and start is None:
            start = t
        elif flag and start is not None:
            if t - start >= 0.28:
                silences.append({"start": round(start, 3), "end": round(t, 3), "duration": round(t - start, 3)})
            start = None
    if start is not None:
        end = count * 0.05
        if end - start >= 0.28:
            silences.append({"start": round(start, 3), "end": round(end, 3), "duration": round(end - start, 3)})
    payload = {
        "samplerate": samplerate,
        "windowSeconds": 0.05,
        "peakDb": peak_db,
        "thresholdDb": threshold_db,
        "duration": round(count * 0.05, 3),
        "envelope": [round(float(x), 4) for x in db],
        "silences": silences,
    }
    ANALYSIS.mkdir(parents=True, exist_ok=True)
    (ANALYSIS / f"{key}-audio.json").write_text(json.dumps(payload))
    return payload


def transcribe(wav: Path, key: str) -> dict[str, Any]:
    from faster_whisper import WhisperModel

    out = ANALYSIS / f"{key}-transcript.json"
    if out.exists():
        return json.loads(out.read_text())
    model = WhisperModel(
        str(ROOT / ".cache" / "models" / "whisper-small-ct2"),
        device="cpu",
        compute_type="int8",
        local_files_only=True,
    )
    segments_iter, info = model.transcribe(
        str(wav),
        language="en",
        task="transcribe",
        beam_size=5,
        temperature=0,
        word_timestamps=True,
        vad_filter=True,
        vad_parameters={"min_silence_duration_ms": 350},
        condition_on_previous_text=False,
        initial_prompt=INITIAL_PROMPT,
    )
    segments: list[dict[str, Any]] = []
    for segment in segments_iter:
        words = []
        for word in getattr(segment, "words", None) or []:
            words.append(
                {
                    "word": word.word,
                    "start": round(float(word.start), 3),
                    "end": round(float(word.end), 3),
                    "probability": round(float(getattr(word, "probability", 0.0)), 3),
                }
            )
        segments.append(
            {
                "id": segment.id,
                "start": round(float(segment.start), 3),
                "end": round(float(segment.end), 3),
                "text": segment.text,
                "words": words,
            }
        )
        if len(segments) % 20 == 0:
            print(f"  {key}: transcribed {len(segments)} segments", flush=True)
    payload = {
        "source": key,
        "model": "whisper-small-ct2-int8",
        "language": getattr(info, "language", "en"),
        "duration": getattr(info, "duration", None),
        "initialPrompt": INITIAL_PROMPT,
        "segments": segments,
        "text": " ".join(segment["text"].strip() for segment in segments),
    }
    out.write_text(json.dumps(payload, indent=2))
    (ANALYSIS / f"{key}-transcript.txt").write_text(payload["text"])
    return payload


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--skip-asr", action="store_true")
    args = parser.parse_args()
    for directory in (WORK, PROXIES, AUDIO, FRAMES, CONTACT, ANALYSIS):
        directory.mkdir(parents=True, exist_ok=True)

    summary: dict[str, Any] = {"sources": {}}
    for key, info in SOURCES.items():
        print(f"=== {key} ===", flush=True)
        proxy = make_proxy(key, info["file"])
        wav = make_wav(key, info["file"])
        frames = extract_frames(key, proxy, info["duration"])
        contact = make_contact_sheet(key, frames, info["duration"])
        envelope = rms_envelope(wav, key)
        transcript = None if args.skip_asr else transcribe(wav, key)
        summary["sources"][key] = {
            "raw": str(info["file"].relative_to(ROOT)),
            "md5": info["md5"],
            "duration": info["duration"],
            "proxy": str(proxy.relative_to(ROOT)),
            "wav": str(wav.relative_to(ROOT)),
            "contactSheet": str(contact.relative_to(ROOT)),
            "silenceCount": len(envelope["silences"]),
            "transcriptSegments": len(transcript["segments"]) if transcript else None,
        }
    (ANALYSIS / "summary.json").write_text(json.dumps(summary, indent=2))
    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()
