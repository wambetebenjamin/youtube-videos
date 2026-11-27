#!/usr/bin/env python3
"""Second-pass, repetition-resistant transcription of the verified source audio."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from faster_whisper import WhisperModel
import soundfile as sf

ROOT = Path(__file__).resolve().parent.parent
AUDIO = ROOT / ".cache" / "youth-camp-work" / "audio"
ANALYSIS = ROOT / ".cache" / "youth-camp-work" / "analysis"
MODEL = ROOT / ".cache" / "models" / "whisper-small-ct2"

INITIAL_PROMPT = (
    "A Christian youth camp message to parents and teenagers. "
    "Themes: Pursue, Overtake, Recover All, Hannah, Samuel, courage, "
    "social capital, spiritual covering, parents watching from home."
)
HOTWORDS = (
    "Pursue Overtake Recover All Hannah Samuel youth camp social capital "
    "spiritual covering courage Holy Spirit parents teenagers"
)

PARAMS = dict(
    language="en",
    task="transcribe",
    beam_size=5,
    temperature=0,
    word_timestamps=True,
    vad_filter=True,
    vad_parameters={"min_silence_duration_ms": 350},
    condition_on_previous_text=False,
    initial_prompt=INITIAL_PROMPT,
    chunk_length=30,
    hallucination_silence_threshold=1.0,
    no_repeat_ngram_size=3,
    repetition_penalty=1.15,
    compression_ratio_threshold=1.8,
    log_prob_threshold=-0.8,
    no_speech_threshold=0.5,
    hotwords=HOTWORDS,
)


def main() -> None:
    model = WhisperModel(str(MODEL), device="cpu", compute_type="int8", local_files_only=True)
    for key in ("short1", "short2"):
        wav = AUDIO / f"{key}.wav"
        data, samplerate = sf.read(str(wav), dtype="float32")
        print(f"Transcribing {key} ({len(data) / samplerate:.1f}s)", flush=True)
        segments_iter, info = model.transcribe(data, **PARAMS)
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
                print(f"  {key}: {len(segments)} segments", flush=True)
        text = " ".join(segment["text"].strip() for segment in segments)
        payload = {
            "source": key,
            "model": "whisper-small-ct2-int8-v2",
            "language": getattr(info, "language", "en"),
            "duration": getattr(info, "duration", None),
            "parameters": {k: str(v) for k, v in PARAMS.items()},
            "segments": segments,
            "text": text,
        }
        (ANALYSIS / f"{key}-transcript-v2.json").write_text(json.dumps(payload, indent=2))
        (ANALYSIS / f"{key}-transcript-v2.txt").write_text(text)
        print(f"Wrote {key}-transcript-v2 ({len(segments)} segments)", flush=True)


if __name__ == "__main__":
    main()
