#!/usr/bin/env python3
"""Prepare compact editing proxies and word-level transcripts for the youth camp Reel.

Runs on a GitHub Actions runner, where the large Google Drive source files are
reachable. Results are streamed back into a temporary Google Drive folder using
pre-authorized resumable upload sessions supplied as workflow-dispatch inputs.
"""

from __future__ import annotations

import json
import os
import re
import subprocess
import sys
import time
import zipfile
from pathlib import Path
from typing import Any

import requests
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
WORK = ROOT / ".cache" / "youth-camp-work"
FRAMES = WORK / "frames"
ASSETS = WORK / "assets"
XGOOG_CHUNK = 256 * 1024
LEGACY_CHUNK = 8 * 1024 * 1024
PROXY_LIMIT = 88 * 1024 * 1024

SOURCES = [
    {
        "key": "short1",
        "drive_id": "1wwjLigJhO5jD41AqFpvwIwGt4or39DjR",
        "label": "youth camp short 1",
    },
    {
        "key": "short2",
        "drive_id": "1t4QC4eTs338axbvagfpRHDfpZOu9BKp5",
        "label": "youth camp short 2",
    },
]

INITIAL_PROMPT = (
    "A Christian youth camp message for parents and teenagers. Key themes: "
    "Pursue, Overtake, Recover All; Hannah and Samuel; courage; social capital; "
    "spiritual covering; parents watching from home."
)


def run(cmd: list[str], *, capture: bool = False, check: bool = True) -> subprocess.CompletedProcess[str]:
    print("+", " ".join(cmd), flush=True)
    return subprocess.run(
        cmd,
        cwd=ROOT,
        text=True,
        check=check,
        stdout=subprocess.PIPE if capture else None,
        stderr=subprocess.STDOUT if capture else None,
    )


def download_drive(drive_id: str, output: Path) -> None:
    """Download a publicly shared, large Drive file with gdown."""
    if output.exists() and output.stat().st_size > 100_000_000:
        print(f"Reusing existing download: {output}", flush=True)
        return

    print(f"Downloading Drive file {drive_id}", flush=True)
    last_error: Exception | None = None
    for attempt in range(3):
        try:
            import gdown

            output.unlink(missing_ok=True)
            result = gdown.download(id=drive_id, output=str(output), quiet=False)
            if result and output.exists() and output.stat().st_size > 100_000_000:
                print(f"Downloaded {output.stat().st_size:,} bytes", flush=True)
                return
            last_error = RuntimeError(f"gdown returned {result!r} or an unexpectedly small file")
        except Exception as exc:  # noqa: BLE001
            last_error = exc
            print(f"Download attempt {attempt + 1} failed: {exc}", flush=True)
        time.sleep(3 * (attempt + 1))
    raise RuntimeError(f"Could not download Drive file {drive_id}: {last_error}")


def probe(path: Path) -> dict[str, Any]:
    result = run(
        [
            "ffprobe",
            "-v",
            "error",
            "-show_entries",
            "format=duration,size:stream=index,codec_type,codec_name,width,height,r_frame_rate,sample_rate,channels",
            "-of",
            "json",
            str(path),
        ],
        capture=True,
    )
    return json.loads(result.stdout)


def encode_proxy(raw: Path, proxy: Path) -> dict[str, Any]:
    """Encode a <88 MiB proxy, preserving the 16:9 source for later smart reframe."""
    configs = [
        (1280, 30, "900k"),
        (960, 32, "650k"),
        (854, 34, "450k"),
    ]
    attempts: list[dict[str, Any]] = []
    for width, crf, maxrate in configs:
        run(
            [
                "ffmpeg",
                "-y",
                "-hide_banner",
                "-loglevel",
                "warning",
                "-i",
                str(raw),
                "-map",
                "0:v:0",
                "-map",
                "0:a:0?",
                "-vf",
                f"fps=30,scale={width}:-2:flags=lanczos",
                "-c:v",
                "libx264",
                "-preset",
                "veryfast",
                "-crf",
                str(crf),
                "-maxrate",
                maxrate,
                "-bufsize",
                "1800k",
                "-profile:v",
                "high",
                "-pix_fmt",
                "yuv420p",
                "-r",
                "30",
                "-fps_mode",
                "cfr",
                "-c:a",
                "aac",
                "-b:a",
                "96k",
                "-ac",
                "1",
                "-ar",
                "48000",
                "-movflags",
                "+faststart",
                str(proxy),
            ]
        )
        size = proxy.stat().st_size
        attempts.append({"width": width, "crf": crf, "maxrate": maxrate, "size": size})
        if size <= PROXY_LIMIT:
            return {"width": width, "crf": crf, "maxrate": maxrate, "size": size, "attempts": attempts}
        print(f"Proxy is {size:,} bytes; retrying with a smaller configuration", flush=True)
    raise RuntimeError(f"Unable to fit proxy under {PROXY_LIMIT:,} bytes: {attempts}")


def extract_wav(proxy: Path, wav: Path) -> None:
    run(
        [
            "ffmpeg",
            "-y",
            "-hide_banner",
            "-loglevel",
            "error",
            "-i",
            str(proxy),
            "-vn",
            "-ac",
            "1",
            "-ar",
            "16000",
            "-c:a",
            "pcm_s16le",
            str(wav),
        ]
    )


def transcribe(wav: Path) -> dict[str, Any]:
    from faster_whisper import WhisperModel

    model_name = "base.en"
    model: Any | None = None
    model_errors: list[str] = []
    for candidate in ("base.en", "tiny.en"):
        try:
            model = WhisperModel(candidate, device="cpu", compute_type="int8")
            model_name = candidate
            break
        except Exception as exc:  # noqa: BLE001
            model_errors.append(f"{candidate}: {exc}")
            print(f"Could not load {candidate}: {exc}", flush=True)
    if model is None:
        raise RuntimeError("No Whisper model could be loaded: " + " | ".join(model_errors))

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
                    "start": float(word.start),
                    "end": float(word.end),
                    "probability": float(getattr(word, "probability", 0.0)),
                }
            )
        segments.append(
            {
                "id": segment.id,
                "start": float(segment.start),
                "end": float(segment.end),
                "text": segment.text,
                "words": words,
            }
        )

    return {
        "model": model_name,
        "language": getattr(info, "language", "en"),
        "duration": getattr(info, "duration", None),
        "segments": segments,
    }


def detect_silences(proxy: Path) -> list[dict[str, float]]:
    result = run(
        [
            "ffmpeg",
            "-hide_banner",
            "-i",
            str(proxy),
            "-af",
            "silencedetect=noise=-35dB:d=0.30",
            "-f",
            "null",
            "-",
        ],
        capture=True,
        check=False,
    )
    text = result.stdout or ""
    starts = [float(x) for x in re.findall(r"silence_start: ([0-9.]+)", text)]
    ends = [float(x) for x in re.findall(r"silence_end: ([0-9.]+)", text)]
    silences: list[dict[str, float]] = []
    for index, start in enumerate(starts):
        end = ends[index] if index < len(ends) else start
        silences.append({"start": start, "end": end, "duration": max(0.0, end - start)})
    return silences


def make_contact_sheet(proxies: list[tuple[str, Path, float]]) -> Path:
    FRAMES.mkdir(parents=True, exist_ok=True)
    cells: list[tuple[str, Path]] = []
    for label, proxy, duration in proxies:
        for fraction in (0.08, 0.25, 0.42, 0.58, 0.75, 0.92):
            timestamp = max(0.0, min(duration - 0.1, duration * fraction))
            frame = FRAMES / f"{label}-{int(fraction * 100):02d}.jpg"
            run(
                [
                    "ffmpeg",
                    "-y",
                    "-hide_banner",
                    "-loglevel",
                    "error",
                    "-ss",
                    f"{timestamp:.3f}",
                    "-i",
                    str(proxy),
                    "-frames:v",
                    "1",
                    "-vf",
                    "scale=270:-2",
                    str(frame),
                ],
                check=False,
            )
            if frame.exists():
                cells.append((f"{label} @ {timestamp:.1f}s", frame))

    cell_w, cell_h, label_h = 270, 170, 28
    columns = 6
    rows = max(1, (len(cells) + columns - 1) // columns)
    sheet = Image.new("RGB", (columns * cell_w, rows * (cell_h + label_h)), (8, 15, 32))
    draw = ImageDraw.Draw(sheet)
    for index, (label, frame) in enumerate(cells):
        x = (index % columns) * cell_w
        y = (index // columns) * (cell_h + label_h)
        image = Image.open(frame).convert("RGB")
        image.thumbnail((cell_w, cell_h))
        sheet.paste(image, (x + (cell_w - image.width) // 2, y))
        draw.text((x + 6, y + cell_h + 6), label, fill=(255, 255, 255))
    output = ASSETS / "contact-sheet.jpg"
    sheet.save(output, quality=88)
    return output


def build_assets(proxies: dict[str, dict[str, Any]], contact_sheet: Path, upload_method: str) -> Path:
    transcript_lines: list[str] = []
    for source in SOURCES:
        key = source["key"]
        data = proxies[key]
        transcript_lines.append(f"===== {source['label']} =====")
        for segment in data.get("transcript", {}).get("segments", []):
            transcript_lines.append(f"[{segment['start']:.2f} --> {segment['end']:.2f}] {segment['text'].strip()}")
        transcript_lines.append("")

    readme = (
        "Youth Camp Reel editing assets\n"
        "==============================\n\n"
        "short1.json / short2.json: word-level transcription with timestamps.\n"
        "transcript.txt: readable segment transcript.\n"
        "silences.json: ffmpeg silence-detection ranges from the proxies.\n"
        "contact-sheet.jpg: sampled frames from both source clips.\n"
        "probe.json: ffprobe metadata for source and proxy files.\n"
        f"Upload protocol: {upload_method}\n"
    )

    (ASSETS / "transcript.txt").write_text("\n".join(transcript_lines), encoding="utf-8")
    (ASSETS / "README.txt").write_text(readme, encoding="utf-8")
    (ASSETS / "silences.json").write_text(
        json.dumps({key: proxies[key].get("silences", []) for key in proxies}, indent=2), encoding="utf-8"
    )
    probe_data: dict[str, Any] = {}
    for key, data in proxies.items():
        (ASSETS / f"{key}.json").write_text(json.dumps(data.get("transcript", {}), indent=2), encoding="utf-8")
        probe_data[key] = {"source": data.get("source_probe"), "proxy": data.get("proxy_probe"), "encode": data.get("encode")}
    (ASSETS / "probe.json").write_text(json.dumps(probe_data, indent=2), encoding="utf-8")

    zip_path = WORK / "youth-camp-edit-assets.zip"
    with zipfile.ZipFile(zip_path, "w", compression=zipfile.ZIP_DEFLATED) as archive:
        for path in sorted(ASSETS.iterdir()):
            if path.is_file() and path.name != zip_path.name:
                archive.write(path, arcname=path.name)
    return zip_path


def xgoog_headers(offset: int, total: int, command: str) -> dict[str, str]:
    return {
        "Content-Length": "0" if command == "query" else str(min(XGOOG_CHUNK, total - offset)),
        "X-Goog-Upload-Offset": str(offset),
        "X-Goog-Upload-Command": command,
        "X-Goog-Upload-Total-Size": str(total),
    }


def preflight(session_uri: str) -> tuple[str, str]:
    """Determine whether this session expects X-Goog PUT, X-Goog POST or legacy PUT."""
    data = b"arena youth camp resumable upload protocol test\n"
    total = len(data)
    session = requests.Session()

    for http_method, protocol in (("PUT", "xgoog"), ("POST", "xgoog"), ("PUT", "legacy")):
        if protocol == "xgoog":
            headers = {
                "Content-Length": str(total),
                "X-Goog-Upload-Offset": "0",
                "X-Goog-Upload-Command": "upload, finalize",
                "X-Goog-Upload-Total-Size": str(total),
            }
        else:
            headers = {
                "Content-Length": str(total),
                "Content-Range": f"bytes 0-{total - 1}/{total}",
            }
        try:
            request = getattr(session, http_method.lower())
            response = request(session_uri, data=data, headers=headers, timeout=60)
            status = response.headers.get("X-Goog-Upload-Status", "")
            print(
                f"Preflight {http_method}/{protocol}: HTTP {response.status_code}, "
                f"X-Goog-Upload-Status={status!r}",
                flush=True,
            )
            if 200 <= response.status_code < 300:
                if protocol == "xgoog" and status.lower() == "active":
                    finalize_headers = {
                        "Content-Length": "0",
                        "X-Goog-Upload-Offset": str(total),
                        "X-Goog-Upload-Command": "upload, finalize",
                        "X-Goog-Upload-Total-Size": str(total),
                    }
                    finalize = getattr(session, http_method.lower())(
                        session_uri, data=b"", headers=finalize_headers, timeout=60
                    )
                    print(
                        f"Preflight finalize: HTTP {finalize.status_code}, "
                        f"X-Goog-Upload-Status={finalize.headers.get('X-Goog-Upload-Status', '')!r}",
                        flush=True,
                    )
                return (http_method, protocol)
            if response.text:
                print(response.text[:500], flush=True)
        except Exception as exc:  # noqa: BLE001
            print(f"Preflight {http_method}/{protocol} raised {exc}", flush=True)
    raise RuntimeError("No supported resumable upload protocol worked")


def upload_xgoog(path: Path, session_uri: str, http_method: str) -> requests.Response:
    total = path.stat().st_size
    offset = 0
    session = requests.Session()
    request = getattr(session, http_method.lower())
    last_response: requests.Response | None = None
    with path.open("rb") as handle:
        while offset < total:
            chunk = handle.read(XGOOG_CHUNK)
            is_last = offset + len(chunk) >= total
            command = "upload, finalize" if is_last else "upload"
            headers = {
                "Content-Length": str(len(chunk)),
                "X-Goog-Upload-Offset": str(offset),
                "X-Goog-Upload-Command": command,
                "X-Goog-Upload-Total-Size": str(total),
            }
            for attempt in range(5):
                try:
                    response = request(session_uri, data=chunk, headers=headers, timeout=120)
                    status = response.headers.get("X-Goog-Upload-Status", "").lower()
                    if 200 <= response.status_code < 300:
                        last_response = response
                        # Some implementations finish only after a zero-length finalize.
                        if is_last and status == "active":
                            finalize_headers = {
                                "Content-Length": "0",
                                "X-Goog-Upload-Offset": str(total),
                                "X-Goog-Upload-Command": "upload, finalize",
                                "X-Goog-Upload-Total-Size": str(total),
                            }
                            finalize = request(
                                session_uri, data=b"", headers=finalize_headers, timeout=120
                            )
                            finalize_status = finalize.headers.get("X-Goog-Upload-Status", "").lower()
                            if 200 <= finalize.status_code < 300 and finalize_status in ("", "final"):
                                last_response = finalize
                            else:
                                print(
                                    f"Finalize failed: HTTP {finalize.status_code}, "
                                    f"status={finalize_status!r}, body={finalize.text[:240]!r}",
                                    flush=True,
                                )
                                continue
                        break
                    print(
                        f"Upload retry {attempt + 1} at {offset:,}: HTTP {response.status_code}, "
                        f"status={status!r}, body={response.text[:240]!r}",
                        flush=True,
                    )
                except Exception as exc:  # noqa: BLE001
                    print(f"Upload retry {attempt + 1} at {offset:,} raised {exc}", flush=True)
                time.sleep(2 * (attempt + 1))
            else:
                raise RuntimeError(f"Failed to upload chunk at offset {offset:,}")
            offset += len(chunk)
            if offset % (10 * 1024 * 1024) < XGOOG_CHUNK or is_last:
                print(f"Uploaded {offset:,}/{total:,} bytes ({offset / total:.1%})", flush=True)
    if last_response is None:
        raise RuntimeError("Upload produced no response")
    return last_response


def upload_legacy(path: Path, session_uri: str) -> requests.Response:
    total = path.stat().st_size
    offset = 0
    session = requests.Session()
    last_response: requests.Response | None = None
    with path.open("rb") as handle:
        while offset < total:
            chunk = handle.read(LEGACY_CHUNK)
            end = offset + len(chunk) - 1
            headers = {
                "Content-Length": str(len(chunk)),
                "Content-Range": f"bytes {offset}-{end}/{total}",
            }
            for attempt in range(5):
                try:
                    response = session.put(session_uri, data=chunk, headers=headers, timeout=180)
                    if response.status_code in (200, 201, 308):
                        last_response = response
                        break
                    print(
                        f"Legacy upload retry {attempt + 1} at {offset:,}: "
                        f"HTTP {response.status_code}, body={response.text[:240]!r}",
                        flush=True,
                    )
                except Exception as exc:  # noqa: BLE001
                    print(f"Legacy upload retry {attempt + 1} at {offset:,} raised {exc}", flush=True)
                time.sleep(2 * (attempt + 1))
            else:
                raise RuntimeError(f"Failed to upload legacy chunk at offset {offset:,}")
            offset += len(chunk)
            print(f"Uploaded {offset:,}/{total:,} bytes ({offset / total:.1%})", flush=True)
    if last_response is None:
        raise RuntimeError("Legacy upload produced no response")
    return last_response


def upload_to_drive(path: Path, session_uri: str, method: tuple[str, str]) -> None:
    http_method, protocol = method
    print(f"Uploading {path.name} ({path.stat().st_size:,} bytes) via {http_method}/{protocol}", flush=True)
    response = upload_xgoog(path, session_uri, http_method) if protocol == "xgoog" else upload_legacy(path, session_uri)
    try:
        metadata = response.json()
        print(f"Created Drive file {metadata.get('name')} ({metadata.get('id')})", flush=True)
    except ValueError:
        print(f"Upload completed with HTTP {response.status_code}", flush=True)


def main() -> int:
    WORK.mkdir(parents=True, exist_ok=True)
    FRAMES.mkdir(parents=True, exist_ok=True)
    ASSETS.mkdir(parents=True, exist_ok=True)

    sessions = {
        "test": os.environ.get("DRIVE_UPLOAD_TEST", "").strip(),
        "assets": os.environ.get("DRIVE_UPLOAD_ASSETS", "").strip(),
        "proxy1": os.environ.get("DRIVE_UPLOAD_PROXY1", "").strip(),
        "proxy2": os.environ.get("DRIVE_UPLOAD_PROXY2", "").strip(),
    }
    missing = [name for name, value in sessions.items() if not value]
    if missing:
        raise RuntimeError(f"Missing upload sessions: {', '.join(missing)}")

    method = preflight(sessions["test"])
    print(f"Selected upload method: {method[0]}/{method[1]}", flush=True)

    data: dict[str, dict[str, Any]] = {}
    contact_proxies: list[tuple[str, Path, float]] = []
    for source in SOURCES:
        key = source["key"]
        raw = WORK / f"{key}-raw.mp4"
        proxy = WORK / f"{key}-proxy.mp4"
        wav = WORK / f"{key}-audio.wav"
        download_drive(source["drive_id"], raw)
        source_probe = probe(raw)
        encode = encode_proxy(raw, proxy)
        proxy_probe = probe(proxy)
        duration = float(proxy_probe.get("format", {}).get("duration", 0.0))
        extract_wav(proxy, wav)
        silences = detect_silences(proxy)
        print(f"Transcribing {source['label']} ({duration:.1f}s)", flush=True)
        try:
            transcript = transcribe(wav)
        except Exception as exc:  # noqa: BLE001
            print(f"Transcription failed: {exc}", flush=True)
            transcript = {"error": str(exc), "segments": []}
        data[key] = {
            "source_probe": source_probe,
            "proxy_probe": proxy_probe,
            "encode": encode,
            "silences": silences,
            "transcript": transcript,
        }
        contact_proxies.append((key, proxy, duration))
        print(f"{key}: proxy={proxy.stat().st_size:,} bytes, transcript segments={len(transcript.get('segments', []))}", flush=True)

    contact_sheet = make_contact_sheet(contact_proxies)
    assets_zip = build_assets(data, contact_sheet, f"{method[0]}/{method[1]}")

    # Small assets first, then the two larger proxies.
    upload_to_drive(assets_zip, sessions["assets"], method)
    upload_to_drive(WORK / "short1-proxy.mp4", sessions["proxy1"], method)
    upload_to_drive(WORK / "short2-proxy.mp4", sessions["proxy2"], method)

    print("Youth camp edit assets prepared successfully.", flush=True)
    return 0


if __name__ == "__main__":
    sys.exit(main())
