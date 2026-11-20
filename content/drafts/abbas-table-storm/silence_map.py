"""Build the silence map for the 14:27 cut, then rebuild the film around it.

WHY THIS EXISTS. The delivered cut is 74 % continuous speech at 165 wpm. Everything that makes a
retelling bearable to sit inside -- the pause after "asleep on the cushion", the nothing after
"Peace. Be still.", the room after "Why are you so afraid?" -- was spent to buy the 14:27 runtime,
because the runtime was the thing being tuned. So the runtime target goes, and the silences come
back by name.

HOW. Two additions to `script.json`, both read by the engine itself so the picture and the sound
cannot disagree:

* `gap_after` on the eight hinge lines. The narration builder already turns this number into real
  silence in the track, and `timing.json` then carries it into every start time in the film.
* `silence` on the same eight lines: the sound the frame is left with while nobody is speaking, and
  what the score does there. `ambience.py` renders exactly that.

Nothing is re-recorded and not a word of the script changes. The read stays at 165 wpm; it is given
somewhere to land.

  python3 silence_map.py --project content/drafts/abbas-table-storm
"""
import argparse
import json
import pathlib
import re

# ---- the hinges ------------------------------------------------------------------------------
# One entry per silence. `line` is the line the silence FOLLOWS. `kind` picks the bed under it.
# These are the eight moments the story cannot afford to hurry through; nothing else in the film
# gets more than the standard breath.
# Where each hinge sits in the DELIVERED cut, read from its own subtitle track. These are here so
# the mix can prove it changed something: they are the "before" column in FEEDBACK.md.
BEFORE = [
    ( 29,  301.02,  302.82),   # sits, Jesus was asleep.
    ( 38,  341.54,  342.67),   # Teacher, don't you care that we are dyin
    ( 47,  391.17,  393.06),   # Peace. Be still.
    ( 51,  413.94,  416.95),   # The wind dropped, and there was a great 
    ( 58,  479.55,  482.64),   # and it had stopped in the middle of a
    ( 63,  519.99,  523.58),   # and He asks it after the water is flat.
    ( 82,  600.33,  601.61),   # Who then is this,
    (104,  820.44,  823.01),   # In Jesus' name, amen.
]

HINGES = [
    dict(line=29, gap=4.6, kind="wind",  gain=0.55,
         why="Jesus is asleep in a boat that is filling. Let the water have the frame before "
             "anyone says a word about it."),
    dict(line=38, gap=2.4, kind="wind",  gain=0.40,
         why="\"Teacher, don't you care that we are dying\" is a wound, not a question."),
    dict(line=47, gap=4.8, kind="hush",  gain=0.30,
         why="The four words. The film must go quiet exactly here or the miracle happens off-screen."),
    dict(line=51, gap=4.0, kind="lake",  gain=0.28,
         why="A great calm. The single most important silence in the story."),
    dict(line=58, gap=3.2, kind="lake",  gain=0.24,
         why="Let the listener sit in the boat and not move."),
    dict(line=63, gap=3.0, kind="lake",  gain=0.22,
         why="\"He asks it after the water is flat.\" The pause is the mercy; do not rush it."),
    dict(line=82, gap=3.4, kind="lake",  gain=0.20,
         why="\"Who then is this.\" Leave it standing at the edge of the water."),
    dict(line=104, gap=6.0, kind="lake",  gain=0.18,
         why="After the amen, the lake, alone. Nothing else for six seconds."),
]


def load(proj):
    p = proj / "script.json"
    return p, json.loads(p.read_text())


def apply(doc, report=True):
    """Write the hinges into the script. Returns the line-id -> hinge map."""
    by_id = {l["id"]: l for t in doc["takes"] for l in t["lines"]}
    missing = [h["line"] for h in HINGES if h["line"] not in by_id]
    if missing:
        raise SystemExit(f"hinge lines not in script: {missing}")
    for h in HINGES:
        ln = by_id[h["line"]]
        ln["gap_after"] = h["gap"]           # for the narration builder, if it is ever re-recorded
        ln["gap_hold"] = h["gap"]            # for the picture: the shot holds across the silence
        ln["silence"] = dict(kind=h["kind"], gain=h["gain"])
    if report:
        print(f"{len(HINGES)} silences marked")
        for h in HINGES:
            print(f"  line {h['line']:3d}  +{h['gap']:.1f}s  {h['kind']:5s}  {by_id[h['line']]['text'][:52]}")
    return {h["line"]: h for h in HINGES}


def mix_gains(script_path, ambience_path):
    """Set the ambience level per hinge from the bed's own measurement, not from a constant.

    Every silence gets a target in dB BELOW the film's own loudest ambience -- that is the only
    scale that matters, because it is what the listener hears as "the storm is over". A single gain
    for the whole bed cannot do this: the bed's own level already swings 14 dB with the story.
    """
    import numpy as np
    import wave
    doc = json.loads(pathlib.Path(script_path).read_text())
    by_id = {l["id"]: l for t in doc["takes"] for l in t["lines"]}
    with wave.open(str(ambience_path)) as w:
        sr = w.getframerate()
        a = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768
    loud = 20 * np.log10(np.sqrt((a[int(198 * sr):int(232 * sr)] ** 2).mean()) + 1e-9)
    rowsp = []
    for h in HINGES:
        ln = by_id[h["line"]]
        t0, t1 = int((ln["_start"]) * sr), int((ln["_end"] + h["gap"]) * sr)
        seg = a[t0:min(len(a), t1)]
        lvl = float(20 * np.log10(np.sqrt((seg ** 2).mean()) + 1e-9)) if len(seg) else -90.0
        ln["silence"]["gain"] = round(float(10 ** ((loud - 22 - lvl) / 20)), 4)
        rowsp.append((h["line"], round(lvl, 1), ln["silence"]["gain"]))
    pathlib.Path(script_path).write_text(json.dumps(doc, indent=1, ensure_ascii=False) + "\n")
    print(f"storm bed level {loud:.1f} dBFS; each hinge trimmed to 22 dB under it")
    for lid, lvl, g in rowsp:
        print(f"  line {lid:3d}  bed there {lvl:6.1f} dB  gain x{g:.3f}")


def stats(doc):
    """Rough runtime and speech share, using the engine's own letter-rate model.

    The engine estimates a line's length from its letters at LETTERS_PER_SECOND (18.5). That is not
    the real read, but it is monotone in the real read, so the *change* it reports is trustworthy
    even when the absolute number is not.
    """
    lines = [l for t in doc["takes"] for l in t["lines"]]
    lps = 18.5

    def dur(l):
        return len(re.sub(r"[^A-Za-z]", "", l["spoken"])) / lps

    speech = sum(dur(l) for l in lines)
    gaps = sum(l.get("gap_after", 0.45) for l in lines[:-1])
    return speech, gaps, 0.9 + speech + gaps + 3.0


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--project", required=True)
    ap.add_argument("--dry-run", action="store_true")
    a = ap.parse_args()
    proj = pathlib.Path(a.project)
    path, doc = load(proj)

    s0, g0, t0 = stats(doc)
    apply(doc, report=True)
    s1, g1, t1 = stats(doc)
    print(f"\nestimated runtime  {t0/60:.2f} min -> {t1/60:.2f} min  (+{t1-t0:.0f}s of silence)")
    print(f"speech share       {100*s1/t1:.0f}%  (the delivered cut measured 74%)")
    if not a.dry_run:
        path.write_text(json.dumps(doc, indent=1, ensure_ascii=False) + "\n")
        print(f"wrote {path}")


if __name__ == "__main__":
    main()
