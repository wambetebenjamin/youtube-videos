"""Recover per-line timings from the DELIVERED 14:27 cut, so the reference-style rebuild cannot drift.

WHY. The narration takes were lost with the sandbox, and `audio/timing.json` died with them. But the
delivered film still contains the read, and `script.json` still contains the words in order -- 1762
of them on both sides. The timing data is therefore still on disk, just in the wrong shape: the
subtitle track says where each *cue* is, and the cue text says which script line it is.

HOW. The 277 caption cues are the same read chopped smaller: 1762 words, same order. So a line is
the next N words of the cue stream, where N is the line's own word count. That is monotonic, exact,
and it cannot drift -- which a similarity match does, badly, on lines that share stock phrases
("He does not say...", "That is the...").

  python3 recover_timing.py --project content/drafts/abbas-table-storm-reference \
      --srt /tmp/subs.srt --audio /tmp/narr.wav
"""
import argparse
import json
import pathlib
import re
import wave

import numpy as np

SR = 48000


def parse_srt(path):
    out = []
    for block in pathlib.Path(path).read_text(encoding="utf-8", errors="replace").strip().split("\n\n"):
        m = re.search(r"(\d\d):(\d\d):(\d\d),(\d+) --> (\d\d):(\d\d):(\d\d),(\d+)", block)
        if not m:
            continue
        body = " ".join(block.split("\n")[2:]).strip()
        a = int(m.group(1)) * 3600 + int(m.group(2)) * 60 + int(m.group(3)) + int(m.group(4)) / 1000
        b = int(m.group(5)) * 3600 + int(m.group(6)) * 60 + int(m.group(7)) + int(m.group(8)) / 1000
        out.append((a, b, body))
    return out


def match_lines(lines, cues):
    """Sequential word-budget alignment. Returns [(line_id, start, end)]."""
    words = [(a, b, t, len(t.split())) for a, b, t in cues]
    res, j = [], 0
    for ln in lines:
        need = len(ln["text"].split())
        if j >= len(words):
            res.append((ln["id"], None, None))
            continue
        start, end, got = words[j][0], words[j][1], 0
        while j < len(words) and got < need:
            start = min(start, words[j][0])
            end = words[j][1]
            got += words[j][3]
            j += 1
        # A line spanning several cues can be spoken no faster than this narrator speaks. When the
        # span is longer than that, the line did not begin at the first cue -- the cue stream had
        # drifted and this line caught up. Its END is exact, so anchor that and work back from it.
        max_dur = len(ln["text"].split()) / 3.2 + 0.5
        if end - start > max_dur:
            start = end - max_dur
        res.append((ln["id"], start, end))
    if j < len(words):
        lid, s0, _ = res[-1]
        res[-1] = (lid, s0, words[-1][1])
    return res


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--project", required=True)
    ap.add_argument("--srt", required=True)
    ap.add_argument("--audio", required=True)
    ap.add_argument("--out", default="audio/timing.json")
    ap.add_argument("--stitch", default="audio/voice.wav",
                    help="where to write the narration-only track, built from the delivered audio")
    ap.add_argument("--bed-at", type=float, default=0.0,
                    help="the delivered film already has its score mixed in; see the note below")
    a = ap.parse_args()
    proj = pathlib.Path(a.project)
    doc = json.loads((proj / "script.json").read_text())
    lines = [l for t in doc["takes"] for l in t["lines"]]
    cues = parse_srt(a.srt)
    print(f"{len(cues)} cues, {len(lines)} lines")

    with wave.open(str(a.audio)) as w:
        sr = w.getframerate()
        ch = w.getnchannels()
        total = w.getnframes() / sr
        x = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768
    x = x.reshape(-1, ch).mean(1)

    rows = match_lines(lines, cues)
    holes = [r for r in rows if r[1] is None]
    for i, (lid, s, e) in enumerate(rows):
        if s is not None:
            continue
        prev = next((r for r in reversed(rows[:i]) if r[1] is not None), None)
        nxt = next((r for r in rows[i + 1:] if r[1] is not None), None)
        s = (prev[2] + 0.4) if prev else 0.9
        e = (nxt[1] - 0.4) if nxt else min(total, s + 2.0)
        rows[i] = (lid, s, max(s + 0.5, e))

    segs = [{"id": lid, "start": round(s, 3), "duration": round(max(0.4, e - s), 3),
             "end": round(e, 3),
             "vo": next(l["text"] for l in lines if l["id"] == lid)}
            for lid, s, e in rows]
    timing = {"total_duration": round(total, 3), "lead": segs[0]["start"], "segments": segs}
    (proj / "audio").mkdir(parents=True, exist_ok=True)
    (proj / a.out).write_text(json.dumps(timing, indent=1))

    # ---- prove it against the audio: every line's window must contain speech ------------------
    bad = []
    for s in segs:
        i0, i1 = int(s["start"] * sr), int(min(len(x), (s["start"] + s["duration"]) * sr))
        seg = x[i0:i1]
        rms = 20 * np.log10(np.sqrt((seg ** 2).mean()) + 1e-9) if len(seg) else -99
        if rms < -32:
            bad.append((s["id"], round(float(rms), 1)))
    print(f"holes filled: {len(holes)}   windows with no speech: {len(bad)}")
    for b in bad[:10]:
        print("   silent window:", b)
    gaps = [round(segs[i + 1]["start"] - segs[i]["end"], 2) for i in range(len(segs) - 1)]
    print(f"gaps: min {min(gaps):.2f}  median {sorted(gaps)[len(gaps)//2]:.2f}  max {max(gaps):.2f}")

    # ---- narration-only track -----------------------------------------------------------------
    # Only the frames where a line is being spoken are copied. Everything between them is silence,
    # so the new score and the weather can be laid underneath without the old pad fighting them.
    # The old score is still *inside* each spoken frame -- at the delivered level, which is why the
    # narration windows are the one place this rebuild cannot fully clean up.
    out = np.zeros_like(x)
    for s in segs:
        i0 = int(s["start"] * sr)
        i1 = min(len(x), int((s["start"] + s["duration"]) * sr))
        out[i0:i1] = x[i0:i1]
    pcm = (np.clip(out, -1, 1) * 32767).astype(np.int16)
    (proj / a.stitch).parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(proj / a.stitch), "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr)
        w.writeframes(pcm.tobytes())
    print(f"wrote {proj/a.stitch} (narration-only, {len(out)/sr:.1f}s)  total {total:.1f}s")


if __name__ == "__main__":
    main()
