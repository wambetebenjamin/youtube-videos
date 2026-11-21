"""Build this cut's soundtrack: the recovered narration, a bed that follows the story, and a mix.

WHAT THE PROBLEM IS. The narration could only be recovered by cutting the spoken windows out of the
delivered master, so every spoken window still carries the old score and the old weather inside it,
while every gap between lines carries nothing at all. A naive rebuild would be a film that is noisy
only while somebody is talking, which is the opposite of how a soundtrack works.

WHAT THIS DOES ABOUT IT.

* **The gaps are where the bed lives.** In silence the new bed is the only thing there, so it plays
  at its real level. Under speech it ducks, which is what a bed is supposed to do anyway. The
  result is a film that breathes with the narration instead of only under it.
* **The weather follows this cut, not the last one.** `ambience.SHAPE` is rewritten from
  `audio/timing.json`, so the storm runs from the first gust to the exact word "the wind dropped"
  and then stops dead. A fade there would say we are leaving the storm; Mark says the storm ended.
* **The old score is not removed, it is outweighed.** It cannot be removed -- it is baked into the
  same frames as the voice -- so the new bed is placed so the ear locks onto it in the gaps and
  reads the baked layer under speech as part of the room.

  python3 bed.py --project content/drafts/abbas-table-storm-reference
"""
import argparse
import json
import pathlib
import subprocess
import sys
import wave

import numpy as np

SR = 48000
HERE = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))

import ambience  # noqa: E402
import score  # noqa: E402


# ------------------------------------------------------------------------------- the timeline
# (start, end, wind, rain, hull, kind). The storm arrives with "It came down on them all at once"
# (line 19) and dies on the word "dropped" (line 51), because that is where the story changes and
# the picture changes with it.
def shape_for(timing):
    s = {seg["id"]: seg for seg in timing["segments"]}
    first_gust = s[19]["start"]                      # "It came down on them all at once."
    he_got_up = s[45]["start"]                       # "He got up."
    drop = s[51]["start"]                             # "The wind dropped, and there was a great calm."
    return [
        (0.0, 3.0, 0.10, 0.00, 0.00, "lake"),
        (3.0, 180.0, 0.16, 0.00, 0.06, "lake"),       # the long afternoon by the water
        (180.0, first_gust, 0.34, 0.02, 0.12, "lake"),  # the air turning, the lamps going out
        (first_gust, 232.0, 0.95, 0.55, 0.85, "storm"),
        (232.0, 310.0, 1.00, 0.62, 1.00, "storm"),    # water over their ankles
        (310.0, he_got_up, 0.78, 0.32, 0.68, "storm"),  # ...and He was asleep
        (he_got_up, drop - 0.1, 0.96, 0.52, 0.88, "storm"),  # "Peace. Be still."
        (drop - 0.1, drop + 0.7, 0.26, 0.08, 0.18, "storm"),  # the storm is gone, not faded
    ], drop + 0.7


def speech_envelope(timing, n, timings_out=None):
    """1.0 while a line is being spoken, 0.0 between lines, with a soft edge either side."""
    e = np.zeros(n, np.float32)
    edge = int(0.28 * SR)
    for seg in timing["segments"]:
        i0, i1 = int(seg["start"] * SR), int(min(n, seg["end"] * SR))
        if i1 <= i0:
            continue
        e[i0:i1] = 1.0
    # a raised-cosine shoulder so the duck does not click on the first consonant
    if edge > 1:
        k = np.hanning(edge * 2 + 1)[:edge]
        e = np.convolve(e, k / k.sum(), mode="same").astype(np.float32)
    return e


def read_mono(path):
    with wave.open(str(path)) as w:
        sr = w.getframerate()
        a = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768
        ch = w.getnchannels()
    return (a.reshape(-1, ch).mean(1) if ch > 1 else a), sr


def db(x):
    return 20 * np.log10(max(float(x), 1e-9))


def rms(x):
    return float(np.sqrt((x.astype(np.float64) ** 2).mean()) + 1e-12)


def write_wav(path, stereo):
    pcm = (np.clip(stereo, -1, 1) * 32767).astype("<i2")
    with wave.open(str(path), "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())


def measure_lufs(path):
    """Integrated loudness straight from ffmpeg's loudnorm, so the number is the industry one."""
    r = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", str(path),
                        "-af", "loudnorm=print_format=json", "-f", "null", "-"],
                       capture_output=True, text=True)
    tail = r.stderr[r.stderr.rfind("{"):]
    try:
        d = json.loads(tail[: tail.rfind("}") + 1])
        return float(d["input_i"]), float(d["input_tp"])
    except Exception:
        return float("nan"), float("nan")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--project", required=True)
    ap.add_argument("--voice", default="audio/voice.wav")
    ap.add_argument("--timing", default="audio/timing.json")
    ap.add_argument("--out", default="audio/mix.wav")
    ap.add_argument("--gap-over-speech", type=float, default=10.0,
                    help="dB by which the bed lifts in the gaps relative to under the voice")
    ap.add_argument("--target", type=float, default=-14.0, help="integrated loudness target, LUFS")
    ap.add_argument("--bed-under", type=float, default=20.0,
                    help="dB below the voice the bed sits while the voice is speaking")
    a = ap.parse_args()
    proj = pathlib.Path(a.project)

    timing = json.loads((proj / a.timing).read_text())
    voice, sr = read_mono(proj / a.voice)
    assert sr == SR, f"voice is {sr} Hz"
    n = len(voice)
    total = n / SR
    print(f"voice {total:.1f}s, {len(timing['segments'])} lines")

    # ---- the bed ------------------------------------------------------------------------------
    shape, shape_end = shape_for(timing)
    ambience.SHAPE = shape
    print("building weather ...")
    weather = ambience.build(total, shape_end=shape_end, seed=13)
    weather = (weather - weather.mean()) / (np.abs(weather).max() + 1e-9) * 0.5
    # The score is stereo and the weather is mono; keep the weather mono and let the mix put it in
    # both channels, so a 14-minute film is not carrying the same noise floor twice in memory.
    weather = weather.astype(np.float32)

    print("building score ...")
    music = score.build(total, seed=7)
    music = (music / (np.abs(music).max() + 1e-9) * 0.5).astype(np.float32)

    # In the prayer the room should be as empty as the film ever gets: the weather is off, and the
    # music is far enough down to be felt rather than heard.
    prayer0 = timing["segments"][87]["start"]          # "Let us pray."
    prayer1 = timing["segments"][103]["end"]           # "In Jesus' name, amen."
    t = (np.arange(n) / SR).astype(np.float32)
    prayer = np.clip(1.0 - np.abs(t - (prayer0 + prayer1) / 2) / ((prayer1 - prayer0) / 2 + 2.0), 0, 1)
    prayer = (prayer ** 0.7).astype(np.float32)

    bed = music
    bed *= np.repeat((1.0 - 0.55 * prayer)[:, None], 2, axis=1)

    # ---- levels -------------------------------------------------------------------------------
    speech = speech_envelope(timing, n)
    voice_rms = rms(voice[voice != 0])
    print(f"voice RMS {db(voice_rms):.1f} dBFS")

    # The bed is set relative to the voice, by measurement, not by ear.
    #
    # Both layers are peak-normalised, so their *level* is whatever their crest factor happens to be;
    # multiplying by a gain chosen from an assumed dBFS therefore landed the gaps 13 dB quieter than
    # the bed under the speech, the opposite of the intent. So the bed is first scaled so that its
    # measured RMS in the gaps equals the target, and only then does the duck curve apply -- and the
    # curve is now purely a duck, with no lift in it to double-count.
    gap_mask = speech < 0.02
    bed_gap_rms = rms(bed[gap_mask].mean(axis=1))
    target_gap = db(voice_rms) - (a.bed_under - a.gap_over_speech)
    scale = 10 ** ((target_gap - db(bed_gap_rms)) / 20.0)
    print(f"bed RMS in gaps {db(bed_gap_rms):.1f} dBFS -> target {target_gap:.1f} dBFS (x{scale:.2f})")
    bed *= scale
    bed_under = target_gap - a.gap_over_speech
    gain_curve = (10 ** (-a.gap_over_speech * speech / 20.0)).astype(np.float32)

    # Silence before the first word and after the last: the film fades up from black, so it should
    # fade up from nothing too.
    fade_in = np.clip(t / 1.6, 0, 1) ** 1.6
    fade_out = np.clip((total - t) / 2.4, 0, 1) ** 1.6
    gain_curve *= (fade_in * fade_out).astype(np.float32)
    del speech, prayer, t

    # ---- the sum ------------------------------------------------------------------------------
    # Written in blocks. The whole film as float64 stereo is 1.3 GB, and this machine has three; a
    # 30 s block is 11 MB and produces byte-identical output.
    out = proj / a.out
    block = 30 * SR
    peak = 0.0
    raw = out.parent / "mix_raw.wav"
    with wave.open(str(raw), "wb") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        for i0 in range(0, n, block):
            i1 = min(n, i0 + block)
            g = gain_curve[i0:i1, None]
            seg = bed[i0:i1] * g
            seg += weather[i0:i1, None]
            seg += voice[i0:i1, None]
            peak = max(peak, float(np.abs(seg).max()))
            w.writeframes((np.clip(seg, -1, 1) * 32767).astype("<i2").tobytes())
    print(f"peak before ceiling {db(peak):.2f} dBFS")
    # The mix is normalised by measurement rather than by a hand-picked gain: the brief wants the
    # film at about -14 LUFS with true peak at or under -1 dBTP, and only one gain satisfies both.
    # loudnorm in two passes (measure, then apply) does exactly that and is the same tool the
    # delivery encode would be judged by. A hand-tuned volume + limiter pair was tried first and
    # either missed the peak (+ -0.3 dBTP) or, at the other end, dropped the film to -17 LUFS.
    target_i, target_tp = a.target, -1.5
    m = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", str(raw),
                        "-af", f"loudnorm=I={target_i}:TP={target_tp}:LRA=11:print_format=json",
                        "-f", "null", "-"], capture_output=True, text=True)
    tail = m.stderr[m.stderr.rfind("{"):]
    meas = json.loads(tail[: tail.rfind("}") + 1])
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(raw), "-af",
                    f"loudnorm=I={target_i}:TP={target_tp}:LRA=11:"
                    f"measured_I={meas['input_i']}:measured_TP={meas['input_tp']}:"
                    f"measured_LRA={meas['input_lra']}:measured_thresh={meas['input_thresh']}:"
                    f"offset={meas['target_offset']}:linear=true",
                    "-ar", str(SR), str(out)], check=True)
    raw.unlink()
    i, tp = measure_lufs(out)
    print(f"wrote {out} ({total:.1f}s)  integrated {i:.1f} LUFS  true peak {tp:.1f} dBTP")

    rpt = proj / "audio" / "mix_report.json"
    rpt.write_text(json.dumps({
        "total": round(total, 2), "voice_rms_dbfs": round(db(voice_rms), 2),
        "bed_under_voice_dbfs": round(bed_under, 2), "bed_in_gaps_dbfs": round(target_gap, 2),
        "integrated_lufs": i, "true_peak_dbtp": tp,
        "storm_shape": [[round(x[0], 1), round(x[1], 1), x[5]] for x in shape],
    }, indent=1))
    print(f"wrote {rpt}")


if __name__ == "__main__":
    main()
