"""What the reference-style cut is made of: six chapters, twelve verses, and which picture goes where.

The reference video's shape, measured from its transcript and carried over here:

* a **cold open** that names the viewer's week before it quotes anything,
* **six numbered signs**, each with the same five-part block (state it, name the symptom, the
  misreading, the scripture, the reframe),
* a **turn** from diagnosis to action,
* a **close** with a call to action,
* and a music cue marked at every section boundary -- the transcript has `[music]` at all of them.

This file is the map only: the words are the existing narration (nothing is rewritten), and the
pictures are the twenty-four plates already in the repository.
"""
import pathlib
import sys

HERE = pathlib.Path(__file__).resolve().parent

# ------------------------------------------------------------------ the six signs
# `lines` is the range of narration lines (script.json ids) the sign covers. `art` is the plate that
# carries it. `reframe` is the one sentence the sign exists to deliver, drawn from the narration.
SIGNS = [
    dict(n=1, title="The holy dissatisfaction", sub="When what used to satisfy you goes quiet",
         lines=(9, 24), art="09_asleep_on_cushion",
         reframe="The environment is the same. The appetite is not."),
    dict(n=2, title="The water coming in", sub="When the familiar stops holding you",
         lines=(25, 33), art="07_waves_into_boat",
         reframe="It is not the sea telling you it is over. It is the sea telling you it is not enough."),
    dict(n=3, title="The question underneath", sub="\u201cTeacher, don't you care?\u201d",
         lines=(34, 44), art="10_they_wake_him",
         reframe="Underneath the accusation there is something older and harder than the storm."),
    dict(n=4, title="The four words", sub="When the noise stops mid-sentence",
         lines=(45, 58), art="12_peace_be_still",
         reframe="The waves did not subside. They stopped."),
    dict(n=5, title="The question after the calm", sub="\u201cWhy are you so afraid?\u201d",
         lines=(59, 73), art="14_why_are_you_afraid",
         reframe="He does not interrogate them in the wind."),
    dict(n=6, title="Who then is this", sub="The fear that replaces the fear",
         lines=(74, 87), art="17_who_then_is_this",
         reframe="They went out afraid of the storm. They came back afraid of Him."),
]

PROLOGUE_LINES = (1, 8)
TURN_LINES = (88, 104)          # the prayer is the turn: diagnosis becomes response
CLOSE_LINES = (105, 109)

# ------------------------------------------------------------------ the verses
# Every verse the film typesets. `at` is the narration line whose moment it is quoted or answered.
# WEB, public domain -- wording checked against verses.md.
VERSES = [
    dict(at=12,  ref="Mark 4:35",  text="Let us go over to the other side.", hold=9.0),
    dict(at=22,  ref="Mark 4:37",  text="The waves beat into the boat, so much that the boat was already filled.", hold=8.5),
    dict(at=30,  ref="Mark 4:38",  text="He himself was in the stern, asleep on the cushion.", hold=8.0),
    dict(at=38,  ref="Mark 4:38",  text="Teacher, don't you care that we are dying?", hold=8.0),
    dict(at=47,  ref="Mark 4:39",  text="Peace! Be still!", hold=8.5),
    dict(at=51,  ref="Mark 4:39",  text="There was a great calm.", hold=9.0),
    dict(at=60,  ref="Mark 4:40",  text="Why are you so afraid? How is it that you have no faith?", hold=8.5),
    dict(at=74,  ref="Mark 4:41",  text="Who then is this, that even the wind and the sea obey him?", hold=8.5),
    dict(at=104, ref="Psalm 4:8",  text="In peace I will both lay myself down and sleep.", hold=8.0),
]

# A-roll: the plate that carries each stretch of narration, when it is not a sign's own picture.
# Anything not listed here keeps the previous plate and the camera never cuts for the sake of it.
PLATE_BY_LINE = {
    1: "01_shore_dusk", 3: "02_teaching_from_boat", 6: "03_seed_and_soil", 9: "04_let_us_go_over",
    14: "05_other_boats", 18: "06_storm_rising", 22: "07_waves_into_boat", 25: "08_boat_filling",
    30: "09_asleep_on_cushion", 34: "10_they_wake_him", 38: "11_do_you_not_care",
    45: "12_peace_be_still", 51: "13_the_calm", 59: "14_why_are_you_afraid", 65: "15_fear_in_boat",
    71: "16_he_cares", 74: "17_who_then_is_this", 80: "18_open_question", 86: "20_prayer",
    88: "21_prayer_hands", 100: "22_peace_lake", 105: "23_sleep_in_peace", 108: "24_lamp_window",
}

# B-roll: short cutaways laid over the A-roll, each starting on the word it illustrates -- never a
# sentence late. (line, picture, seconds)
#
# The picture at each cut has to be a DIFFERENT picture from the plate underneath it, or the cutaway
# is invisible: the frame dissolves from a photo into the same photo and nothing appears to happen.
# The first version of this list named the same art as the plate almost everywhere, which is why the
# film read as static from 20 s to 300 s. Every entry now cuts to a neighbouring beat of the story.
BROLL = [
    (3,   "01_shore_dusk", 5.0),        # the crowd on the shore, under the plates on the water
    (6,   "02_teaching_from_boat", 5.0),  # a farmer sows, under the picture of hearing it
    (16,  "15_fear_in_boat", 6.0),       # the crew's faces in the last of the light
    (13,  "05_other_boats", 4.5),        # the lamps going out on the lake, before the wind
    (21,  "08_boat_filling", 5.0),      # "the mast leaned"
    (28,  "07_waves_into_boat", 5.5),    # the water over their ankles, seen from above
    (36,  "09_asleep_on_cushion", 4.5),  # they are shaking a sleeping man awake
    (41,  "10_they_wake_him", 5.0),      # "don't you care" -- said to His face
    (49,  "13_the_calm", 4.5),           # "the words in the oldest copies are not calm words"
    (54,  "12_peace_be_still", 6.0),     # back to the moment it happened
    (55,  "11_do_you_not_care", 5.0),    # the words themselves, on the men who heard them
    (63,  "15_fear_in_boat", 5.5),       # "why are you so afraid" -- their faces
    (67,  "14_why_are_you_afraid", 5.0),
    (77,  "18_open_question", 5.0),      # the question nobody answers
    (80,  "02_teaching_from_boat", 5.0),  # "the cushion" -- the boat He taught from, by day
    (84,  "16_he_cares", 5.0),           # "there is a man in your boat"
    (86,  "19_after", 4.5),              # the prayer begins, over the after-silence
    (71,  "18_open_question", 5.0),      # "He cares" -- the open water behind them
    (91,  "23_sleep_in_peace", 5.0),     # the prayer, over the bed He slept in
    (96,  "20_prayer", 5.0),             # the hands, from the shore side
    (99,  "22_peace_lake", 5.0),         # "You are not far off from it"
    (102, "24_lamp_window", 4.5),        # the last image, arriving early
]

# Chapter title cards: (line the sign starts on, title, kicker)
CARDS = [(s["lines"][0], s["title"], f"SIGN {s['n']}") for s in SIGNS]

TITLE = "PEACE, BE STILL"
SUBTITLE = "The story of the storm \u00b7 Mark 4:35\u201341"
CHANNEL = "ABBA'S TABLE"


def check(ls):
    """Fail loudly if this map stops matching the narration. Called from build_film."""
    ids = [l["id"] for l in ls]
    missing = [n for n, _ in PLATE_BY_LINE.items() if n not in ids]
    missing += [b[0] for b in BROLL if b[0] not in ids]
    missing += [v["at"] for v in VERSES if v["at"] not in ids]
    if missing:
        raise SystemExit(f"content_map: line ids not in the narration: {sorted(set(missing))}")
    for s in SIGNS:
        a, b = s["lines"]
        if b < a or b > ids[-1]:
            raise SystemExit(f"content_map: sign {s['n']} has a bad line range {s['lines']}")
    return True
