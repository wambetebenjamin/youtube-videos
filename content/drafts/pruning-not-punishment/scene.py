"""Pruning Is Not Punishment — one camera over one world.

Layout: the thesis card sits at the centre; the five marks are cards fanned out around it,
each one lit as its voiceover line begins. The camera opens on the title, drifts to each mark
on the word that names it, and pulls back on the closing promise.

World units are 4K pixels at zoom 1. Timings come from document lines (doc.L) and spoken
words (doc.W), never from fixed seconds, so a new voice re-times the whole film.
"""
from engine import BigText, Card, Film, PenMark, Route

ACCENT = (198, 92, 46)
INK = (34, 32, 30)
MUTED = (120, 114, 108)

# Five marks, laid out as a slow arc so the camera has somewhere to travel.
# (title, body line ids, x, y)
MARKS = [
    ("WHAT LEAVES IS GREEN",  ["Punishment targets what is already dead.",
                               "Pruning targets what is alive and healthy."], -7200, -1900),
    ("IT IS QUIET",           ["Punishment is loud.",
                               "Pruning is quiet. Nothing is explained."],      -3600,   900),
    ("REDUCED, NOT CORRECTED", ["A gardener does not take off branches to punish the tree.",
                                "The tree ends up smaller and stronger."],        0,  2600),
    ("THE OLD TOOLS GO BLUNT", ["The methods that used to work stop working.",
                                "His competence had become his confidence."],   3600,   900),
    ("FRUIT YOU DID NOT PLANT", ["After pruning, you find growth you never sowed.",
                                 "A root you did not know you had."],           7200, -1900),
]

# line ids that open each mark, read off beats.md (sign one..five)
MARK_LINE = [31, 45, 60, 76, 92]
THESIS_LINE = 20      # "But scripture gives us a completely different picture"
TRAP_LINE = 11
TURN_LINE = 107       # "So what do you actually do, this week"
CLOSE_LINE = 125      # "Isaiah gives us the promise"


def build_film(doc):
    L, E, W = doc.L, doc.E, doc.W
    film = Film(doc.duration, fps=30, look="studio")

    # --- the thesis card, the centre of the world ------------------------------
    film.add(BigText("PRUNING IS NOT PUNISHMENT", 0, -7400, 520,
                     L(1) - 0.1, rgb=INK, shadow=False, grunge=False, type_on=0.9))
    film.add(PenMark("underline", 0, -7080, 4800, 48,
                     t_in=W(1, "dying") - 0.2, dur=0.6, width=22, rgb=ACCENT))

    # the thesis lands in the middle of the arc when the argument turns
    film.add(Card(0, -5600, 7400, 2600, L(THESIS_LINE) + 0.05,
                  title="PRUNES WHERE HE INTENDS TO PRODUCE",
                  lines=["It is not a courtroom.", "It is a vineyard."],
                  accent=ACCENT, title_size=250, body_size=140))

    # --- the five marks --------------------------------------------------------
    for (title, bodies, x, y), first_line in zip(MARKS, MARK_LINE):
        film.add(Card(x, y, 5600, 2200, L(first_line) + 0.05,
                      title=title, lines=bodies, accent=ACCENT,
                      title_size=250, body_size=132))

    # connecting routes: the arc, drawn just after each card lands
    for (a_title, _, ax, ay), (b_title, _, bx, by), line in zip(
            MARKS, MARKS[1:], [l + 1 for l in MARK_LINE[:-1]]):
        film.add(Route((ax + 2800, ay), (bx - 2800, by),
                       t_in=L(line) - 0.2, dur=0.6, bend=0.25, width=20, rgb=MUTED))

    # --- camera: title, then each mark on its own line, then the close ---------
    # Frame maths: a 5600x2200 card needs zoom <= 0.30 to fit within 1920x1080,
    # so every card shot stays at or below that and centres on the card.
    film.shot(0.0, 0, -7400, 0.235)                       # title, comfortably in frame
    film.shot(E(1) + 0.2, 0, -6200, 0.128)              # pull back: title above the empty arc

    # the trap: drift while the argument sets up (no card yet - world is empty)
    film.shot(L(TRAP_LINE) + 0.3, -2400, -6200, 0.112)
    # the thesis card, centre of the world
    film.shot(L(THESIS_LINE) + 0.5, 0, -5600, 0.285)
    film.shot(E(THESIS_LINE) + 0.4, 0, -3000, 0.125)

    # each mark: arrive just after its line starts, hold it fully in frame
    for (title, bodies, x, y), first_line in zip(MARKS, MARK_LINE):
        film.shot(L(first_line) + 0.45, x, y, 0.285)
        film.shot(E(first_line) + 0.10, x, y + 60, 0.275)

    # the turn: pull wide so all five marks and the thesis are visible at once
    film.shot(L(TURN_LINE) + 0.6, 0, 300, 0.105)
    film.shot(L(CLOSE_LINE) + 0.3, 0, -900, 0.135)
    film.shot(film.duration, 0, -400, 0.125, radius=24000, strength=0.08)

    return film
