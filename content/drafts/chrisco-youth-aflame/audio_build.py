"""The rally mix: open-air PA, a crowd that answers, and a gospel bed underneath.

Everything here is synthesised (no licensing, nothing to clear), and every choice comes from the
brief's own sound-engineering notes:

* **PA slapback.** A 140 ms delay at 15% wet on the speaker's voice, so he sounds like he is coming
  out of the roof-mounted speakers on the trailing Prado across an open trading centre, rather than
  speaking into a close mic in a quiet room. A short pre-delay and a mild one-pole low-pass on the
  repeat: distance eats high frequencies first, and that is most of what makes a voice sound far
  away.
* **Crowd bed at -18 dB.** Continuous, under everything, never absent — an outdoor rally with a
  silent crowd sounds like a mistake.
* **Stingers on the rhetorical beats.** The crowd answers at the question marks and the punchlines
  *after* the line lands, not on top of it. In the source script these are marked as interactive
  ("Hapana!" / "Zaidi!"), and they are the thing that makes the edit feel like an event.
* **Gospel bed at -22 dB, building.** Rises across the five scenes so the last chant has somewhere
  to go.

  python3 audio_build.py --project content/drafts/chrisco-youth-aflame
"""
import argparse
import math
import pathlib
import subprocess
import sys

import numpy as np

SR = 48000

TAKE = {"1": "S1_greeting", "2": "S2_enemy", "3": "S3_plan",
        "4": "S4_question", "5": "S5_finale"}


# --------------------------------------------------------------------------- helpers
def run(cmd):
    r = subprocess.run([str(c) for c in cmd], capture_output=True, text=True)
    if r.returncode != 0:
        sys.exit(f"FAILED: {' '.join(map(str, cmd))}\n{r.stderr[-2000:]}")


def load(path):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", str(path), "-ac", "1", "-ar", str(SR),
                          "-f", "f32le", "-"], capture_output=True).stdout
    return np.frombuffer(raw, np.float32).astype(np.float64)


def save(path, mono):
    pcm = (np.clip(mono, -1, 1) * 32767).astype("<i2")
    import wave
    with wave.open(str(path), "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes(pcm.tobytes())


def norm(x, peak=0.9):
    m = np.abs(x).max()
    return x if m < 1e-9 else x * (peak / m)


# --------------------------------------------------------------------------- crowd
def crowd(seconds, seed=5):
    """A crowd as noise shaped into voices, not a hiss.

    A rally crowd is a few hundred people talking at once: broadband noise with slow swells, plus
    individual whoops that rise above it now and then. Pure filtered noise reads as wind; the
    whoops are what make it read as people.
    """
    rng = np.random.default_rng(seed)
    n = int(seconds * SR)
    base = rng.standard_normal(n)

    # shape the noise into a voice band: it should sit where voices sit, not everywhere
    lo = math.exp(-2 * math.pi * 180 / SR)
    hi = math.exp(-2 * math.pi * 3200 / SR)
    acc = 0.0
    band = np.empty(n)
    for i in range(n):
        acc = lo * acc + (1 - lo) * base[i]
        band[i] = acc
    acc = 0.0
    out = np.empty(n)
    for i in range(n):
        acc = hi * acc + (1 - hi) * band[i]
        out[i] = band[i] - acc

    # slow swells: the crowd rises and falls over tens of seconds
    t = np.arange(n) / SR
    swell = 0.62 + 0.38 * (0.5 + 0.5 * np.sin(2 * np.pi * t / 11.0 + rng.uniform(0, 6)))
    swell *= 0.75 + 0.25 * (0.5 + 0.5 * np.sin(2 * np.pi * t / 4.3 + rng.uniform(0, 6)))
    out *= swell

    # individual whoops, scattered: short rising tones with a fast attack
    for _ in range(max(8, int(seconds / 2.2))):
        at = rng.uniform(0.5, max(0.6, seconds - 1.0))
        dur = rng.uniform(0.28, 0.75)
        i0 = int(at * SR); m = int(dur * SR)
        if i0 + m >= n:
            continue
        tt = np.arange(m) / SR
        f0 = rng.uniform(320, 620)
        sweep = f0 * (1 + 0.45 * (tt / dur))          # rises, like a real "whoo"
        ph = 2 * np.pi * np.cumsum(sweep) / SR
        v = np.sin(ph) * np.exp(-((tt - dur * 0.25) ** 2) / (2 * (dur * 0.22) ** 2))
        out[i0:i0 + m] += v * rng.uniform(0.05, 0.16)
    return norm(out, 0.55)


def stinger(seconds, kind="roar", seed=9):
    """One crowd reaction. A roar is broader and longer; a cheer is brighter and shorter."""
    rng = np.random.default_rng(seed)
    n = int(seconds * SR)
    t = np.arange(n) / SR
    src = rng.standard_normal(n)
    lo = math.exp(-2 * math.pi * (140 if kind == "roar" else 260) / SR)
    acc = 0.0; band = np.empty(n)
    for i in range(n):
        acc = lo * acc + (1 - lo) * src[i]; band[i] = acc
    env = np.minimum(1.0, t / (0.10 if kind == "cheer" else 0.22)) * np.exp(-t / (seconds * 0.42))
    out = band * env
    # a few bright voices on top
    for _ in range(6 if kind == "cheer" else 4):
        f = rng.uniform(400, 900); ph = rng.uniform(0, 6)
        out += np.sin(2 * np.pi * f * t + ph) * env * rng.uniform(0.05, 0.11)
    return norm(out, 0.8)


# --------------------------------------------------------------------------- PA
def slapback(voice, delay_ms=140.0, wet=0.15, tail=0.5):
    """140 ms slapback at 15% wet, with the repeat dulled -- that is what distance sounds like."""
    d = int(delay_ms / 1000 * SR)
    n = len(voice) + d + int(tail * SR)
    out = np.zeros(n)
    out[:len(voice)] += voice
    rep = np.zeros(n)
    rep[d:d + len(voice)] += voice
    # one-pole low-pass on the repeat only
    a = math.exp(-2 * math.pi * 2600 / SR)
    acc = 0.0
    dull = np.empty(n)
    for i in range(n):
        acc = a * acc + (1 - a) * rep[i]; dull[i] = acc
    out += dull * wet
    return norm(out, 0.92)


# --------------------------------------------------------------------------- music
def bed(seconds, seed=3):
    """A gospel praise bed: D major, 4/4, light syncopation, building across the film.

    The brief asks for something that 'builds in energy toward the end', so the arrangement is
    driven by a single envelope: at the top it is a soft pad; by the finale there are plucked
    chords on the off-beats and a bass line. No drums -- a synthesized kit would sound cheap next
    to a real crowd, and the crowd is the rhythm here.
    """
    rng = np.random.default_rng(seed)
    n = int(seconds * SR)
    out = np.zeros(n)
    bpm = 104.0
    beat = 60.0 / bpm
    bar = 4 * beat
    chords = [[50, 57, 62, 66], [47, 54, 59, 62], [43, 50, 55, 59], [45, 52, 57, 61]]  # D Bm G A
    bars = int(seconds / bar) + 1
    t = np.arange(n) / SR
    build = np.clip(t / max(1.0, seconds * 0.92), 0, 1) ** 1.35     # nothing -> full

    def pluck(f, dur, amp):
        m = int(dur * SR); tt = np.arange(m) / SR
        v = (np.sin(2 * np.pi * f * tt) + 0.35 * np.sin(4 * np.pi * f * tt)
             + 0.12 * np.sin(6 * np.pi * f * tt))
        return v * np.exp(-tt * 5.2) * np.minimum(1.0, tt / 0.008) * amp

    def hz(m):
        return 440.0 * 2 ** ((m - 69) / 12)

    for b in range(bars):
        chord = chords[b % 4]
        i0 = int(b * bar * SR)
        if i0 >= n:
            break
        # pad: whole bar, grows with the build
        m = min(n - i0, int(bar * 1.05 * SR))
        tt = np.arange(m) / SR
        for note in chord:
            v = np.sin(2 * np.pi * hz(note) * tt + rng.uniform(0, 6))
            v += 0.3 * np.sin(4 * np.pi * hz(note) * tt + rng.uniform(0, 6))
            env = np.minimum(1.0, tt / 0.7) * np.minimum(1.0, (m / SR - tt) / 0.8).clip(0, 1)
            out[i0:i0 + m] += v * env * 0.085 * (0.55 + 0.45 * build[i0])
        # off-beat plucks, later in the film
        if b % 2 == 0:
            for k, note in enumerate(chord[1:]):
                at = i0 + int((1.5 + k * 0.5) * beat * SR)
                if at >= n:
                    break
                seg = pluck(hz(note + 12), 0.9, 0.10 * build[min(at, n - 1)])
                e = min(n, at + len(seg))
                out[at:e] += seg[: e - at]
        # bass on the downbeat and the third beat, from the middle of the film onward
        if build[min(i0, n - 1)] > 0.35:
            for at_beat in (0, 2):
                at = i0 + int(at_beat * beat * SR)
                if at >= n:
                    break
                seg = pluck(hz(chord[0] - 24), 0.55, 0.16 * build[min(at, n - 1)])
                e = min(n, at + len(seg))
                out[at:e] += seg[: e - at]

    # tame the top end so the bed sits under a voice without competing
    a = math.exp(-2 * math.pi * 4200 / SR)
    acc = 0.0; lp = np.empty(n)
    for i in range(n):
        acc = a * acc + (1 - a) * out[i]; lp[i] = acc
    return norm(lp, 0.6), build


# --------------------------------------------------------------------------- build
def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--project", required=True)
    a = ap.parse_args()
    proj = pathlib.Path(a.project)
    sys.path.insert(0, str(proj))
    import script as S

    tl, lead, total = S.timeline()
    n = int(total * SR)
    t = np.arange(n) / SR
    print(f"timeline {total:.2f}s, {len(tl)} scenes")

    voice = np.zeros(n)
    for sc in tl:
        v = load(proj / "audio" / "takes" / f"{TAKE[str(sc['id'])]}.wav")
        v = slapback(v)
        i0 = int(sc["start"] * SR)
        e = min(n, i0 + len(v))
        voice[i0:e] += v[: e - i0]

    # crowd bed at about -18 dB under the voice
    cw = crowd(total)
    # The brief's levels are relative to the voice, so they are set from the measured voice level
    # rather than guessed once and left: 0.25 put the bed at -20.5 dB under speech. Gain is the
    # square root of the power ratio, and the -18 figure is the target under speech, not overall.
    # Reference the bed to the voice WHILE HE IS SPEAKING, not to the whole track. The voice is
    # intermittent and the bed is continuous, so a whole-track reference under-delivers by ~2 dB
    # exactly when it matters -- during a line.
    _w = int(0.2 * SR)
    _n = len(voice) // _w
    _f = np.array([np.sqrt((voice[i * _w:(i + 1) * _w] ** 2).mean()) for i in range(_n)])
    _act = _f > 10 ** (-30 / 20)
    v_rms = float(np.sqrt(np.mean(_f[_act] ** 2)))
    c_rms = float(np.sqrt((cw ** 2).mean()))
    amb = cw * (v_rms / max(c_rms, 1e-9)) * 10 ** (-18 / 20)
    bed_only = amb.copy()                      # the continuous bed, kept unmixed for measurement
    # stingers on the accents
    for acc in S.ACCENTS:
        sc = next(s for s in tl if s["id"] == acc["scene"])
        at = sc["start"] + acc["at"]
        kind = "roar" if acc["kind"] == "roar" else "cheer"
        st = stinger(2.4 if kind == "roar" else 1.5, kind, seed=acc["scene"] * 13 + int(acc["at"]))
        i0 = int(at * SR)
        e = min(n, i0 + len(st))
        amb[i0:e] += st[: e - i0] * 0.50

    mus, build = bed(total)
    m_rms = float(np.sqrt((mus ** 2).mean()))
    music = mus * (v_rms / max(m_rms, 1e-9)) * 10 ** (-22 / 20)

    mix = voice + amb + music
    peak = np.abs(mix).max()
    if peak > 0.98:
        mix *= 0.98 / peak
    save(proj / "audio" / "mix.wav", mix)
    print(f"mix.wav written ({total:.2f}s)")
    # stems, so each layer's level can be measured rather than trusted
    for name, x in (("voice", voice), ("amb", amb), ("music", music)):
        save(proj / "audio" / f"stem_{name}.wav", x)
    save(proj / "audio" / "stem_bed.wav", bed_only)   # crowd, before the stingers
    print("stems written")


if __name__ == "__main__":
    main()
