#!/usr/bin/env python3
"""Build the final youth-camp cut, mixed audio, and Remotion edit plan.

Uses only the MD5-verified Google Drive source MP4s, their extracted audio,
two-pass Whisper word timings, VAD silence boundaries, waveform energy, and the
pre-existing Drive music bed.
"""

from __future__ import annotations

import json
import math
import re
import subprocess
from dataclasses import dataclass, asdict
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parent.parent
WORK = ROOT / ".cache" / "youth-camp-work"
ANALYSIS = WORK / "analysis"
RAW = ROOT / ".cache" / "raw"
PUBLIC = ROOT / "public" / "edit"
DRIVE_MUSIC = ROOT / "google_drive" / "amapiano beats.mp3"
OUT_WAV = PUBLIC / "audio.wav"
OUT_CUT = PUBLIC / "cut.mp4"

FPS = 30
VIDEO_SRC = "edit/cut.mp4"
AUDIO_SRC = "edit/audio.wav"
CTA_HEADLINE = "SEND YOUR TEEN TO CAMP"
CTA_DATES = "30th November to 5th December 2026"

SOURCES = {
    "short1": {
        "file": RAW / "short1.mp4",
        "wav": WORK / "audio" / "short1.wav",
        "md5": "0241e46dfbaba2c5c85648957297b5c8",
        "duration": 551.194,
    },
    "short2": {
        "file": RAW / "short2.mp4",
        "wav": WORK / "audio" / "short2.wav",
        "md5": "0e70c4f806baf4ecc8a8ae0012e74df0",
        "duration": 305.189,
    },
}

# Candidate ranges come from the second-pass transcript segment boundaries.
# Each is snapped to the nearest VAD silence gap before cutting.
CLIP_SPECS: list[dict[str, Any]] = [
    {
        "source": "short1",
        "start": 4.72,
        "end": 17.32,
        "callout": {
            "label": "WHY YOUTH CAMP?",
            "color": "#3FE0FF",
            "compact": False,
            "offset": 1.0,
            "duration": 5.0,
        },
    },
    {
        "source": "short2",
        "start": 1.36,
        "end": 13.96,
        "callout": {
            "label": "PURSUE  OVERTAKE  RECOVER ALL",
            "color": "#FF8A3D",
            "compact": True,
            "offset": 1.0,
            "duration": 5.5,
        },
    },
    {
        "source": "short1",
        "start": 70.48,
        "end": 81.86,
        "callout": {
            "label": "ONE OR TWO SENTENCES CAN STAY",
            "color": "#FFD84D",
            "compact": False,
            "offset": 1.0,
            "duration": 5.5,
        },
    },
    {
        "source": "short2",
        "start": 39.94,
        "end": 51.54,
        "callout": {
            "label": "SOCIAL CAPITAL  SPIRITUAL COVERING",
            "color": "#3FE0FF",
            "compact": False,
            "offset": 1.0,
            "duration": 6.0,
        },
    },
    {
        "source": "short2",
        "start": 75.18,
        "end": 80.70,
        "callout": {
            "label": "PURSUE  OVERTAKE  RECOVER ALL",
            "color": "#FFD84D",
            "compact": True,
            "offset": 0.6,
            "duration": 4.2,
        },
    },
    {
        "source": "short2",
        "start": 184.18,
        "end": 191.26,
        "callout": {
            "label": "IDENTITY ROOTED IN CHRIST",
            "color": "#FFB35C",
            "compact": True,
            "offset": 0.8,
            "duration": 4.8,
        },
    },
    {
        "source": "short1",
        "start": 500.22,
        "end": 506.48,
        "callout": {
            "label": "COURAGE  COMMUNITY  NEW FRIENDS",
            "color": "#3FE0FF",
            "compact": False,
            "offset": 0.4,
            "duration": 4.5,
        },
    },
]

KEYWORD_ACCENTS = {
    "youth": "yellow",
    "camp": "yellow",
    "teenager": "yellow",
    "teenagers": "yellow",
    "holy": "cyan",
    "spirit": "cyan",
    "pursue": "orange",
    "pursuing": "orange",
    "overtake": "orange",
    "overtaking": "orange",
    "recover": "orange",
    "courage": "yellow",
    "social": "cyan",
    "capital": "cyan",
    "spiritual": "cyan",
    "covering": "cyan",
    "identity": "orange",
    "christ": "orange",
    "friends": "yellow",
    "community": "yellow",
    "hannah": "yellow",
    "samuel": "yellow",
}



@dataclass
class Clip:
    source: str
    start: float
    end: float
    timeline_start: float
    duration: float
    callout: dict[str, Any]
    start_gap: dict[str, float] | None
    end_gap: dict[str, float] | None


def ffmpeg_exe() -> str:
    import imageio_ffmpeg

    return imageio_ffmpeg.get_ffmpeg_exe()


def run(cmd: list[str]) -> None:
    print("+", " ".join(cmd[:10]), "..." if len(cmd) > 10 else "", flush=True)
    subprocess.run(cmd, cwd=ROOT, check=True)


def load_vad(key: str) -> tuple[list[dict[str, float]], list[dict[str, float]]]:
    import soundfile as sf
    from faster_whisper.vad import VadOptions, get_speech_timestamps

    wav = SOURCES[key]["wav"]
    data, samplerate = sf.read(str(wav), dtype="float32")
    speech = get_speech_timestamps(
        data,
        VadOptions(min_silence_duration_ms=350, speech_pad_ms=200),
        sampling_rate=samplerate,
    )
    segments = [
        {"start": round(item["start"] / samplerate, 3), "end": round(item["end"] / samplerate, 3)}
        for item in speech
    ]
    gaps: list[dict[str, float]] = []
    previous_end = 0.0
    for segment in segments:
        if segment["start"] - previous_end >= 0.15:
            gaps.append(
                {
                    "start": round(previous_end, 3),
                    "end": round(segment["start"], 3),
                    "duration": round(segment["start"] - previous_end, 3),
                }
            )
        previous_end = segment["end"]
    if SOURCES[key]["duration"] - previous_end >= 0.15:
        gaps.append(
            {
                "start": round(previous_end, 3),
                "end": round(SOURCES[key]["duration"], 3),
                "duration": round(SOURCES[key]["duration"] - previous_end, 3),
            }
        )
    (ANALYSIS / f"{key}-vad.json").write_text(json.dumps({"speech": segments, "gaps": gaps}, indent=2))
    return segments, gaps


def nearest_gap(gaps: list[dict[str, float]], target: float, tolerance: float = 1.2) -> dict[str, float] | None:
    candidates = [gap for gap in gaps if abs(gap["start"] - target) <= tolerance or abs(gap["end"] - target) <= tolerance]
    if not candidates:
        return None
    return min(candidates, key=lambda gap: min(abs(gap["start"] - target), abs(gap["end"] - target)))


def snap_boundaries(spec: dict[str, Any], gaps: list[dict[str, float]]) -> tuple[float, float, dict[str, float] | None, dict[str, float] | None]:
    start_gap = nearest_gap(gaps, spec["start"])
    end_gap = nearest_gap(gaps, spec["end"])
    start = spec["start"]
    end = spec["end"]
    if start_gap:
        # Begin just after the pause so the first audible word is clean.
        start = min(start_gap["end"] + 0.02, spec["end"] - 0.5)
    if end_gap:
        # End just before the next phrase starts.
        end = max(end_gap["start"] - 0.02, start + 0.5)
    return round(start, 3), round(end, 3), start_gap, end_gap


def clean_word(text: str) -> str:
    return re.sub(r"^[^\w']+|[^\w']+$", "", text).strip()


def accent_for(text: str) -> str | None:
    return KEYWORD_ACCENTS.get(clean_word(text).lower())


def words_in_range(transcript: dict[str, Any], start: float, end: float) -> list[dict[str, Any]]:
    words: list[dict[str, Any]] = []
    for segment in transcript["segments"]:
        for word in segment.get("words", []):
            if word["end"] > start and word["start"] < end:
                words.append(
                    {
                        "word": word["word"],
                        "start": max(float(word["start"]), start),
                        "end": min(float(word["end"]), end),
                        "probability": word.get("probability", 0.0),
                    }
                )
    return words


def build_captions(clips: list[Clip], transcripts: dict[str, Any]) -> list[dict[str, Any]]:
    cues: list[dict[str, Any]] = []
    for clip in clips:
        words = words_in_range(transcripts[clip.source], clip.start, clip.end)
        shift = clip.timeline_start - clip.start
        pending: list[dict[str, Any]] = []
        for word in words:
            text = clean_word(word["word"])
            if not text:
                continue
            item = {
                "text": text,
                "start": round(word["start"] + shift, 3),
                "end": round(max(word["end"], word["start"] + 0.08) + shift, 3),
                "accent": accent_for(word["word"]),
            }
            pending.append(item)
            too_many = len(pending) >= 5
            too_long = pending[-1]["end"] - pending[0]["start"] >= 2.4
            if too_many or too_long:
                cues.append(
                    {
                        "start": round(max(clip.timeline_start, pending[0]["start"] - 0.04), 3),
                        "end": round(pending[-1]["end"] + 0.12, 3),
                        "words": pending,
                    }
                )
                pending = []
        if pending:
            cues.append(
                {
                    "start": round(max(clip.timeline_start, pending[0]["start"] - 0.04), 3),
                    "end": round(pending[-1]["end"] + 0.12, 3),
                    "words": pending,
                }
            )
    return cues


def envelope_for(key: str) -> list[float]:
    return json.loads((ANALYSIS / f"{key}-audio.json").read_text())["envelope"]


def word_energy(envelope: list[float], start: float, end: float) -> float:
    a = max(0, int(start / 0.05))
    b = min(len(envelope), max(a + 1, int(end / 0.05)))
    return float(sum(envelope[a:b]) / max(1, b - a))


def build_punch_ins(clips: list[Clip], transcripts: dict[str, Any]) -> list[dict[str, Any]]:
    candidates: list[tuple[float, dict[str, Any]]] = []
    for clip in clips:
        envelope = envelope_for(clip.source)
        shift = clip.timeline_start - clip.start
        for word in words_in_range(transcripts[clip.source], clip.start, clip.end):
            text = clean_word(word["word"])
            if not text or not accent_for(word["word"]):
                continue
            energy = word_energy(envelope, word["start"], word["end"])
            candidates.append(
                (
                    energy,
                    {
                        "start": round(max(clip.timeline_start, word["start"] + shift - 0.08), 3),
                        "end": round(min(clip.timeline_start + clip.duration, word["end"] + shift + 0.16), 3),
                        "scale": 1.045,
                        "word": text,
                        "energyDb": round(energy, 2),
                    },
                )
            )
    candidates.sort(key=lambda item: item[0], reverse=True)
    selected = [event for _, event in candidates[:10]]
    selected.sort(key=lambda event: event["start"])
    for event in selected:
        event.pop("word", None)
        event.pop("energyDb", None)
    return selected


def build_callouts(clips: list[Clip]) -> list[dict[str, Any]]:
    callouts: list[dict[str, Any]] = []
    for clip in clips:
        spec = clip.callout
        start = clip.timeline_start + min(spec["offset"], max(0.0, clip.duration - 0.5))
        end = min(clip.timeline_start + clip.duration - 0.1, start + spec["duration"])
        callouts.append(
            {
                "start": round(start, 3),
                "end": round(max(start + 0.5, end), 3),
                "label": spec["label"],
                "color": spec["color"],
                "compact": spec["compact"],
            }
        )
    return callouts


def build_reframe_points(clips: list[Clip], total_duration: float) -> list[dict[str, float]]:
    xs = [52.0, 51.0, 53.0, 52.0, 50.5, 52.0, 51.0, 52.0]
    points = [{"t": 0.0, "x": xs[0]}]
    for index, clip in enumerate(clips[1:], start=1):
        points.append({"t": round(clip.timeline_start, 3), "x": xs[index % len(xs)]})
    points.append({"t": round(total_duration, 3), "x": 52.0})
    return points


def write_edit_plan(
    clips: list[Clip],
    captions: list[dict[str, Any]],
    callouts: list[dict[str, Any]],
    punch_ins: list[dict[str, Any]],
    reframe_points: list[dict[str, float]],
    total_duration: float,
) -> None:
    plan = {
        "fps": FPS,
        "width": 1080,
        "height": 1920,
        "durationSeconds": round(total_duration, 3),
        "videoSrc": VIDEO_SRC,
        "audioSrc": AUDIO_SRC,
        "captions": captions,
        "callouts": callouts,
        "punchIns": punch_ins,
        "reframe": {"sourceWidth": 1280, "points": reframe_points},
        "cta": {
            "start": round(max(0.0, total_duration - 6.0), 3),
            "headline": CTA_HEADLINE,
            "dates": CTA_DATES,
        },
    }
    types = """export type AccentColor = \"yellow\" | \"orange\" | \"cyan\" | null;

export type CaptionWord = {
  text: string;
  start: number;
  end: number;
  accent: AccentColor;
};

export type CaptionCue = {
  start: number;
  end: number;
  words: CaptionWord[];
};

export type CalloutEvent = {
  start: number;
  end: number;
  label: string;
  color: string;
  compact: boolean;
};

export type PunchInEvent = {
  start: number;
  end: number;
  scale: number;
};

export type ReframePoint = {
  t: number;
  x: number;
};

export type EditPlan = {
  fps: number;
  width: number;
  height: number;
  durationSeconds: number;
  videoSrc: string;
  audioSrc: string;
  captions: CaptionCue[];
  callouts: CalloutEvent[];
  punchIns: PunchInEvent[];
  reframe: {
    sourceWidth: number;
    points: ReframePoint[];
  };
  cta: {
    start: number;
    headline: string;
    dates: string;
  };
};

"""
    body = json.dumps(plan, indent=2, ensure_ascii=False)
    (ROOT / "src" / "data" / "editPlan.ts").write_text(
        types + "export const editPlan: EditPlan = " + body + ";\n"
    )
    print(f"Wrote edit plan: {len(captions)} caption cues, {len(callouts)} callouts, {len(punch_ins)} punch-ins")


def build_video(clips: list[Clip], total_duration: float) -> None:
    ff = ffmpeg_exe()
    PUBLIC.mkdir(parents=True, exist_ok=True)
    cmd: list[str] = [ff, "-y", "-hide_banner", "-loglevel", "error"]
    for clip in clips:
        cmd += [
            "-ss", f"{clip.start:.3f}",
            "-t", f"{clip.duration + 0.6:.3f}",
            "-i", str(SOURCES[clip.source]["file"]),
        ]
    filters: list[str] = []
    for index, clip in enumerate(clips):
        filters.append(
            f"[{index}:v]trim=duration={clip.duration:.3f},setpts=PTS-STARTPTS,"
            "fps=30,scale=1280:720:flags=lanczos,setsar=1,format=yuv420p"
            f"[v{index}]"
        )
    concat_inputs = "".join(f"[v{index}]" for index in range(len(clips)))
    filters.append(f"{concat_inputs}concat=n={len(clips)}:v=1:a=0[vout]")
    total_frames = math.ceil(total_duration * FPS)
    cmd += [
        "-filter_complex", ";".join(filters),
        "-map", "[vout]", "-an",
        "-c:v", "libx264", "-preset", "medium", "-crf", "18",
        "-pix_fmt", "yuv420p", "-r", str(FPS),
        "-frames:v", str(total_frames),
        "-movflags", "+faststart", str(OUT_CUT),
    ]
    run(cmd)


def build_audio(clips: list[Clip], total_duration: float) -> None:
    ff = ffmpeg_exe()
    cmd: list[str] = [ff, "-y", "-hide_banner", "-loglevel", "error"]
    for clip in clips:
        cmd += [
            "-ss", f"{clip.start:.3f}",
            "-t", f"{clip.duration + 0.6:.3f}",
            "-i", str(SOURCES[clip.source]["file"]),
        ]
    cmd += ["-stream_loop", "-1", "-i", str(DRIVE_MUSIC)]
    filters: list[str] = []
    for index, clip in enumerate(clips):
        filters.append(
            f"[{index}:a]atrim=duration={clip.duration:.3f},asetpts=PTS-STARTPTS,"
            "aresample=48000,aformat=sample_fmts=fltp:channel_layouts=stereo"
            f"[a{index}]"
        )
    concat_inputs = "".join(f"[a{index}]" for index in range(len(clips)))
    filters.append(f"{concat_inputs}concat=n={len(clips)}:v=0:a=1[voiceRaw]")
    music_index = len(clips)
    fade_out = max(0.0, total_duration - 2.0)
    filters.append(
        f"[{music_index}:a]atrim=duration={total_duration:.3f},asetpts=PTS-STARTPTS,"
        "aresample=48000,aformat=sample_fmts=fltp:channel_layouts=stereo,volume=0.16,"
        f"afade=t=in:st=0:d=1,afade=t=out:st={fade_out:.3f}:d=2[music]"
    )
    filters.append("[voiceRaw]asplit=2[voiceMain][voiceSide]")
    filters.append("[music][voiceSide]sidechaincompress=threshold=0.03:ratio=8:attack=20:release=250[ducked]")
    filters.append("[voiceMain][ducked]amix=inputs=2:duration=first:dropout_transition=0,alimiter=limit=0.95[out]")
    cmd += [
        "-filter_complex", ";".join(filters),
        "-map", "[out]", "-t", f"{total_duration:.3f}",
        "-c:a", "pcm_s16le", "-ar", "48000", "-ac", "2", str(OUT_WAV),
    ]
    run(cmd)


def main() -> None:
    PUBLIC.mkdir(parents=True, exist_ok=True)
    transcripts = {
        key: json.loads((ANALYSIS / f"{key}-transcript-v2.json").read_text())
        for key in SOURCES
    }
    vad: dict[str, tuple[list[dict[str, float]], list[dict[str, float]]]] = {
        key: load_vad(key) for key in SOURCES
    }
    clips: list[Clip] = []
    timeline = 0.0
    for spec in CLIP_SPECS:
        _, gaps = vad[spec["source"]]
        start, end, start_gap, end_gap = snap_boundaries(spec, gaps)
        duration = round(end - start, 3)
        clips.append(
            Clip(
                source=spec["source"],
                start=start,
                end=end,
                timeline_start=round(timeline, 3),
                duration=duration,
                callout=spec["callout"],
                start_gap=start_gap,
                end_gap=end_gap,
            )
        )
        timeline += duration
    total_duration = round(timeline, 3)
    captions = build_captions(clips, transcripts)
    callouts = build_callouts(clips)
    punch_ins = build_punch_ins(clips, transcripts)
    reframe_points = build_reframe_points(clips, total_duration)
    write_edit_plan(clips, captions, callouts, punch_ins, reframe_points, total_duration)
    build_video(clips, total_duration)
    build_audio(clips, total_duration)

    report = {
        "sourceMd5": {key: info["md5"] for key, info in SOURCES.items()},
        "transcriptModel": "whisper-small-ct2-int8-v2",
        "transcriptPasses": 2,
        "musicBed": str(DRIVE_MUSIC.relative_to(ROOT)),
        "musicMd5": "40d543a87a0e7b03b219f77ba5e7356a",
        "totalDurationSeconds": total_duration,
        "cta": {"headline": CTA_HEADLINE, "dates": CTA_DATES, "start": round(total_duration - 6.0, 3)},
        "clips": [asdict(clip) for clip in clips],
        "captionCueCount": len(captions),
        "calloutCount": len(callouts),
        "punchInCount": len(punch_ins),
        "outputs": {"video": str(OUT_CUT.relative_to(ROOT)), "audio": str(OUT_WAV.relative_to(ROOT))},
    }
    (ANALYSIS / "edit-report.json").write_text(json.dumps(report, indent=2))
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
