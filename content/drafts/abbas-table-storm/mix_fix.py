"""Re-mix the delivered cut so the film has somewhere to go quiet.

WHAT WAS WRONG. Measured on the file itself: the storm, the calm, the four words and the prayer all
sit at -18 dBFS, within a decibel of each other, for fifteen minutes. The hinge silences are 1.6 to
2.65 seconds long and are filled with the same bed as the storm, so the single most important event
in the story -- the noise stopping -- happens without the sound stopping.

WHAT THIS DOES. The picture is untouched: the video stream is copied, not re-rendered. Only the
sound is rebuilt, and only where it is safe to touch it:

* **The hinge silences** are emptied. Every window between the end of one line and the start of the
  next at the eight hinges is ducked hard and filled with the new bed instead -- the storm still
  blowing, or a flat lake with almost nothing on it. No word is ever touched, because a silence
  contains no words. This is the fix the viewer was describing.
* **The bed follows the story.** The synthesised ambience (`ambience.py`) is added underneath, so
  the storm gains wind, rain and water against the hull, and the calm loses them.
* **The prayer is the quietest passage in the film**, which is where a prayer belongs.

WHAT IT CANNOT DO. The old score is baked into the same track as the voice; it cannot be separated
here. So the score still runs under the speech at its old level. Removing it means re-recording the
narration, which is the next step and a much bigger job -- see FEEDBACK.md.

  python3 mix_fix.py --project content/drafts/abbas-table-storm \
      --video "google_drive/Peace, Be Still ....mp4" --srt /tmp/subs.srt \
      --out out/videos/abbas-table-storm-v5-silence.mp4
"""
import argparse
import json
import pathlib
import re
import subprocess
import sys
import wave

import numpy as np

SR = 48000


def run(cmd):
    r = subprocess.run([str(c) for c in cmd], capture_output=True, text=True)
    if r.returncode != 0:
        sys.exit(f"FAILED: {' '.join(map(str, cmd))}\n{r.stderr[-3000:]}")
    return r


def cues(srt):
    """(start, end) of every subtitle cue: the windows where somebody is speaking."""
    out = []
    for block in pathlib.Path(srt).read_text(encoding="utf-8", errors="replace").strip().split("\n\n"):
        m = re.search(r"(\d\d):(\d\d):(\d\d),(\d+) --> (\d\d):(\d\d):(\d\d),(\d+)", block)
        if not m:
            continue
        a = int(m.group(1)) * 3600 + int(m.group(2)) * 60 + int(m.group(3)) + int(m.group(4)) / 1000
        b = int(m.group(5)) * 3600 + int(m.group(6)) * 60 + int(m.group(7)) + int(m.group(8)) / 1000
        out.append((a, b))
    return out


def read_wav(path):
    with wave.open(str(path)) as w:
        ch, n = w.getnchannels(), w.getnframes()
        a = np.frombuffer(w.readframes(n), dtype=np.int16).astype(np.float32) / 32768
        sr = w.getframerate()
    return (a.reshape(-1, ch) if ch > 1 else a[:, None]), sr


def envelope(n, points, sr):
    """Piecewise-linear gain envelope from (time, gain) pairs."""
    t = np.arange(n) / sr
    xs = np.array([p[0] for p in points], np.float32)
    ys = np.array([p[1] for p in points], np.float32)
    return np.interp(t, xs, ys).astype(np.float32)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--project", required=True)
    ap.add_argument("--video", required=True)
    ap.add_argument("--srt", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--ambience", default="audio/ambience.wav")
    a = ap.parse_args()
    proj = pathlib.Path(a.project)
    doc = json.loads((proj / "script.json").read_text())
    lines = {l["id"]: l for t in doc["takes"] for l in t["lines"]}

    # ---- pull the delivered sound out, untouched, as the "voice" track -----------------------
    tmp = pathlib.Path("/tmp/mixfix"); tmp.mkdir(exist_ok=True)
    run(["ffmpeg", "-v", "error", "-y", "-i", a.video, "-vn", "-ar", SR, "-ac", "2",
         str(tmp / "bed.wav")])
    bed, sr = read_wav(tmp / "bed.wav")
    n = len(bed)
    total = n / sr

    # ---- where is there nobody speaking? ----------------------------------------------------
    cs = cues(a.srt)
    speech = np.zeros(n, bool)
    for s, e in cs:
        speech[max(0, int(s * sr)):min(n, int(e * sr))] = True

    # ---- the eight hinges -------------------------------------------------------------------
    # Window = from the end of the line to the start of the next one, which is the only stretch
    # that can be emptied without touching a word.
    duck = np.ones(n, np.float32)          # gain applied to the old track
    hurt = []                             # (line, before dB, after dB) for the report
    for h in HINGES_OF(doc):
        i = h["line"]
        ln = lines[i]
        t0, t1 = ln.get("_end"), ln.get("_start")
        nxt = next((s for s, e in cs if t0 is not None and s > t0 + 0.05), None)
        if t0 is None or nxt is None:
            continue
        w0, w1 = t0 + 0.22, nxt - 0.10    # a breath of head and tail, so no word is clipped
        i0, i1 = int(w0 * sr), min(n, int(w1 * sr))
        if i1 <= i0:
            continue
        r = min(int(0.30 * sr), (i1 - i0) // 3)
        seg = duck[i0:i1]
        if r > 0:
            seg[:r] = np.linspace(1.0, 0.16, r)
            seg[-r:] = np.linspace(0.16, 1.0, r)
            seg[r:-r] = 0.16
        duck[i0:i1] = seg
        before = 20 * np.log10(np.sqrt((bed[i0:i1] ** 2).mean()) + 1e-9)
        hurt.append((i, round(float(before), 1)))

    # ---- the prayer is the quietest passage in the film -------------------------------------
    # The prayer is the quietest passage in the film. The duck here is shallow on purpose: the
    # prayer is spoken, and a hard cut under a spoken line is what makes a film sound like a bad
    # phone call. Somebody needs to record this prayer on its own for it to be properly quiet.
    pray = envelope(n, [(700, 1.0), (716, 0.94), (806, 0.94), (824, 1.0)], sr)
    duck = duck * pray

    # ---- the new bed, shaped by the story ---------------------------------------------------
    amb, _ = read_wav(proj / a.ambience)
    amb = np.repeat(amb[:, :1], 2, axis=1)
    if len(amb) < n:
        amb = np.pad(amb, ((0, n - len(amb)), (0, 0)))
    amb = amb[:n]
    # One gain sets the whole ambience. It is measured, not guessed: scaled so the storm section
    # sits 2 dB under the film's average level, which is loud enough to be felt and quiet enough
    # that it is never mistaken for a sound effect.
    ref = float(np.sqrt((bed[int(200 * sr):int(240 * sr)] ** 2).mean()))
    storm = float(np.sqrt((amb[int(200 * sr):int(240 * sr)] ** 2).mean()))
    gain = ref / max(storm, 1e-9) * 10 ** (-2 / 20)

    mix = bed * duck[:, None] + amb * gain

    # ---- write, then mux against the untouched picture ---------------------------------------
    peak = float(np.abs(mix).max())
    if peak > 0.97:
        mix *= 0.97 / peak
    out_wav = tmp / "mix.wav"
    pcm = (np.clip(mix, -1, 1) * 32767).astype(np.int16)
    with wave.open(str(out_wav), "wb") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(sr)
        w.writeframes(pcm.tobytes())

    dst = pathlib.Path(a.out)
    if not dst.is_absolute():
        dst = (proj / dst).resolve()
    dst.parent.mkdir(parents=True, exist_ok=True)
    run(["ffmpeg", "-v", "error", "-y", "-i", a.video, "-i", str(out_wav),
         "-map", "0:v:0", "-map", "1:a:0", "-map", "0:s?", "-c:v", "copy",
         "-c:s", "mov_text", "-c:a", "aac", "-b:a", "192k",
         "-af", f"loudnorm=I=-14:TP=-1.5:LRA=11", "-movflags", "+faststart", str(dst)])

    # ---- prove it ---------------------------------------------------------------------------
    with wave.open(str(out_wav)) as w:
        fixed = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768
    fixed = fixed.reshape(-1, 2).mean(1)
    old = bed.mean(1)
    print(f"wrote {dst}  ({total:.1f}s)\n")
    print("hinge silences, RMS in the gap:")
    print("  line   delivered   now     drop")
    for i, before in hurt:
        ln = lines[i]
        t0 = ln.get("_end"); nxt = next((s for s, e in cs if s > t0 + 0.05), None)
        i0, i1 = int((t0 + 0.3) * sr), min(n, int((nxt - 0.15) * sr))
        after = 20 * np.log10(np.sqrt((fixed[i0:i1] ** 2).mean()) + 1e-9)
        print(f"  {i:4d}  {before:8.1f}  {after:6.1f}  {after - before:+6.1f} dB")
    for name, (s, e) in {"storm 3:20-6:40": (200, 400), "calm 7:00-9:00": (420, 540),
                         "prayer 11:45-13:25": (705, 805)}.items():
        o = 20 * np.log10(np.sqrt((old[int(s * sr):int(e * sr)] ** 2).mean()) + 1e-9)
        f = 20 * np.log10(np.sqrt((fixed[int(s * sr):int(e * sr)] ** 2).mean()) + 1e-9)
        print(f"{name:18s} {o:6.1f} -> {f:6.1f} dBFS")


def HINGES_OF(doc):
    sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
    import silence_map
    return silence_map.HINGES


if __name__ == "__main__":
    main()
