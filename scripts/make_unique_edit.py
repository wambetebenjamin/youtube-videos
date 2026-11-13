#!/usr/bin/env python3
"""
AI Video Studio — Automated Unique Vertical Reel / Video Editor
---------------------------------------------------------------
Transforms a raw video (e.g. public/raw-footage/marketing.mp4) into a
high-retention, studio-polished edit:
  1. Detects & trims dead-air silences while preserving natural speech breath
  2. Alternates wide (1.00x) and punch-in (1.09x) framing across cuts
  3. Applies cinema color grade, optical micro-sharpening, and subtle vignette
  4. Transcribes speech with word-level timestamps via faster-whisper
  5. Generates word-by-word pop-highlight karaoke captions (ASS)
  6. Renders a custom glassmorphic Opening Hook Card + top progress bar (Pillow)
  7. Masters vocal audio (EQ + gentle compression + -14 LUFS loudnorm)
"""

from __future__ import annotations

import argparse
import json
import math
import os
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path
from typing import Any


def find_binary(name: str) -> str:
    found = shutil.which(name)
    if found:
        return found
    if name == "ffmpeg":
        try:
            import imageio_ffmpeg  # type: ignore

            return imageio_ffmpeg.get_ffmpeg_exe()
        except Exception:
            pass
    raise RuntimeError(f"Required binary '{name}' not found on PATH.")


def probe_video(ffmpeg_bin: str, input_path: Path) -> dict[str, Any]:
    ffprobe_bin = shutil.which("ffprobe")
    if ffprobe_bin:
        cmd = [
            ffprobe_bin,
            "-v",
            "quiet",
            "-print_format",
            "json",
            "-show_format",
            "-show_streams",
            str(input_path),
        ]
        res = subprocess.run(cmd, capture_output=True, text=True, check=True)
        data = json.loads(res.stdout)
        width, height, fps = 1080, 1920, 30.0
        rotation = 0
        has_audio = False
        video_found = False
        for stream in data.get("streams", []):
            if stream.get("codec_type") == "video" and not video_found:
                video_found = True
                width = int(stream.get("width", 1080))
                height = int(stream.get("height", 1920))
                rot_tag = stream.get("tags", {}).get("rotate")
                if rot_tag is not None:
                    try:
                        rotation = int(round(float(rot_tag)))
                    except ValueError:
                        pass
                for sd in stream.get("side_data_list", []):
                    if "rotation" in sd:
                        try:
                            rotation = int(round(float(sd["rotation"])))
                        except ValueError:
                            pass
                r_fps = stream.get("avg_frame_rate") or stream.get("r_frame_rate", "30/1")
                if "/" in r_fps:
                    num, den = r_fps.split("/", 1)
                    if float(den) > 0:
                        fps = float(num) / float(den)
            elif stream.get("codec_type") == "audio":
                has_audio = True
        if abs(rotation) % 180 == 90:
            width, height = height, width
        duration = float(data.get("format", {}).get("duration", 0.0))
        return {
            "width": width,
            "height": height,
            "fps": round(min(max(fps, 24.0), 30.0), 3),
            "duration": duration,
            "has_audio": has_audio,
        }

    # Fallback parser using `ffmpeg -i` stderr when ffprobe isn't installed
    res = subprocess.run([ffmpeg_bin, "-hide_banner", "-i", str(input_path)], capture_output=True, text=True)
    info = res.stderr
    dur_m = re.search(r"Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)", info)
    duration = 0.0
    if dur_m:
        duration = int(dur_m.group(1)) * 3600 + int(dur_m.group(2)) * 60 + float(dur_m.group(3))
    dim_m = re.search(r"Video:.*?,\s*(\d{2,5})x(\d{2,5})", info)
    width = int(dim_m.group(1)) if dim_m else 1080
    height = int(dim_m.group(2)) if dim_m else 1920
    rot_m = re.search(r"rotation of\s*(-?\d+(?:\.\d+)?)\s*degrees", info, re.IGNORECASE)
    if rot_m and abs(int(round(float(rot_m.group(1))))) % 180 == 90:
        width, height = height, width
    fps_m = re.search(r"(\d+(?:\.\d+)?)\s*fps", info)
    fps = float(fps_m.group(1)) if fps_m else 30.0
    has_audio = "Audio:" in info
    return {
        "width": width,
        "height": height,
        "fps": round(min(max(fps, 24.0), 30.0), 3),
        "duration": duration,
        "has_audio": has_audio,
    }


def detect_speech_ranges(
    ffmpeg_bin: str, input_path: Path, duration: float, has_audio: bool
) -> list[tuple[float, float]]:
    if not has_audio or duration <= 3.0:
        return [(0.0, duration)]

    cmd = [
        ffmpeg_bin,
        "-hide_banner",
        "-i",
        str(input_path),
        "-af",
        "silencedetect=noise=-33dB:d=0.45",
        "-f",
        "null",
        "-",
    ]
    res = subprocess.run(cmd, capture_output=True, text=True)
    log = res.stderr

    starts = [float(x) for x in re.findall(r"silence_start:\s*([0-9.]+)", log)]
    ends = [float(x) for x in re.findall(r"silence_end:\s*([0-9.]+)", log)]

    silences: list[tuple[float, float]] = []
    for idx, s_start in enumerate(starts):
        s_end = ends[idx] if idx < len(ends) else duration
        if s_end - s_start >= 0.45:
            silences.append((max(0.0, s_start), min(duration, s_end)))

    if not silences:
        # Create dynamic editorial cuts every ~4.5s even when audio is continuous
        step = 4.5
        ranges = []
        t = 0.0
        while t < duration:
            nxt = min(duration, t + step)
            if duration - nxt < 1.2:
                nxt = duration
            ranges.append((round(t, 3), round(nxt, 3)))
            t = nxt
        return ranges

    pad = 0.12
    keep: list[tuple[float, float]] = []
    cursor = 0.0
    for s_start, s_end in silences:
        seg_end = min(duration, s_start + pad)
        if seg_end - cursor >= 0.35:
            keep.append((round(cursor, 3), round(seg_end, 3)))
        cursor = max(cursor, max(0.0, s_end - pad))

    if duration - cursor >= 0.35:
        keep.append((round(cursor, 3), round(duration, 3)))

    if not keep:
        return [(0.0, duration)]

    # Split very long continuous speech segments (>6.5s) at midpoints for punch-in variety
    split_keep: list[tuple[float, float]] = []
    for seg_s, seg_e in keep:
        length = seg_e - seg_s
        if length > 7.0:
            parts = max(2, int(round(length / 4.8)))
            chunk = length / parts
            for i in range(parts):
                cs = seg_s + i * chunk
                ce = seg_e if i == parts - 1 else seg_s + (i + 1) * chunk
                split_keep.append((round(cs, 3), round(ce, 3)))
        else:
            split_keep.append((seg_s, seg_e))

    return split_keep


def render_trimmed_and_graded(
    ffmpeg_bin: str,
    input_path: Path,
    ranges: list[tuple[float, float]],
    width: int,
    height: int,
    fps: float,
    has_audio: bool,
    stage1_out: Path,
) -> float:
    even_w = width - (width % 2)
    even_h = height - (height % 2)
    zoom_w = int(round(even_w * 1.09))
    zoom_h = int(round(even_h * 1.09))
    zoom_w -= zoom_w % 2
    zoom_h -= zoom_h % 2
    crop_x = max(0, (zoom_w - even_w) // 2)
    crop_y = max(0, int((zoom_h - even_h) * 0.36))

    v_parts: list[str] = []
    a_parts: list[str] = []
    concat_inputs: list[str] = []

    for i, (s, e) in enumerate(ranges):
        if i % 2 == 1:
            scale_crop = (
                f"scale={zoom_w}:{zoom_h}:flags=lanczos,"
                f"crop={even_w}:{even_h}:{crop_x}:{crop_y}"
            )
        else:
            scale_crop = f"scale={even_w}:{even_h}:flags=lanczos"

        v_parts.append(
            f"[0:v]trim=start={s:.3f}:end={e:.3f},setpts=PTS-STARTPTS,"
            f"fps={fps:.3f},{scale_crop},setsar=1[v{i}]"
        )
        if has_audio:
            a_parts.append(
                f"[0:a]atrim=start={s:.3f}:end={e:.3f},asetpts=PTS-STARTPTS[a{i}]"
            )
            concat_inputs.append(f"[v{i}][a{i}]")
        else:
            concat_inputs.append(f"[v{i}]")

    n = len(ranges)
    grade = (
        "eq=contrast=1.07:saturation=1.14:brightness=0.012:gamma=0.98,"
        "unsharp=5:5:0.55:5:5:0.0,"
        "vignette=PI/7"
    )

    if has_audio:
        audio_master = (
            "highpass=f=80,"
            "equalizer=f=3200:t=q:w=1.2:g=2.0,"
            "acompressor=threshold=-18dB:ratio=2.4:attack=15:release=180,"
            "loudnorm=I=-14:TP=-1.5:LRA=11"
        )
        filter_complex = (
            ";".join(v_parts + a_parts)
            + f";{''.join(concat_inputs)}concat=n={n}:v=1:a=1[vc][ac];"
            + f"[vc]{grade}[vout];[ac]{audio_master}[aout]"
        )
        maps = ["-map", "[vout]", "-map", "[aout]", "-c:a", "aac", "-b:a", "192k"]
    else:
        filter_complex = (
            ";".join(v_parts)
            + f";{''.join(concat_inputs)}concat=n={n}:v=1:a=0[vc];"
            + f"[vc]{grade}[vout]"
        )
        maps = ["-map", "[vout]"]

    cmd = [
        ffmpeg_bin,
        "-hide_banner",
        "-y",
        "-i",
        str(input_path),
        "-filter_complex",
        filter_complex,
        *maps,
        "-c:v",
        "libx264",
        "-preset",
        "veryfast",
        "-crf",
        "19",
        "-pix_fmt",
        "yuv420p",
        str(stage1_out),
    ]
    subprocess.run(cmd, check=True)
    meta = probe_video(ffmpeg_bin, stage1_out)
    return float(meta["duration"])


def transcribe_words(stage1_video: Path, has_audio: bool) -> list[dict[str, Any]]:
    if not has_audio:
        return []
    try:
        from faster_whisper import WhisperModel  # type: ignore
    except Exception as exc:
        print(f"Note: faster-whisper unavailable ({exc}); skipping speech captions.")
        return []

    try:
        print("Transcribing audio with faster-whisper (word-level timestamps)...")
        model = WhisperModel("base", device="cpu", compute_type="int8")
        segments, _ = model.transcribe(
            str(stage1_video),
            word_timestamps=True,
            vad_filter=True,
        )
        words: list[dict[str, Any]] = []
        for seg in segments:
            for w in seg.words or []:
                cleaned = w.word.strip()
                if cleaned:
                    words.append(
                        {
                            "start": max(0.0, float(w.start)),
                            "end": max(float(w.start) + 0.08, float(w.end)),
                            "word": cleaned,
                        }
                    )
        print(f"Transcribed {len(words)} words.")
        return words
    except Exception as exc:
        print(f"Warning: transcription skipped ({exc}).")
        return []


def ass_timestamp(seconds: float) -> str:
    seconds = max(0.0, seconds)
    h = int(seconds // 3600)
    m = int((seconds % 3600) // 60)
    s = seconds % 60
    return f"{h}:{m:02d}:{s:05.2f}"


def escape_ass(text: str) -> str:
    return text.replace("\\", "").replace("{", "(").replace("}", ")")


def write_karaoke_ass(
    words: list[dict[str, Any]], width: int, height: int, ass_path: Path
) -> None:
    font_size = max(42, int(round(width * 0.052)))
    margin_v = int(round(height * 0.20))
    margin_lr = int(round(width * 0.09))

    header = f"""[Script Info]
ScriptType: v4.00+
PlayResX: {width}
PlayResY: {height}
WrapStyle: 2
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Karaoke,DejaVu Sans,{font_size},&H00FFFFFF,&H00FFFFFF,&H00120A06,&H80000000,-1,0,0,0,100,100,0.5,0,1,5.5,2.5,2,{margin_lr},{margin_lr},{margin_v},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
    lines = [header]
    if not words:
        ass_path.write_text("".join(lines), encoding="utf-8")
        return

    # Group words into punchy 2-3 word phrases (~20 chars max) so lines stay well inside safe margins
    phrases: list[list[dict[str, Any]]] = []
    cur: list[dict[str, Any]] = []
    for w in words:
        if cur:
            gap = w["start"] - cur[-1]["end"]
            prev_punct = cur[-1]["word"].endswith((".", "!", "?", ",", ";", ":"))
            cur_chars = sum(len(x["word"]) for x in cur) + len(w["word"]) + len(cur)
            if len(cur) >= 3 or cur_chars > 21 or gap > 0.55 or (len(cur) >= 2 and prev_punct):
                phrases.append(cur)
                cur = []
        cur.append(w)
    if cur:
        phrases.append(cur)

    for phrase in phrases:
        for idx, active in enumerate(phrase):
            t_start = active["start"]
            if idx + 1 < len(phrase):
                t_end = max(t_start + 0.08, phrase[idx + 1]["start"])
            else:
                t_end = max(t_start + 0.22, min(active["end"] + 0.18, active["start"] + 0.85))

            rendered_tokens: list[str] = []
            for j, token in enumerate(phrase):
                clean = escape_ass(token["word"].upper())
                if j == idx:
                    # Active word pops in bright warm gold (#FBBF24 -> BGR 24BFFB)
                    rendered_tokens.append(
                        r"{\c&H0024BFFB&\fscx112\fscy112}"
                        + clean
                        + r"{\c&H00FFFFFF&\fscx100\fscy100}"
                    )
                elif j < idx:
                    rendered_tokens.append(r"{\c&H00FFFFFF&}" + clean)
                else:
                    rendered_tokens.append(r"{\c&H00D8D4CE&}" + clean)

            dialogue = (
                f"Dialogue: 0,{ass_timestamp(t_start)},{ass_timestamp(t_end)},"
                f"Karaoke,,0,0,0,,{' '.join(rendered_tokens)}\n"
            )
            lines.append(dialogue)

    ass_path.write_text("".join(lines), encoding="utf-8")


def load_pil_font(size: int, bold: bool = True):
    from PIL import ImageFont  # type: ignore

    repo_font = Path(__file__).resolve().parent.parent / "public" / "fonts" / "DejaVuSans-Bold.ttf"
    candidates = [
        str(repo_font),
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
        if bold
        else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
        "/usr/share/fonts/truetype/freefont/FreeSansBold.ttf",
    ]
    for path in candidates:
        if os.path.exists(path):
            return ImageFont.truetype(path, size=size)
    return ImageFont.load_default()


def derive_hook_headline(words: list[dict[str, Any]], fallback_name: str) -> str:
    if words:
        opening: list[str] = []
        for w in words[:8]:
            tok = re.sub(r"[^\w'&-]", "", w["word"])
            if tok:
                opening.append(tok)
            if len(opening) >= 6 or w["word"].endswith((".", "!", "?")):
                break
        if len(opening) >= 3:
            return " ".join(opening).upper()
    stem = re.sub(r"[-_]+", " ", Path(fallback_name).stem).strip()
    return (stem.upper() if stem else "FEATURED HIGHLIGHT") + " — EXCLUSIVE EDIT"


def build_overlay_cards(
    width: int,
    height: int,
    hook_text: str,
    hook_png: Path,
    badge_png: Path,
) -> None:
    from PIL import Image, ImageDraw  # type: ignore

    # 1. Opening Hook Banner (full canvas width, dynamically sized to text)
    pad_x = int(round(width * 0.065))
    box_top = 20
    radius = int(round(width * 0.035))

    pill_font = load_pil_font(max(20, int(round(width * 0.024))), bold=True)
    pill_label = "SPOTLIGHT EDIT"
    dummy_img = Image.new("RGBA", (64, 64), (0, 0, 0, 0))
    dummy_draw = ImageDraw.Draw(dummy_img)
    pill_bbox = dummy_draw.textbbox((0, 0), pill_label, font=pill_font)
    pill_w = (pill_bbox[2] - pill_bbox[0]) + 36
    pill_h = (pill_bbox[3] - pill_bbox[1]) + 18
    pill_x = pad_x + 34
    pill_y = box_top + 28

    title_font = load_pil_font(max(32, int(round(width * 0.044))), bold=True)
    max_text_w = (width - 2 * pad_x) - 68
    tokens = hook_text.split()
    wrapped: list[str] = []
    cur_line = ""
    for tok in tokens:
        candidate = f"{cur_line} {tok}".strip()
        bbox = dummy_draw.textbbox((0, 0), candidate, font=title_font)
        if (bbox[2] - bbox[0]) <= max_text_w or not cur_line:
            cur_line = candidate
        else:
            wrapped.append(cur_line)
            cur_line = tok
            if len(wrapped) == 1:
                break
    if cur_line and len(wrapped) < 2:
        wrapped.append(cur_line)

    line_heights: list[int] = []
    for line in wrapped[:2]:
        lb = dummy_draw.textbbox((0, 0), line, font=title_font)
        line_heights.append((lb[3] - lb[1]) + 12)

    box_bot = pill_y + pill_h + 22 + sum(line_heights) + 26
    card_h = box_bot + 24

    img = Image.new("RGBA", (width, card_h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    draw.rounded_rectangle(
        [pad_x + 4, box_top + 8, width - pad_x + 4, box_bot + 8],
        radius=radius,
        fill=(0, 0, 0, 115),
    )
    draw.rounded_rectangle(
        [pad_x, box_top, width - pad_x, box_bot],
        radius=radius,
        fill=(8, 13, 27, 226),
        outline=(56, 189, 248, 165),
        width=3,
    )
    draw.rounded_rectangle(
        [pill_x, pill_y, pill_x + pill_w, pill_y + pill_h],
        radius=pill_h // 2,
        fill=(251, 191, 36, 255),
    )
    draw.text(
        (pill_x + 18, pill_y + 7),
        pill_label,
        font=pill_font,
        fill=(10, 15, 28, 255),
    )

    text_y = pill_y + pill_h + 22
    for idx, line in enumerate(wrapped[:2]):
        draw.text((pill_x, text_y), line, font=title_font, fill=(248, 250, 252, 255))
        text_y += line_heights[idx]

    img.save(hook_png)

    # 2. Subtle Top-Right Studio Pill Badge (shown after hook card fades)
    bw = int(round(width * 0.28))
    bh = int(round(height * 0.045))
    b_img = Image.new("RGBA", (bw, bh), (0, 0, 0, 0))
    b_draw = ImageDraw.Draw(b_img)
    b_draw.rounded_rectangle(
        [0, 0, bw - 2, bh - 2],
        radius=bh // 2,
        fill=(10, 15, 28, 175),
        outline=(251, 191, 36, 180),
        width=2,
    )
    b_font = load_pil_font(max(16, int(round(width * 0.021))), bold=True)
    label = "● STUDIO CUT"
    lb = b_draw.textbbox((0, 0), label, font=b_font)
    tx = max(10, (bw - (lb[2] - lb[0])) // 2)
    ty = max(4, (bh - (lb[3] - lb[1])) // 2 - 2)
    b_draw.text((tx, ty), label, font=b_font, fill=(251, 191, 36, 245))
    b_img.save(badge_png)


def render_final_composite(
    ffmpeg_bin: str,
    stage1_video: Path,
    ass_path: Path,
    hook_png: Path,
    badge_png: Path,
    width: int,
    height: int,
    duration: float,
    has_audio: bool,
    output_path: Path,
    max_mb: float = 75.0,
) -> None:
    even_w = width - (width % 2)
    bar_h = max(8, int(round(height * 0.006)))
    hook_y = int(round(height * 0.045))
    badge_x = even_w - int(round(width * 0.32))
    badge_y = int(round(height * 0.032))
    dur = max(1.0, duration)

    # Escape ASS path and bundled fonts directory for FFmpeg filter syntax
    def esc_ff(p: str) -> str:
        return p.replace("\\", "\\\\").replace(":", "\\:").replace("'", "\\'")

    escaped_ass = esc_ff(str(ass_path))
    fonts_dir = Path(__file__).resolve().parent.parent / "public" / "fonts"
    ass_filter = (
        f"ass=filename='{escaped_ass}':fontsdir='{esc_ff(str(fonts_dir))}'"
        if fonts_dir.exists()
        else f"ass=filename='{escaped_ass}'"
    )

    # Target video bitrate to stay cleanly under max_mb
    target_total_kbps = int((max_mb * 8192.0) / dur)
    video_max_kbps = max(1800, min(6500, target_total_kbps - 220))

    vf_complex = (
        f"color=c=0xFBBF24@0.95:s={even_w}x{bar_h}:d={dur:.3f}[pbar];"
        f"[1:v]format=rgba,fade=t=in:st=0:d=0.35:alpha=1,"
        f"fade=t=out:st=3.35:d=0.45:alpha=1[hook];"
        f"[2:v]format=rgba,fade=t=in:st=3.9:d=0.4:alpha=1[badge];"
        f"[0:v][hook]overlay=x=0:y={hook_y}:enable='between(t,0,3.9)'[v1];"
        f"[v1][badge]overlay=x={badge_x}:y={badge_y}:enable='gte(t,3.9)'[v2];"
        f"[v2]{ass_filter},"
        f"drawbox=x=0:y=0:w={even_w}:h={bar_h}:color=black@0.45:t=fill[v3];"
        f"[v3][pbar]overlay=x='-{even_w}+({even_w})*min(1,t/{dur:.3f})':y=0:shortest=1[vout]"
    )

    audio_args = ["-map", "0:a", "-c:a", "copy"] if has_audio else []

    cmd = [
        ffmpeg_bin,
        "-hide_banner",
        "-y",
        "-i",
        str(stage1_video),
        "-loop",
        "1",
        "-t",
        "4.2",
        "-i",
        str(hook_png),
        "-loop",
        "1",
        "-t",
        f"{dur:.3f}",
        "-i",
        str(badge_png),
        "-filter_complex",
        vf_complex,
        "-map",
        "[vout]",
        *audio_args,
        "-c:v",
        "libx264",
        "-preset",
        "medium",
        "-crf",
        "21",
        "-maxrate",
        f"{video_max_kbps}k",
        "-bufsize",
        f"{video_max_kbps * 2}k",
        "-pix_fmt",
        "yuv420p",
        "-movflags",
        "+faststart",
        str(output_path),
    ]
    subprocess.run(cmd, check=True)


def main() -> None:
    parser = argparse.ArgumentParser(description="Create a unique studio-polished video edit.")
    parser.add_argument(
        "input",
        nargs="?",
        default="public/raw-footage/marketing.mp4",
        help="Input video path (default: public/raw-footage/marketing.mp4)",
    )
    parser.add_argument(
        "output",
        nargs="?",
        default="out/marketing-unique.mp4",
        help="Output video path (default: out/marketing-unique.mp4)",
    )
    args = parser.parse_args()

    input_path = Path(args.input).resolve()
    output_path = Path(args.output).resolve()
    if not input_path.exists():
        raise SystemExit(f"Error: Input video not found at {input_path}")

    output_path.parent.mkdir(parents=True, exist_ok=True)
    ffmpeg_bin = find_binary("ffmpeg")

    print(f"[1/5] Probing {input_path.name}...")
    meta = probe_video(ffmpeg_bin, input_path)
    print(
        f"      Source: {meta['width']}x{meta['height']} @ {meta['fps']} fps, "
        f"duration={meta['duration']:.2f}s, audio={meta['has_audio']}"
    )

    with tempfile.TemporaryDirectory(prefix="ai-video-studio-") as tmp_str:
        tmp = Path(tmp_str)
        print("[2/5] Detecting silences & planning dynamic punch-in cuts...")
        ranges = detect_speech_ranges(
            ffmpeg_bin, input_path, meta["duration"], meta["has_audio"]
        )
        kept_dur = sum(e - s for s, e in ranges)
        print(
            f"      Planned {len(ranges)} editorial cuts "
            f"({meta['duration']:.1f}s -> {kept_dur:.1f}s tightened timeline)."
        )

        stage1_video = tmp / "stage1_graded.mp4"
        print("[3/5] Rendering jump cuts, punch-in zooms, cinema grade & -14 LUFS audio...")
        new_duration = render_trimmed_and_graded(
            ffmpeg_bin=ffmpeg_bin,
            input_path=input_path,
            ranges=ranges,
            width=meta["width"],
            height=meta["height"],
            fps=meta["fps"],
            has_audio=meta["has_audio"],
            stage1_out=stage1_video,
        )

        print("[4/5] Generating word-level karaoke captions & custom graphics...")
        words = transcribe_words(stage1_video, meta["has_audio"])
        ass_path = tmp / "captions.ass"
        write_karaoke_ass(words, meta["width"], meta["height"], ass_path)

        hook_headline = derive_hook_headline(words, input_path.name)
        hook_png = tmp / "hook_card.png"
        badge_png = tmp / "studio_badge.png"
        build_overlay_cards(meta["width"], meta["height"], hook_headline, hook_png, badge_png)

        print(f"[5/5] Compositing final H.264 master -> {output_path} ...")
        render_final_composite(
            ffmpeg_bin=ffmpeg_bin,
            stage1_video=stage1_video,
            ass_path=ass_path,
            hook_png=hook_png,
            badge_png=badge_png,
            width=meta["width"],
            height=meta["height"],
            duration=new_duration,
            has_audio=meta["has_audio"],
            output_path=output_path,
        )

    size_mb = output_path.stat().st_size / (1024 * 1024)
    print(f"Done! Exported {output_path} ({size_mb:.2f} MiB)")


if __name__ == "__main__":
    main()
