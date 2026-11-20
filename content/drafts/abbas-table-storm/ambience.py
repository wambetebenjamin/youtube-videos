"""The sound of the night on the lake: wind, rain, water in a boat, and then nothing.

WHY. The delivered cut measures within ±1 dB for fourteen minutes -- the storm, the calm and the
prayer are all at -18 dBFS. The viewer's "something is missing" is that flatness: an unchanging bed
is the audio equivalent of a picture that never moves, and after ninety seconds the ear files it as
room tone and stops hearing it at all.

WHAT THIS MAKES. One continuous bed, driven by a timeline rather than a loop, so it can follow the
story:

* **wind** -- lake wind before the storm, a cold gust front during it.
* **rain** -- falling on water in the squall.
* **hull** -- water slapping the planking, the low knock of a boat taking a wave.
* **lake** -- shallow lapping on a shore, the after-silence sound.
* **hush** -- almost nothing: the air after a noise that size. A whisper of lake, no wind.

Everything is synthesised from filtered noise and shaped by hand-built envelopes, so there is
nothing to license and the levels can be set exactly.

  python3 ambience.py --project content/drafts/abbas-table-storm --seconds 900
"""
import argparse
import json
import pathlib

import numpy as np

SR = 48000


# ---------------------------------------------------------------------------------------- noise
def pink(n, rng):
    """Pink-ish noise: white, integrated with a leaky pole. Cheap and close enough to wind."""
    w = rng.standard_normal(n)
    out = np.empty(n, np.float32)
    b0 = b1 = b2 = 0.0
    # Paul Kellet's economy filter
    for i in range(0, n, 1):
        b0 = 0.99765 * b0 + w[i] * 0.0990460
        b1 = 0.96300 * b1 + w[i] * 0.2965164
        b2 = 0.57000 * b2 + w[i] * 1.0526913
        out[i] = b0 + b1 + b2 + w[i] * 0.1848
    # Normalised to RMS, not peak: a single gust was setting the peak and leaving everything else
    # 20 dB down. The mix script then sets the absolute level against the measured voice.
    return out / (np.sqrt((out ** 2).mean()) + 1e-9) * 0.25


def brown(n, rng):
    """Brown noise: deep water rumble."""
    w = rng.standard_normal(n)
    out = np.cumsum(w)
    out -= np.linspace(out[0], out[-1], n)          # kill the DC ramp
    return (out / (np.abs(out).max() + 1e-9)).astype(np.float32)


def one_pole_lp(x, fc):
    a = np.exp(-2 * np.pi * fc / SR)
    y = np.empty_like(x)
    acc = 0.0
    for i in range(len(x)):
        acc = a * acc + (1 - a) * x[i]
        y[i] = acc
    return y


def one_pole_hp(x, fc):
    return x - one_pole_lp(x, fc)


def bandpass(x, lo, hi):
    """Two cascaded poles each way. Gentle slopes are fine here: it is weather, not a hi-fi test."""
    return one_pole_hp(one_pole_hp(one_pole_lp(one_pole_lp(x, hi), hi), lo), lo)


# ------------------------------------------------------------------------------- the layers
def wind_layer(n, rng, intensity):
    """Wind. `intensity` 0..1 raises both level and the pitch of the gusts."""
    base = pink(n, rng)
    body = bandpass(base, 90, 900)
    # gusts: a slow random envelope, faster and deeper when it is blowing hard
    rate = 0.11 + 0.22 * intensity
    t = np.arange(n) / SR
    ph = rng.uniform(0, 6.28, 3)
    gust = (0.55 + 0.45 * np.sin(2 * np.pi * rate * t + ph[0])
            * np.sin(2 * np.pi * rate * 0.61 * t + ph[1]))
    whistle = bandpass(pink(n, rng), 700, 2400) * 0.16 * intensity
    return (body * gust + whistle) * (0.35 + 0.65 * intensity)


def rain_layer(n, rng, intensity):
    """Rain on open water: broadband hiss with a fine flutter of drops."""
    hiss = bandpass(pink(n, rng), 900, 7000)
    drops = np.zeros(n, np.float32)
    count = int(n / SR * 34 * intensity)
    idx = rng.integers(0, n - 400, count)
    for i in idx:
        d = rng.uniform(0.6, 1.0)
        drops[i:i + 60] += rng.standard_normal(60).astype(np.float32) * d * np.linspace(1, 0, 60)
    return (hiss * 0.8 + drops * 0.5) * intensity


def hull_layer(n, rng, intensity):
    """The boat itself: water against planking, and the knock when she comes off a wave."""
    slap = bandpass(pink(n, rng), 250, 1800)
    t = np.arange(n) / SR
    env = np.clip(np.sin(2 * np.pi * (0.9 + 0.4 * intensity) * t) ** 6, 0, 1)
    knock = np.zeros(n, np.float32)
    period = 1.15 + 0.5 * (1 - intensity)
    k = 0.0
    while k * period < n / SR:
        i = int(k * period * SR)
        if i < n - 4000:
            f = np.linspace(70, 45, 4000)
            knock[i:i + 4000] += (np.sin(2 * np.pi * np.cumsum(f) / SR)
                                  * np.exp(-np.linspace(0, 5, 4000))
                                  * rng.uniform(0.5, 1.0)).astype(np.float32)
        k += 1
    return slap * (0.35 + env) + knock * 0.85 * intensity


def lake_layer(n, rng, intensity=1.0):
    """A flat lake at night: shallow lapping, wide and calm, almost no top end."""
    lap = bandpass(pink(n, rng), 120, 900)
    t = np.arange(n) / SR
    env = 0.6 + 0.4 * np.sin(2 * np.pi * 0.13 * t) * np.sin(2 * np.pi * 0.077 * t + 1.3)
    return lap * env * intensity


def hush_layer(n, rng):
    """After the noise: air, a little water, nothing else."""
    return bandpass(pink(n, rng), 160, 700) * 0.55


# ------------------------------------------------------------------------------------ the map
# The film's shape. Each entry is (start, end, what). Between entries the last one holds.
# The storm section is loud; the calm is a drop-out, not a fade. A fade would say "we are leaving
# the storm"; a drop-out says "the storm is gone", which is what Mark says.
SHAPE = [
    # t0    t1    wind  rain  hull kind
    (0.0,   3.0,   0.10, 0.00, 0.00, "lake"),    # before a word: a shore at dusk
    (3.0,  120.0,  0.16, 0.00, 0.06, "lake"),    # the long day by the water
    (120.0, 168.0, 0.26, 0.00, 0.10, "lake"),    # evening, the oars
    (168.0, 196.0, 0.46, 0.06, 0.22, "lake"),    # the air turning
    (196.0, 232.0, 0.95, 0.55, 0.85, "storm"),   # it came down on them all at once
    (232.0, 292.0, 1.00, 0.62, 1.00, "storm"),   # the water over their ankles
    (292.0, 312.0, 0.66, 0.26, 0.58, "storm"),   # ...and He was asleep
    (312.0, 344.0, 0.80, 0.34, 0.70, "storm"),   # Teacher, don't you care
    (344.0, 392.5, 0.94, 0.48, 0.84, "storm"),   # He got up
    # ...and then nothing. Mark does not say the wind eased: "there was a great calm". A fade here
    # would say we are leaving the storm. The bed stops dead at "Peace. Be still." and the lake
    # takes over, which is the one moment in the film where the sound must visibly change.
    (392.5, 393.4, 0.30, 0.10, 0.22, "storm"),
]

# The hinge silences are punched into the bed by silence_map.py, not here: the same file decides
# where the film goes quiet and where the sound dries up, so they cannot drift apart.


def build(seconds, shape_end=392.9, seed=11, fade=2.0):
    rng = np.random.default_rng(seed)
    n = int(seconds * SR)
    t = np.arange(n) / SR
    out = np.zeros(n, np.float32)

    # one instance of each layer, long enough, then windowed into the shape
    wind = wind_layer(n, rng, 1.0)
    rain = rain_layer(n, rng, 1.0)
    hull = hull_layer(n, rng, 1.0)
    lake = lake_layer(n, rng, 1.0)
    hush = hush_layer(n, rng)

    def ramp_env(a, b, rise=1.5, fall=1.5):
        e = np.zeros(n, np.float32)
        i0, i1 = int(a * SR), int(min(n, b * SR))
        if i1 <= i0:
            return e
        seg = np.ones(i1 - i0, np.float32)
        r = min(len(seg) // 2, int(rise * SR))
        f = min(len(seg) // 2, int(fall * SR))
        if r > 0:
            seg[:r] = np.linspace(0, 1, r)
        if f > 0:
            seg[-f:] = np.linspace(1, 0, f)
        e[i0:i1] = seg
        return e

    for i, (a, b, w, r, h, kind) in enumerate(SHAPE):
        # A short fade in at the head of each entry, but the LAST storm entry falls fast (0.5 s):
        # the calm has to arrive as an event, not as a mix move.
        fall = 0.5 if kind == "storm" and b > 380 else 2.5
        e = ramp_env(a, b, rise=2.5 if i else 0.8, fall=fall)
        out += wind * w * e
        out += rain * r * e
        out += hull * h * e

    # after the storm: the lake, and the hush, for the rest of the film
    tail = ramp_env(shape_end, seconds + 1, rise=0.45, fall=0.0)
    out += (lake * 0.30 + hush * 0.22) * tail

    # a very slow level wander so no two minutes are identical
    out *= (0.92 + 0.08 * np.sin(2 * np.pi * 0.011 * t + 0.7)).astype(np.float32)

    out[: int(fade * SR)] *= np.linspace(0, 1, int(fade * SR))
    out[-int(fade * SR):] *= np.linspace(1, 0, int(fade * SR))
    # Normalised to RMS, not peak: a single gust was setting the peak and leaving everything else
    # 20 dB down. The mix script then sets the absolute level against the measured voice.
    return out / (np.sqrt((out ** 2).mean()) + 1e-9) * 0.25


def write(path, x):
    import wave
    pcm = np.clip(x, -1, 1)
    pcm = (pcm * 32767).astype(np.int16)
    with wave.open(str(path), "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes(pcm.tobytes())


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--project", required=True)
    ap.add_argument("--seconds", type=float, default=900.0)
    ap.add_argument("--out", default="audio/ambience.wav")
    a = ap.parse_args()
    proj = pathlib.Path(a.project)
    x = build(a.seconds)
    (proj / "audio").mkdir(parents=True, exist_ok=True)
    write(proj / a.out, x)
    print(f"wrote {proj/a.out} ({a.seconds:.0f}s)")


if __name__ == "__main__":
    main()
