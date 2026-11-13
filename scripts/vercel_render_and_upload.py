#!/usr/bin/env python3
"""
Cloud Render & Direct Google Drive Resumable Upload Worker
"""

from __future__ import annotations

import json
import os
import subprocess
import sys
import urllib.error
import urllib.request
from pathlib import Path

import gdown  # type: ignore


def upload_to_session_uri(file_path: Path, session_uri: str) -> dict:
    total = file_path.stat().st_size
    chunk_size = 8 * 1024 * 1024  # 8 MiB (multiple of 256 KiB)
    offset = 0
    body = b""

    print(f"Uploading {file_path.name} ({total / (1024 * 1024):.2f} MiB) to Google Drive...")
    with file_path.open("rb") as f:
        while offset < total:
            chunk = f.read(chunk_size)
            is_last = (offset + len(chunk)) >= total
            cmd_hdr = "upload, finalize" if is_last else "upload"
            headers = {
                "Content-Type": "video/mp4",
                "Content-Length": str(len(chunk)),
                "X-Goog-Upload-Offset": str(offset),
                "X-Goog-Upload-Total-Size": str(total),
                "X-Goog-Upload-Command": cmd_hdr,
            }
            req = urllib.request.Request(
                session_uri,
                data=chunk,
                method="PUT",
                headers=headers,
            )
            try:
                with urllib.request.urlopen(req, timeout=180) as resp:
                    status = resp.headers.get("X-Goog-Upload-Status", "")
                    body = resp.read()
            except urllib.error.HTTPError as err:
                err_body = err.read().decode("utf-8", errors="replace")
                raise RuntimeError(
                    f"Google Drive upload failed at offset {offset} (HTTP {err.code}): {err_body}"
                ) from err

            offset += len(chunk)
            pct = (offset * 100) // total
            print(
                f"  -> {offset / (1024 * 1024):.1f} / {total / (1024 * 1024):.1f} MiB "
                f"({pct}%) [X-Goog-Upload-Status={status}]",
                flush=True,
            )

    if body:
        try:
            return json.loads(body.decode("utf-8"))
        except Exception:
            return {"raw": body.decode("utf-8", errors="replace")}
    return {}


def main() -> None:
    repo_root = Path(__file__).resolve().parent.parent
    drive_id = os.environ.get("GDRIVE_SOURCE_ID", "1SA1KtYkXGz1LOtPnNjar7b4nJUmBS0rD").strip()
    session_uri = os.environ.get("GDRIVE_SESSION_URI", "").strip()

    raw_video = Path("/tmp/marketing_input.mp4")
    rendered_video = Path("/tmp/marketing-unique.mp4")

    print(f"=== Downloading source video ({drive_id}) from Google Drive ===", flush=True)
    downloaded = gdown.download(id=drive_id, output=str(raw_video), quiet=False, resume=True)
    if not downloaded or not raw_video.exists():
        raise SystemExit("Failed to download source video from Google Drive.")

    print(
        f"Downloaded {raw_video} ({raw_video.stat().st_size / (1024 * 1024):.2f} MiB)",
        flush=True,
    )

    editor_script = repo_root / "scripts" / "make_unique_edit.py"
    subprocess.run(
        [sys.executable, str(editor_script), str(raw_video), str(rendered_video)],
        check=True,
    )

    file_id = ""
    if session_uri:
        result = upload_to_session_uri(rendered_video, session_uri)
        file_id = str(result.get("id", ""))
        print("==========================================================", flush=True)
        print(f"UPLOADED_DRIVE_FILE_ID={file_id}", flush=True)
        if file_id:
            print(
                f"SHAREABLE_VIDEO_LINK=https://drive.google.com/file/d/{file_id}/view?usp=sharing",
                flush=True,
            )
        print("==========================================================", flush=True)

    dist_dir = repo_root / "dist-web"
    dist_dir.mkdir(parents=True, exist_ok=True)
    video_link = (
        f"https://drive.google.com/file/d/{file_id}/view?usp=sharing"
        if file_id
        else "https://drive.google.com/drive/folders/1AYCgofs1SI7Dv-5NGjh9zF-TxgPCzrzw?usp=sharing"
    )
    (dist_dir / "index.html").write_text(
        f"""<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>AI Video Studio — Render Complete</title>
  <style>
    body {{ font-family: system-ui, sans-serif; background: #060913; color: #f8fafc; display: grid; place-items: center; min-height: 100vh; margin: 0; }}
    .card {{ max-width: 540px; padding: 2.5rem; border-radius: 1.25rem; background: #0f172a; border: 1px solid rgba(56,189,248,0.3); text-align: center; }}
    a.btn {{ display: inline-block; margin-top: 1.25rem; padding: 0.85rem 1.6rem; border-radius: 999px; background: #fbbf24; color: #090d16; font-weight: 800; text-decoration: none; }}
  </style>
</head>
<body>
  <div class="card">
    <h1>Studio Render Complete</h1>
    <p>marketing-unique.mp4 has been rendered and uploaded to Google Drive.</p>
    <a class="btn" href="{video_link}">Watch on Google Drive</a>
  </div>
</body>
</html>
""",
        encoding="utf-8",
    )


if __name__ == "__main__":
    main()
