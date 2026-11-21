"""Peace, Be Still -- the reference-style cut.

WHAT THIS IS. The same narration and the same twenty-four pictures as the long edition, edited in the
grammar of the reference video: a cold open over a title, six numbered signs with their own cards and
chapter bars, scripture both as a reference lower third and as a full typeset verse, B-roll cutaways
that start on the word they illustrate, one warm grade over everything, and a subscribe card at the
end.

WHAT IT IS NOT. It does not pretend to be the reference's *content*. The reference is a teaching about
six signs of a new season; this is the story of the storm as Mark tells it. The **shape** is borrowed,
because the shape is what the viewer asked for. The words are not, and nothing here has been
rewritten to fit a listicle: the six signs are the six movements the story already has.

TIMING. Every start time comes from `audio/timing.json`, which was recovered from the delivered film's
own subtitle track (`recover_timing.py`) -- so no line can land on the wrong word, and the picture
cannot drift from the voice.

  python3 render.py --project content/drafts/abbas-table-storm-reference --probe 20,200,520 --size 1920x1080
"""
import json
import pathlib
import sys

HERE = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent.parent.parent / "tools" / "cinematic-skill"
                       / "skills" / "cinematic-film" / "scripts"))
sys.path.insert(0, str(HERE.parent / "abbas-table-storm"))
sys.path.insert(0, str(HERE))

import skia

import content_map as CM
import graphics as G
from art2 import Photo, Scripture as VerseBlock, install_full_res_loader
from engine import Film, Item, draw_text, paint, ramp, ease_in_out

install_full_res_loader()

CREAM = (246, 241, 232)
FRAME_W, FRAME_H = G.FRAME_W, G.FRAME_H
PHOTO_ASPECT = 16 / 9

# A cross-dissolve of 0.45 s, as the reference does for B-roll, and 1.0 s for a chapter boundary.
DISSOLVE = 0.45
CHAPTER_DISSOLVE = 1.0

# Plates: (push over the shot, lateral creep). Kept small: a Ken Burns that anyone can see reads as
# a slideshow trying too hard. The reference's push-ins are barely perceptible until they land.
PLATES = {
    "01_shore_dusk": (0.045, 0.004), "02_teaching_from_boat": (0.040, -0.006),
    "03_seed_and_soil": (0.048, 0.003), "04_let_us_go_over": (0.042, 0.005),
    "05_other_boats": (0.046, -0.004), "06_storm_rising": (0.055, 0.006),
    "07_waves_into_boat": (0.060, -0.005), "08_boat_filling": (0.058, 0.004),
    "09_asleep_on_cushion": (0.038, 0.002), "10_they_wake_him": (0.050, -0.004),
    "11_do_you_not_care": (0.052, 0.003), "12_peace_be_still": (0.030, 0.001),
    "13_the_calm": (0.026, 0.002), "14_why_are_you_afraid": (0.034, -0.002),
    "15_fear_in_boat": (0.040, 0.003), "16_he_cares": (0.032, -0.002),
    "17_who_then_is_this": (0.038, 0.002), "18_open_question": (0.030, 0.001),
    "19_after": (0.028, 0.002), "20_prayer": (0.026, 0.001),
    "21_prayer_hands": (0.028, -0.001), "22_peace_lake": (0.024, 0.002),
    "23_sleep_in_peace": (0.026, 0.001), "24_lamp_window": (0.030, -0.001),
}


def lines(project):
    return json.loads((pathlib.Path(project) / "script.json").read_text())


def _all_lines(project):
    d = lines(project)
    return [l for t in d["takes"] for l in t["lines"]]


def build_film(doc, project=None):
    project = pathlib.Path(project) if project else HERE
    ls = _all_lines(project)
    CM.check(ls)
    by_id = {l["id"]: l for l in ls}

    def L(i):
        return doc.L(i)

    def E(i):
        return doc.E(i)

    end = doc.duration
    film = Film(end, fps=30, look="night")

    # ---------------------------------------------------------------- the plate plan
    # Walk the narration in order and decide which picture is on screen for each line: an explicit
    # A-roll key where the map gives one, otherwise the previous plate holds.
    plan = []                                   # (first_line, last_line, key)
    current = "01_shore_dusk"
    for ln in ls:
        key = CM.PLATE_BY_LINE.get(ln["id"], current)
        if plan and plan[-1][2] == key:
            plan[-1] = (plan[-1][0], ln["id"], key)
        else:
            plan.append((ln["id"], ln["id"], key))
        current = key

    # A plate that covers less than a beat is a flash frame: fold it into its neighbour.
    def span(p):
        return L(p[1]) - L(p[0])

    merged = []
    for p in plan:
        if merged and span(p) < 2.0:
            merged[-1] = (merged[-1][0], p[1], merged[-1][2])
        else:
            merged.append(list(p) if False else p)
    plan = merged

    shots = []
    for i, (a, b, key) in enumerate(plan):
        drift, pan = PLATES[key]
        # a sign boundary dissolves slowly; everything else is a 0.45 s cross-fade
        boundary = any(a == s["lines"][0] for s in CM.SIGNS)
        fade = CHAPTER_DISSOLVE if boundary else DISSOLVE
        shots.append(dict(key=key, a=a, b=b, t_in=max(0.0, L(a) - 0.25),
                          fade=fade, drift=drift, pan=pan))
    for s, n in zip(shots, shots[1:]):
        s["t_out"] = n["t_in"]
    shots[-1]["t_out"] = end + 1.0

    for i, s in enumerate(shots):
        film.add(Photo(s["key"], 0, 0, FRAME_W * 1.02, s["t_in"], t_out=s["t_out"],
                       drift=s["drift"], pan=(s["pan"], s["pan"] * 0.35), seed=i * 31 + 7,
                       fade_in=0.6 if i == 0 else s["fade"]))

    # ---------------------------------------------------------------- B-roll cutaways
    # Each one starts on the word it illustrates, not a sentence late, and is short enough that it
    # reads as a cutaway rather than as a change of scene.
    placed = []                                  # every picture on screen, in time order
    for lid, key, dur in CM.BROLL:
        t0 = L(lid)
        # If a cutaway opens on the same line a new plate opens on, the plate has already started
        # dissolving 0.25 s earlier -- so the cutaway starts there too, instead of flashing the
        # wrong picture for a quarter of a second.
        if lid in CM.PLATE_BY_LINE:
            t0 -= 0.25
        if t0 + dur > end - 4:
            continue
        placed.append((t0, t0 + dur, key))
        drift, pan = PLATES.get(key, (0.05, 0.0))
        film.add(Photo(key, 0, 0, FRAME_W * 1.03, t0, t_out=t0 + dur,
                       drift=drift * 0.7, pan=(pan, pan * 0.4), seed=lid * 13 + 5,
                       fade_in=DISSOLVE, z=20))

    # (start, end) of every full-screen card, so anything that fades up on the picture knows when
    # the picture is not a picture.
    cards = [(max(0.0, L(lid) - 2.6), L(lid)) for lid, _, _ in CM.CARDS]
    cards.append((end - 12.0, end - 5.0))                     # the end card

    # ---------------------------------------------------------------- pacing
    # Whatever the hand-placed cutaways left uncovered, the rule covers: no picture holds past 30 s.
    # This runs on what is ACTUALLY on screen -- the plates with their real in/out points, split by
    # the cutaways already laid over them. Running it on the plate plan alone (as the first version
    # did) computed the right answers and then let the cutaways sit on top of them, so the schedule
    # was unchanged and the film still had 35 s holds.
    import pacing
    timeline = sorted([(s["t_in"], s["t_out"], s["key"]) for s in shots] + placed)
    # the units that have to fit the rule are the stretches one picture is alone on screen,
    # interrupted by the hand-placed cutaways and by the full-screen graphics
    graphics = [(c[0], c[1]) for c in cards] + [
        (it.t_in, it.t_out) for it in film.items if type(it).__name__ == "Scripture"]
    pieces = pacing.gaps_between(timeline, graphics)
    blocked = set(CM.PLATE_BY_LINE.values())
    for t0, t1, key in pacing.fill(pieces, blocked=blocked):
        drift, pan = PLATES.get(key, (0.05, 0.0))
        film.add(Photo(key, 0, 0, FRAME_W * 1.03, t0, t_out=t1,
                       drift=drift * 0.7, pan=(pan, pan * 0.4), seed=int(t0 * 7) + 3,
                       fade_in=DISSOLVE, z=20))

    # ---------------------------------------------------------------- camera
    # The camera never travels: it holds the frame and lets each picture dissolve over the last. The
    # only motion is a slow push, which is the one move that reads as film rather than as a slideshow.
    film.cam(0.0, 0, 0, 1.0)
    for s in shots:
        t0, t1 = s["t_in"], max(s["t_in"] + 0.3, s["t_out"] - 0.01)
        film.cam(t0, 0, 0, 1.0)
        film.cam(t0 + (t1 - t0) * 0.5, 0, 0, 1.004)
        film.cam(t1, 0, 0, 1.008)
    film.cam(end, 0, 0, 1.01)
    film.fade_out = 2.0
    film.fade_in = 1.0

    # ---------------------------------------------------------------- opening
    # The picture and the title arrive on the same frame: the title sits over the picture anyway,
    # and 0.3 s of bare picture before it read as a flicker.
    film.add(G.TitleCard(CM.TITLE, CM.SUBTITLE, 0.95, dur=5.2))

    # ---------------------------------------------------------------- six sign cards + bars
    for sign, (lid, title, kicker) in zip(CM.SIGNS, CM.CARDS):
        t = L(lid)
        # the card lands a beat BEFORE the sign is spoken, which is what makes the number land on
        # the line rather than after it
        film.add(G.SignCard(kicker, title, sign["sub"], t_in=max(0.0, t - 2.6), dur=2.6))
        film.add(G.ChapterLowerThird(kicker, title, sign["sub"], t_in=t - 0.1,
                                     t_out=t + 6.4, hold=6.4))

    # ---------------------------------------------------------------- scripture, twice each
    # Lower third (reference only, bottom right) for the whole quotation, and the full verse typeset
    # in the middle of the frame for the first half of it -- the reference does both.
    for v in CM.VERSES:
        lid = v["at"]
        # The verse fades up on the SAME frame the plate beneath it starts. It used to come 0.2 s
        # later, which left the new picture standing alone for two frames before a graphic covered
        # it -- long enough to read as a flicker on a big screen, and long enough to fail QC.
        t0 = L(lid) - 0.25
        # A verse gets its own window. Before this, the window was derived from where the next
        # verse started, so a verse quoted on a two-second line ran out of room and flashed past in
        # under two seconds -- the shortest of all possible ways to show an eight-second graphic.
        t1 = max(t0 + v.get("hold", 8.5), E(lid) + 1.6)
        t1 = min(t1, L(lid) + v.get("hold", 8.5))
        # The "who then is this" verse is on the line the sixth chapter card opens on. A verse that
        # fades up in the same frame as the card is a legibility accident, so it waits for the card
        # to be gone; and no verse is allowed to run under the end card either.
        for card in cards:
            if t0 < card[1] <= t0 + 0.5:
                t0 = card[1]                  # cover the card's last frame, do not leave a gap
        # if the plate beneath started just before the verse, start the verse on the plate's frame
        for sh in shots:
            if sh["a"] == lid and 0.0 < L(lid) - sh["t_in"] <= 0.7:
                t0 = sh["t_in"]
        # The full verse gets the first part of the window, then the reference lower third takes
        # over for the rest. Running both at once printed "Mark 4:37" twice in two sizes, which
        # reads as a bug rather than as emphasis.
        # The brief asks for a full-frame verse to hold 8-12 s and a scripture lower third to hold
        # 6-10 s. They cannot share one 8 s window, so the verse has the frame first and the
        # reference lower third takes the frame after it -- which is also how the reference video
        # does it: read it, then leave the citation up while the narration moves on.
        block_out = t0 + 8.2
        t1 = block_out + 6.4
        if t1 > end - 12.8:                   # the lower third must not run under the end card
            t1 = end - 12.8
        film.add(VerseBlock(v["ref"], v["text"], 0, 170, 96, t0, t_out=block_out,
                            max_chars=46, rgb=CREAM, rule=G.GOLD, veil=0.72))
        film.add(G.ScriptureLowerThird(v["ref"], block_out + 0.1, t1))

    # ---------------------------------------------------------------- the reframe, once per sign
    for sign in CM.SIGNS:
        t = L(sign["lines"][1]) - 0.6      # the sentence that closes the sign
        film.add(G.KeyQuote(sign["reframe"], max(L(sign["lines"][0]) + 4.0, t), dur=5.0))

    # ---------------------------------------------------------------- the turn and the close
    film.add(G.ChapterLowerThird("THE TURN", "Let us pray", "Where the story becomes a response",
                                 t_in=L(CM.TURN_LINES[0]) - 0.6, t_out=L(CM.TURN_LINES[0]) + 5.4))
    # The CTA runs to exactly end-5, so the last five seconds are clean picture for an end screen.
    film.add(G.EndCard("Subscribe for more", "One story, one prayer at a time",
                       t_in=end - 12.0, t_out=end - 5.0))

    # ---------------------------------------------------------------- the grade
    film.add(G.Grade(0.0, None, amount=1.0))
    return film


class RefDoc:
    """Doc wrapper for the render entry point. Timing still comes from the engine's Doc."""

    def __init__(self, doc):
        self._doc = doc

    def __getattr__(self, k):
        return getattr(self._doc, k)


def _entry(doc=None):
    return build_film(doc, HERE)
