"""Peace, Be Still — Abba's Table, the long edition (Mark 4:35-41).

World units are 4K screen pixels; at 1080p the frame is 3840/zoom units wide. Each photograph is
drawn at exactly that width plus a 2% margin, so it fills the frame edge to edge and nothing is
ever left floating on the background.

The film is a **dissolve gallery**. Pictures are stacked in the world, one frame-width apart. While a
picture is on screen the camera is parked on it; the moment the next one is due the camera *jumps*
to it in a single step. `Film` interpolates linearly between camera keys, so two keys with the same
timestamp read as an instant cut — and because the outgoing picture is still at full strength for
that instant, the change of image happens as a cross-fade in place. No panning across bare canvas,
no picture ever seen as a page sitting on a board.

Everything comes from `script2.lines()`, so a line's words, its picture and its caption cannot drift.
"""
from art2 import Chapter, Photo, Scripture, TitleCart, install_full_res_loader
from engine import BigText, Film
from script2 import TAKES, lines

install_full_res_loader()

CREAM = (246, 241, 232)

CAM_ZOOM = 1.0
_FRAME_W = 3840.0 / CAM_ZOOM     # the visible frame, edge to edge
SPAN = _FRAME_W * 1.025          # +2.5% slack for the Ken Burns push
# Every picture is stacked at the same point in the world and cross-faded into the next. Anything
# else — moving the camera between pictures, or parking them side by side — either shows the gap
# between them or makes the outgoing picture slide out of frame mid-dissolve. Stacking means the
# frame is *always* full, and a change of picture is a dissolve in place.
X_STEP = 0.0

_PLATES = [
    # key, drift (total push over the shot), pan (lateral creep as a fraction of the picture)
    ("01_shore_dusk",         (0.055, 0.008)),
    ("02_teaching_from_boat", (0.052, -0.008)),
    ("03_seed_and_soil",      (0.058, 0.004)),
    ("04_let_us_go_over",     (0.054, 0.006)),
    ("05_other_boats",        (0.050, -0.005)),
    ("06_storm_rising",       (0.060, 0.000)),
    ("07_waves_into_boat",    (0.056, 0.006)),
    ("08_boat_filling",       (0.052, -0.006)),
    ("09_asleep_on_cushion",  (0.046, 0.000)),
    ("10_they_wake_him",      (0.058, 0.006)),
    ("11_do_you_not_care",    (0.050, -0.005)),
    ("12_peace_be_still",     (0.056, 0.000)),
    ("13_the_calm",           (0.044, 0.005)),
    ("14_why_are_you_afraid", (0.048, -0.004)),
    ("15_fear_in_boat",       (0.052, 0.004)),
    ("16_he_cares",           (0.046, 0.000)),
    ("17_who_then_is_this",   (0.050, -0.006)),
    ("18_open_question",      (0.054, 0.004)),
    ("19_after",              (0.048, 0.000)),
    ("20_prayer",             (0.046, -0.004)),
    ("21_prayer_hands",       (0.050, 0.005)),
    ("22_peace_lake",         (0.044, 0.000)),
    ("23_sleep_in_peace",     (0.048, -0.004)),
    ("24_lamp_window",        (0.042, 0.003)),
]
PLATES = dict(_PLATES)

DISSOLVE = 1.1                   # seconds for one picture to give way to the next

# Scripture, keyed to the line whose picture it sits over. WEB.
VERSES = {
    12: ("Mark 4:35", "Let us go over to the other side."),
    16: ("Mark 4:37", "The waves beat into the boat, so much that the boat was already filled."),
    26: ("Mark 4:38", "He himself was in the stern, asleep on the cushion."),
    34: ("Mark 4:38", "Teacher, don't you care that we are dying?"),
    44: ("Mark 4:39", "Peace! Be still!"),
    45: ("Mark 4:39", "There was a great calm."),
    60: ("Mark 4:40", "Why are you so afraid? How is it that you have no faith?"),
    74: ("Mark 4:41", "Who then is this, that even the wind and the sea obey him?"),
    104: ("Psalm 4:8", "In peace I will both lay myself down and sleep."),
}

THE_WORDS_LINE = 43             # the loudest sentence in the story gets the frame to itself

VERSE_SIZE = 112                # world units; ~56 px on screen, read comfortably at 1080p
VERSE_Y = -170
CHAPTER_Y = 300
CHAPTER_SIZE = 58


def build_film(doc):
    L, E = doc.L, doc.E
    film = Film(doc.duration, fps=30, look="night")
    ls = lines()

    # -- group consecutive lines into pictures -----------------------------
    groups = []
    for ln in ls:
        if groups and groups[-1][0] == ln["art"]:
            groups[-1][2] = ln["id"]
        else:
            groups.append([ln["art"], ln["id"], ln["id"]])

    shots = []
    for i, (key, first, last) in enumerate(groups):
        t_in = 0.0 if i == 0 else max(0.0, L(first) - 0.55)
        shots.append({"i": i, "key": key, "first": first, "last": last,
                      "x": X_STEP, "t_in": t_in, "t_out": None})
    # Each picture stays fully opaque until the moment the next one starts dissolving in over it;
    # only then does it fade. Because both sit in exactly the same place, that is a true cross-fade
    # and the frame is never anything but a picture.
    for a, b in zip(shots, shots[1:]):
        a["t_out"] = b["t_in"]
    shots[-1]["t_out"] = doc.duration + 1.0

    def shot_of(line):
        return next(s for s in shots if s["first"] <= line <= s["last"])

    # -- the gallery ------------------------------------------------------
    for s in shots:
        drift, pan = PLATES[s["key"]]
        film.add(Photo(s["key"], s["x"], 0, SPAN, s["t_in"], t_out=s["t_out"],
                       drift=drift, pan=(pan, pan * 0.4), seed=s["i"] * 31 + 7,
                       fade_in=0.05 if s["i"] == 0 else DISSOLVE))

    # -- camera: one parked key per picture, and a jump between them ------
    # Two keys at the same timestamp are an instant cut. The outgoing picture is still fully opaque
    # at that moment, so the cut is invisible; the new picture then dissolves up over it.
    # The camera does not travel: it holds the frame and lets each picture consume it. The only
    # motion is a slow push-in within the shot, which is the one move that reads as film rather
    # than as a slideshow.
    for s in shots:
        t0, t1 = s["t_in"], max(s["t_in"] + 0.25, s["t_out"] - 0.01)
        mid = t0 + (t1 - t0) * 0.5
        film.cam(t0, 0, 0, CAM_ZOOM)
        film.cam(mid, 0, 0, CAM_ZOOM * 1.008)
        film.cam(t1, 0, 0, CAM_ZOOM * 1.016)
    film.cam(doc.duration, 0, 0, CAM_ZOOM * 1.02)

    # -- opening title -----------------------------------------------------
    film.add(TitleCart("Peace, Be Still", "Mark 4  35—41", shots[0]["x"], -150, 300,
                       L(1) - 2.4, L(4) + 2.0))

    # -- a quiet section marker for each movement -------------------------
    for take in TAKES:
        ln = next(l for l in ls if l["take"] == take["take"])
        if ln["id"] <= 6:                       # the title already carries the opening
            continue
        s = shot_of(ln["id"])
        film.add(Chapter(take["title"], s["x"], CHAPTER_Y, CHAPTER_SIZE,
                         L(ln["id"]) - 0.5, min(L(ln["id"]) + 4.6, E(ln["id"]) + 1.6)))

    # -- scripture, typeset over the held picture -------------------------
    for lid, (ref, text) in sorted(VERSES.items()):
        s = shot_of(lid)
        film.add(Scripture(ref, text, s["x"], VERSE_Y, VERSE_SIZE,
                           L(lid) - 0.5, t_out=E(lid) + 3.8))

    # -- the four words, alone in the frame -------------------------------
    ws = shot_of(THE_WORDS_LINE)
    film.add(BigText("PEACE.   BE STILL.", ws["x"], -110, 210,
                     L(THE_WORDS_LINE) + 0.10, rgb=CREAM, shadow=True, grunge=False,
                     type_on=0.85, t_out=L(THE_WORDS_LINE) + 2.9))

    return film
