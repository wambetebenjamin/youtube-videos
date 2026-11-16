"""Peace, Be Still — Abba's Table, story episode 1 (Mark 4:35-41).

This is a *story*, so the world is laid out as a **crossing**: the shore they left at one end,
the open water in the middle, the far shore at the other end. The camera travels the whole way,
once, in the order the story happens. Nothing is explained before it is lived.

The only cards in the world are the verses and the four spoken words — everything else is
narration carried over the water.

Look: `paper` — the engine's warm light desk, for gentle stories.
"""
from engine import BigText, Card, Film, PenMark, Route

ACCENT = (176, 116, 74)      # warm terracotta; nothing alarming
INK = (58, 50, 44)
SOFT = (128, 116, 104)
COLD = (96, 104, 116)        # the only cool tone, used for the storm itself

# The crossing, laid out left to right. x is the position along the journey.
NEAR_SHORE_X = -9000
DEEP_WATER_X = 0
FAR_SHORE_X = 9000

# Verse cards, placed **in the order the story happens** so no two can collide:
# the x position is derived from the line id, not chosen by hand. Cards alternate
# above and below the crossing line so the route stays visible.
# (title, bodies, line id, rgb)
_VERSES_RAW = [
    ("MARK 4:35", ["Let's go over to the other side."],                     6,  ACCENT),
    ("MARK 4:37", ["The waves beat into the boat,",
                   "so much that the boat was already filled."],           16, COLD),
    ("MARK 4:38", ["He himself was in the stern,",
                   "asleep on the cushion."],                              25, ACCENT),
    ("DO YOU NOT CARE", ["Teacher, don't you care",
                         "that we are dying?"],                            31, COLD),
    ("MARK 4:39", ["Peace! Be still!"],                                    41, ACCENT),
    ("MARK 4:40", ["Why are you so afraid?",
                   "How is it that you have no faith?"],                   56, ACCENT),
    ("MARK 4:41", ["Who then is this, that even",
                   "the wind and the sea obey him?"],                      70, ACCENT),
    ("PSALM 4:8", ["In peace I will both lay myself",
                   "down and sleep."],                                    100, ACCENT),
]

CARD_W, CARD_H = 4400, 1900
# Cards alternate above and below the crossing line, so the nearest card in the SAME row is
# two indices away. STEP must therefore exceed half of (CARD_W + wanted gap):
#   2 * STEP > CARD_W  ->  STEP = 2400 leaves a 400-unit gap between same-row neighbours.
# 8 cards then run -8400 .. 8400: symmetric around the deep water, and the last card (Psalm 4:8)
# lands just inside the far shore, so the wide "whole crossing" shot frames every verse at once.
STEP = 2400
_X_FIRST = -3.5 * STEP


def _card_x(i):
    """Even spacing by card index, in story order. Guarantees no overlap."""
    return _X_FIRST + i * STEP


def _card_y(i):
    """Alternate above and below the crossing line."""
    return -3400 if i % 2 == 0 else 3400


VERSES = [(t, b, _card_x(i), _card_y(i), l, c)
          for i, (t, b, l, c) in enumerate(_VERSES_RAW)]

# The four words, held alone in the middle of the water.
THE_WORDS_LINE = 42
PRAYER_LINE = 93
CLOSE_LINE = 101


def build_film(doc):
    L, E, W = doc.L, doc.E, doc.W
    film = Film(doc.duration, fps=30, look="paper")

    # --- the title, small, at the near shore --------------------------------
    film.add(BigText("PEACE, BE STILL", NEAR_SHORE_X, -5200, 480,
                     L(1) - 0.1, rgb=INK, shadow=False, grunge=False, type_on=1.1))
    film.add(PenMark("underline", NEAR_SHORE_X, -4880, 4600, 46,
                     t_in=W(1, "long") - 0.1, dur=0.8, width=20, rgb=ACCENT))

    # --- the verse cards -----------------------------------------------------
    for title, bodies, x, y, line, rgb in VERSES:
        film.add(Card(x, y, CARD_W, CARD_H, L(line) + 0.05,
                      title=title, lines=bodies, accent=rgb,
                      title_size=225, body_size=128))

    # --- the four words, alone at the centre of the water --------------------
    film.add(BigText("PEACE.  BE STILL.", DEEP_WATER_X, 1550, 300,
                     L(THE_WORDS_LINE) - 0.2, rgb=INK, shadow=False, grunge=False, type_on=0.55))

    # --- the route: the crossing itself, drawn once, early -------------------
    film.add(Route((NEAR_SHORE_X, 0), (FAR_SHORE_X, 0),
                   t_in=L(8) - 0.4, dur=2.2, bend=0.10, width=16, rgb=SOFT))

    # --- camera: one journey, in the order it happened -----------------------
    # Frame maths: a 5000x2000 card fits 1920x1080 at zoom <= 0.34.
    film.shot(0.0, NEAR_SHORE_X, -5200, 0.235)              # the title at the near shore
    film.shot(E(1) + 0.8, NEAR_SHORE_X, -1600, 0.150)       # the shore they are leaving

    film.shot(L(6) + 0.5, VERSES[0][2], VERSES[0][3], 0.330)   # "let's go over"
    film.shot(L(10) + 0.4, -7200, 1200, 0.125)              # other boats, the crossing begins

    film.shot(L(16) + 0.5, VERSES[1][2], VERSES[1][3], 0.330)   # the storm card
    film.shot(L(32) + 0.4, -3000, 800, 0.150)               # deep water, the boat filling

    film.shot(L(25) + 0.5, VERSES[2][2], VERSES[2][3], 0.330)   # asleep on the cushion
    film.shot(L(31) + 0.5, VERSES[3][2], VERSES[3][3], 0.330)   # "don't you care"

    # the four words: hold, still and quiet, at the centre of everything
    film.shot(L(THE_WORDS_LINE) + 0.2, DEEP_WATER_X, 1500, 0.200)
    film.shot(E(THE_WORDS_LINE) + 0.6, DEEP_WATER_X, 1500, 0.180)

    film.shot(L(48) + 0.5, VERSES[4][2], VERSES[4][3], 0.330)   # Mark 4:39, and it stopped
    film.shot(L(56) + 0.5, VERSES[5][2], VERSES[5][3], 0.330)   # "why are you so afraid"

    film.shot(L(70) + 0.5, VERSES[6][2], VERSES[6][3], 0.330)   # "who then is this"

    # The question is left open, so the camera opens with it: back to the whole crossing,
    # both shores in frame, nothing explained. Then it settles at the far shore for the prayer.
    film.shot(L(76) + 0.3, 600, -300, 0.100)                    # the whole route, question hanging

    # The prayer is prayed over the whole crossing, not at one card: stay wide enough that every
    # verse of the story is still in frame, and drift very slowly toward the far shore.
    film.shot(L(PRAYER_LINE) + 0.1, 300, -400, 0.101)
    film.shot(L(99) + 2.0, 1500, 300, 0.118)

    film.shot(L(100) + 0.5, VERSES[7][2], VERSES[7][3], 0.330)  # Psalm 4:8
    # the last lines are said over the whole crossing — every verse of the story in one frame,
    # held still while it fades, so the film ends on the journey rather than on a card
    film.shot(L(101) + 0.5, 0, -200, 0.104, radius=22000, strength=0.07)
    return film
