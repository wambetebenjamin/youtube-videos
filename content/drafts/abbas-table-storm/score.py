"""A soft score, synthesised in code — no licensing, no external track, and it can follow the film.

The brief is worship background: felt, not followed. That shapes every choice here.

* **No percussion.** A devotional bed with a beat asks the viewer to tap along instead of listen.
* **Slow harmony.** Chords change every 4 bars at ~54 BPM, so a chord lasts nearly 18 seconds. The
  changes are what the ear can land on when the picture cuts, which is the craft the iart
  `soundtrack` skill spells out: harmony marks the cut, not volume.
* **Voiced where speakers actually are.** This is the lesson from the previous version, and it is
  the whole reason the bed could not be heard: it was written D2 to A3 — 73 to 220 Hz — and then
  low-passed at 1.9 kHz. On a phone or a laptop that is close to silence, because a small driver
  cannot move enough air at 90 Hz. Measured on the old score: almost all the energy sat below
  200 Hz. This version is voiced an octave up, D3 to D5, with the melody and inner lines up where a
  small speaker can reproduce them, and a gentle high shelf rather than a low-pass.
* **Melody, not just a pad.** A pad alone reads as a drone and the ear stops noticing it. A few
  notes, played slowly and low in the mix, give the bed something to be recognised by.
* **Diatonic and gentle.** D major with suspensions that resolve; the 6th and 9th are colour, never
  tension that asks to be resolved loudly.

  python3 score.py --out audio/score.wav --seconds 900
"""
import argparse
import math
import wave

import numpy as np

SR = 48000
BPM = 54.0
BEAT = 60.0 / BPM
BAR = 4 * BEAT

# D major, voiced in the range a laptop speaker can actually sing: D3 up to D5.
# Root, fifth, octave, third, fifth above -- open voicing, no mud.
CHORDS = [
    [50, 57, 62, 66, 69],      # D    D3 A3 D4 F#4 A4
    [47, 54, 59, 62, 66],      # Bm   B2 F#3 B3 D4 F#4
    [43, 50, 55, 59, 62],      # G    G2 D3 G3 B3 D4
    [45, 52, 57, 61, 64],      # A    A2 E3 A3 C#4 E4
]
HOLD = 4                        # bars per chord


def hz(n):
    return 440.0 * 2 ** ((n - 69) / 12.0)


def pad_voice(freq, dur, rng, detune=0.0):
    """One soft pad tone: a few harmonics, slow attack, very slow release."""
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = freq * (1.0 + detune)
    out = np.zeros(n, np.float64)
    for h, amp in ((1, 1.0), (2, 0.34), (3, 0.14), (4, 0.06), (5, 0.025)):
        out += amp * np.sin(2 * np.pi * f * h * t + rng.uniform(0, 2 * np.pi))
    env = np.minimum(1.0, t / 1.4) ** 1.4
    rel = np.minimum(1.0, (dur - t) / 2.2).clip(0, 1) ** 1.2
    out *= 1.0 + 0.05 * np.sin(2 * np.pi * 0.28 * t + rng.uniform(0, 6))
    return out * env * rel


def pluck(freq, dur, rng):
    """A soft struck note -- a felt piano rather than a bell. Gives the bed an edge to notice."""
    n = int(dur * SR)
    t = np.arange(n) / SR
    out = np.zeros(n, np.float64)
    for h, amp in ((1, 1.0), (2, 0.42), (3, 0.16), (4, 0.07)):
        out += amp * np.sin(2 * np.pi * freq * h * t + rng.uniform(0, 2 * np.pi)) * np.exp(-t * (2.1 + h * 0.7))
    env = np.minimum(1.0, t / 0.012)            # fast attack, felt
    return out * env


def build(seconds, seed=7):
    rng = np.random.default_rng(seed)
    n = int(seconds * SR)
    pad = np.zeros(n, np.float64)
    lead = np.zeros(n, np.float64)
    shine = np.zeros(n, np.float64)

    bars = int(math.ceil(seconds / BAR)) + 2
    for b in range(bars):
        chord = CHORDS[(b // HOLD) % len(CHORDS)]
        t0 = b * BAR
        # Voices enter staggered, low to high: a swell, not a jolt.
        for vi, note in enumerate(chord):
            start = t0 + vi * 0.22
            dur = BAR * 1.6                 # overlap into the next bar so the pad never gaps
            i0 = int(start * SR)
            if i0 >= n:
                continue
            v = pad_voice(hz(note), dur, rng, detune=rng.uniform(-0.0016, 0.0016))
            i1 = min(n, i0 + len(v))
            pad[i0:i1] += v[: i1 - i0] * (0.30 / (1 + vi * 0.12))

    # A slow melodic line, one note a bar, mostly on the upper chord tones. Quiet -- it is a thread
    # in the texture, not a tune you could hum, but it is what stops the bed sounding like a drone.
    motif = [2, 4, 3, 2, 4, 1, 2, 3]        # indices into the chord
    for b in range(bars):
        if b % 2:                            # a note every other bar
            continue
        chord = CHORDS[(b // HOLD) % len(CHORDS)]
        note = chord[motif[(b // 2) % len(motif)]]
        start = b * BAR + BEAT * 0.5
        i0 = int(start * SR)
        if i0 >= n:
            break
        v = pluck(hz(note), 4.6, rng)
        i1 = min(n, i0 + len(v))
        lead[i0:i1] += v[: i1 - i0] * 0.075

    # A shimmer, an octave and a half above the pad. This is the layer that makes the bed exist on a
    # phone: a small driver cannot move air at 90 Hz, but the ear is most sensitive between 2 and
    # 5 kHz, and the previous score had 0.2% of its energy there. Kept quiet -- it is a haze, not a
    # melody -- and slow, so it never competes with consonants.
    for b in range(bars):
        if b % 2:
            continue
        chord = CHORDS[(b // HOLD) % len(CHORDS)]
        # three octaves up puts these between 1.5 and 3 kHz -- the ear's most sensitive region, and
        # the band a phone speaker reproduces best. This is the layer that makes the bed audible
        # without making it louder.
        for note in (chord[-1] + 36, chord[-2] + 36):
            start = b * BAR
            i0 = int(start * SR)
            if i0 >= n:
                break
            v = pad_voice(hz(note), BAR * 2.0, rng, detune=rng.uniform(-0.002, 0.002))
            i1 = min(n, i0 + len(v))
            # fewer harmonics up here, or it turns to glass
            shine[i0:i1] += v[: i1 - i0] * 0.085

    mix = pad + lead + shine

    # Gentle shaping: a little weight off below 90 Hz so the bed does not fight the room, and a
    # high shelf so the upper partials survive small speakers. One-pole filters written by hand.
    hp = math.exp(-2 * math.pi * 90 / SR)
    acc = 0.0
    out = np.empty_like(mix)
    for i in range(n):
        acc = hp * acc + (1 - hp) * mix[i]
        out[i] = mix[i] - acc
    # high shelf: lift everything above ~2.2 kHz by about 6 dB. On a laptop this is the difference
    # between a bed you can hear and one you cannot.
    ls = math.exp(-2 * math.pi * 2200 / SR)
    acc = 0.0
    low = np.empty_like(out)
    for i in range(n):
        acc = ls * acc + (1 - ls) * out[i]
        low[i] = acc
    out = low + (out - low) * 6.0
    # and a gentle ceiling so the shelf cannot make the top end hiss
    lp2 = math.exp(-2 * math.pi * 11000 / SR)
    acc = 0.0
    for i in range(n):
        acc = lp2 * acc + (1 - lp2) * out[i]
        out[i] = acc

    # A slow tremble across the whole bed, so it breathes with the film.
    t = np.arange(n) / SR
    out *= 1.0 + 0.035 * np.sin(2 * np.pi * 0.045 * t)

    left = out
    right = np.roll(out, int(0.009 * SR)) * 0.99
    peak = max(np.abs(left).max(), np.abs(right).max(), 1e-9)
    gain = 0.55 / peak
    return np.stack([left * gain, right * gain], axis=1)


def write_wav(path, stereo):
    pcm = (np.clip(stereo, -1, 1) * 32767).astype("<i2")
    with wave.open(str(path), "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())


def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--out", default="audio/score.wav")
    ap.add_argument("--seconds", type=float, default=1000.0)
    ap.add_argument("--seed", type=int, default=7)
    a = ap.parse_args()
    audio = build(a.seconds, a.seed)
    write_wav(a.out, audio)
    print(f"wrote {a.out} ({a.seconds:.0f}s, {BPM:.0f} BPM, {len(CHORDS)} chords)")


if __name__ == "__main__":
    main()
