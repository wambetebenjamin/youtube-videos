"""Recover per-line timings from the DELIVERED 14:27 mix, so the rebuilt film cannot drift.

WHY. The narration takes were lost with the sandbox, and `audio/timing.json` died with them. But the
delivered film still contains the read, and `script.json` still contains the words in order. All the
timing data is therefore still on disk, just in the wrong shape: the subtitle track says where each
*cue* is, and the cue text says which script line it is.

HOW. Cue text is compared to line text by token overlap (a cue is 1-3 words, a line is 10-30), and
each line is matched to the cue that best covers it, monotonically: a line can never match a cue that
starts before the previous line's cue. Unmatched cues (a line split across two cues) are folded into
their neighbour. The result is a start time and a duration for every one of the 109 lines.

  python3 recover_timing.py --project content/drafts/abbas-table-storm \
      --srt /tmp/subs.srt --audio /tmp/a.wav
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


def norm(s):
    return re.findall(r"[a-z']+", s.lower())


def match_lines(lines, cues):
    """Sequential word-budget alignment.

    The 277 caption cues contain the same 1762 words as the 109 script lines, in the same order:
    the cues are simply the same read chopped smaller. So a line is the next N words of the cue
    stream, where N is the line's own word count. That makes the match monotonic and exact, and it
    cannot drift -- which a scoring match does, badly, on lines that share stock phrases.
    """
    def wc(t):
        return len(t.split())

    words = [(a, b, t, wc(t)) for a, b, t in cues]
    res, j = [], 0
    for ln in lines:
        need = wc(ln["text"])
        if j >= len(words):
            res.append((ln["id"], None, None))
            continue
        start, end, got = words[j][0], words[j][1], 0
        first_j = j
        while j < len(words) and got < need:
            start = min(start, words[j][0])
            end = words[j][1]
            got += words[j][3]
            j += 1
        # A line that spans several cues can be spoken no faster than ~4 words a second. When the
        # span is longer than that, the line did not begin at the first cue: the cue stream drifted
        # and this line caught up. Anchor its END (which is exact) and work back from it.
        max_dur = len(ln["text"].split()) / 3.2 + 0.5   # 3.2 words/s is this narrator's real top speed
        if end - start > max_dur:
            start = end - max_dur
        res.append((ln["id"], start, end))
    if j < len(words):                     # any cue words left over belong to the last line
        lid, s0, _ = res[-1]
        res[-1] = (lid, s0, words[-1][1])
    return res


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--project", required=True)
    ap.add_argument("--srt", required=True)
    ap.add_argument("--audio", required=True)
    ap.add_argument("--out", default="audio/timing.json")
    a = ap.parse_args()
    proj = pathlib.Path(a.project)
    doc = json.loads((proj / "script.json").read_text())
    lines = [l for t in doc["takes"] for l in t["lines"]]
    cues = parse_srt(a.srt)
    print(f"{len(cues)} cues, {len(lines)} lines")

    with wave.open(str(a.audio)) as w:
        total = w.getnframes() / w.getframerate()

    rows = match_lines(lines, cues)
    missing = [r for r in rows if r[1] is None]
    # fill any holes by interpolating between known neighbours
    for i, (lid, s, e) in enumerate(rows):
        if s is not None:
            continue
        prev = next((r for r in reversed(rows[:i]) if r[1] is not None), None)
        nxt = next((r for r in rows[i + 1:] if r[1] is not None), None)
        s = (prev[2] + 0.4) if prev else 0.9
        e = (nxt[1] - 0.4) if nxt else min(total, s + 2.0)
        rows[i] = (lid, s, max(s + 0.5, e))

    segs = [{"id": lid, "start": round(s, 3), "duration": round(max(0.4, e - s), 3)}
            for lid, s, e in rows]
    timing = {"total_duration": round(total, 3), "lead": segs[0]["start"], "segments": segs}
    (proj / "audio").mkdir(parents=True, exist_ok=True)
    (proj / a.out).write_text(json.dumps(timing, indent=1))

    # ---- prove it against the audio: does each line's window actually contain speech? ----------
    with wave.open(str(a.audio)) as w:
        ch = w.getnchannels()
        x = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768
    x = x.reshape(-1, ch).mean(1)
    quiet, bad = 0, []
    for s in segs:
        i0, i1 = int(s["start"] * SR), int(min(len(x), (s["start"] + s["duration"]) * SR))
        seg = x[i0:i1]
        if len(seg) == 0:
            continue
        rms = 20 * np.log10(np.sqrt((seg ** 2).mean()) + 1e-9)
        if rms < -32:
            bad.append((s["id"], round(rms, 1)))
        quiet += rms < -32
    print(f"holes filled: {len(missing)}   windows with no speech: {quiet}")
    for b in bad[:10]:
        print("   silent window:", b)
    gaps = [round(segs[i + 1]["start"] - (segs[i]["start"] + segs[i]["duration"]), 2)
            for i in range(len(segs) - 1)]
    print(f"gaps: min {min(gaps):.2f}  median {sorted(gaps)[len(gaps)//2]:.2f}  max {max(gaps):.2f}")
    print(f"total {total:.1f}s")


if __name__ == "__main__":
    main()
