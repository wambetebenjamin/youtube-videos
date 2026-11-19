"""A soft score, synthesised in code — no licensing, no external track, and it can follow the film.

The brief is worship background: felt, not followed. That shapes every choice here.

* **No percussion.** A devotional bed with a beat asks the viewer to tap along instead of listen.
* **Slow harmony.** Chords change every 4 bars at ~52 BPM, so a chord lasts nearly 20 seconds. The
  changes are what the eye can land on when the picture cuts, which is the craft the iart
  `soundtrack` skill spells out: harmony marks the cut, not volume. A loud accent on a transition
  across a quiet narration reads as a jump scare.
* **Diatonic and gentle.** A D-major drone family with suspensions that resolve; the 6th and 9th are
  colour, never tension that asks to be resolved loudly.
* **Nothing above ~2 kHz to speak of.** The narration lives there. The bed stays under it.

Output is a stereo 48 kHz WAV, then `mix_soundtrack.py` ducks it under the voice.

  python3 score.py --out audio/score.wav --seconds 1000
"""
import argparse
import math
import wave

import numpy as np

SR = 48000
BPM = 52.0
BEAT = 60.0 / BPM
BAR = 4 * BEAT

# D major, voiced low and open. Each entry is one chord, held for `HOLD` bars.
#      D2    A2    D3     F#3   A3
CHORDS = [
    [38, 45, 50, 54, 57],      # D
    [35, 42, 47, 50, 54],      # Bm  (the relative minor: the ache underneath)
    [31, 38, 43, 47, 50],      # G
    [33, 40, 45, 49, 52],      # A  (dominant: leans forward so the cut home feels like arrival)
]
HOLD = 4                        # bars per chord

# MIDI note -> Hz
def hz(n):
    return 440.0 * 2 ** ((n - 69) / 12.0)


def pad_voice(freq, dur, rng, detune=0.0):
    """One soft pad tone: a few harmonics with a slow attack and a very slow release.

    Two detuned copies beat gently against each other, which is what stops a synth pad sounding
    like a test tone. The attack is long (1.2 s) so chords bloom rather than land.
    """
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = freq * (1.0 + detune)
    out = np.zeros(n, np.float64)
    for h, amp in ((1, 1.0), (2, 0.30), (3, 0.10), (4, 0.035)):
        # a small random phase per harmonic stops the stack from clicking at onset
        out += amp * np.sin(2 * np.pi * f * h * t + rng.uniform(0, 2 * np.pi))
    env = np.minimum(1.0, t / 1.6) ** 1.5
    rel = np.minimum(1.0, (dur - t) / 2.4).clip(0, 1) ** 1.2
    # a slow tremble, ~0.3 Hz: the sound of something breathing, not a machine holding a note
    out *= 1.0 + 0.045 * np.sin(2 * np.pi * 0.3 * t + rng.uniform(0, 6))
    return out * env * rel


def build(seconds, seed=7):
    rng = np.random.default_rng(seed)
    n = int(seconds * SR)
    buf = np.zeros(n, np.float64)

    bars = int(math.ceil(seconds / BAR)) + 2
    for b in range(bars):
        chord = CHORDS[(b // HOLD) % len(CHORDS)]
        t0 = b * BAR
        # Voices enter staggered by 0.18 s, low to high. Layers arriving together after quiet
        # measures read as a jolt; staggered, it reads as a swell.
        for vi, note in enumerate(chord):
            start = t0 + vi * 0.18
            dur = BAR * 1.55                 # overlap into the next bar so the pad never gaps
            i0 = int(start * SR)
            if i0 >= n:
                continue
            v = pad_voice(hz(note), dur, rng, detune=rng.uniform(-0.0016, 0.0016))
            i1 = min(n, i0 + len(v))
            buf[i0:i1] += v[: i1 - i0] * (0.30 / (1 + vi * 0.14))

    # A single high bell every 8 bars, very quiet: one point of light in the texture.
    for b in range(0, bars, 8):
        start = b * BAR + BEAT
        i0 = int(start * SR)
        if i0 >= n:
            break
        f = hz(CHORDS[(b // HOLD) % len(CHORDS)][-1] + 12)
        dur = 5.0
        m = min(n - i0, int(dur * SR))
        t = np.arange(m) / SR
        bell = (np.sin(2 * np.pi * f * t) + 0.25 * np.sin(2 * np.pi * f * 2.76 * t)) * np.exp(-t * 1.1)
        buf[i0:i0 + m] += bell * 0.05

    # Gentle low-pass: a one-pole filter, twice, to take the edge off and keep the bed under the
    # voice. Written by hand so it runs without scipy.
    for _ in range(2):
        a = math.exp(-2 * math.pi * 1900 / SR)
        y = np.empty_like(buf)
        acc = 0.0
        for i in range(0, n, 1):
            acc = a * acc + (1 - a) * buf[i]
            y[i] = acc
        buf = y

    # Stereo: very slight width, the two channels not identical, so it does not sit in the middle
    # of the narrator's head.
    left = buf
    right = np.roll(buf, int(0.011 * SR)) * 0.985
    peak = max(np.abs(left).max(), np.abs(right).max(), 1e-9)
    gain = 0.42 / peak                       # leave headroom; the mix normalises anyway
    return np.stack([left * gain, right * gain], axis=1)


def write_wav(path, stereo):
    pcm = (np.clip(stereo, -1, 1) * 32767).astype("<i2")
    with wave.open(str(path), "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--out", default="audio/score.wav")
    ap.add_argument("--seconds", type=float, default=1000.0)
    ap.add_argument("--seed", type=int, default=7)
    a = ap.parse_args()
    audio = build(a.seconds, a.seed)
    write_wav(a.out, audio)
    print(f"wrote {a.out} ({a.seconds:.0f}s, {BPM:.0f} BPM, {len(CHORDS)} chords)")


if __name__ == "__main__":
    main()
