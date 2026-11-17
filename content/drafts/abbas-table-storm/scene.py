"""Peace, Be Still — Abba's Table, story episode 1 (Mark 4:35-41).

This is a *story*, so the world is laid out as a **crossing**: the shore they left at one end,
the open water in the middle, the far shore at the other end. The camera travels the whole way,
once, in the order the story happens. Nothing is explained before it is lived.

The only cards in the world are the verses and the four spoken words — everything else is
narration carried over the water.

Look: `paper` — the engine's warm light desk, for gentle stories.
"""
from art import Picture
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

# Illustrations sit off the route, alternating above and below like the cards, so the crossing
# stays readable while the pictures are drawn. Only the illustration on screen is ever lit.
ART_W = 3600
ART_STEP = 3200
# (art, caption written under it, line the drawing starts on, hold seconds)
_ART_RAW = [
    # art, what it shows, drawn from line, drawn until line, seconds of drawing
    ("shore_at_evening",      "the crowd on the shore",           4,   6,   5),
    ("storm",                 "the waves into the boat",         18,  24,  16),
    ("asleep_on_the_cushion", "asleep on the cushion",           26,  29,  10),
    ("the_question",          "teacher, don't you care?",        32,  38,  13),
    ("peace_be_still",        "peace, be still",                 43,  47,   5),
    ("the_calm",              "and there was a great calm",      50,  55,  13),
    ("why_are_you_afraid",    "why are you so afraid?",          57,  69,  15),
    ("who_then_is_this",      "who then is this?",               72,  80,  16),
    ("prayer",                "let us pray",                     82,  99,  19),
    ("sleep_in_peace",        "in peace I will lay myself down", 102, 104,  4),
]
# Pictures run ALONG the same route as the story, not on a grid of their own: each one sits at
# the point in the crossing where its line is spoken, pushed out above or below the verse cards.
# That keeps every camera move short — card to picture is a small step out and back, never a long
# traverse across bare paper. (MATCH in VERSES uses the same map, so the two never collide.)
def _route_x(line, pad=0.0):
    """x along the crossing for narration line `line`, in the order the story happens."""
    return NEAR_SHORE_X + (FAR_SHORE_X - NEAR_SHORE_X) * (line / 104.0) + pad


ART = [(a, c, _route_x(f), -10500 if i % 2 == 0 else 10500, f, u, d)
       for i, (a, c, f, u, d) in enumerate(_ART_RAW)]

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

_CARD_ZOOM, _ART_ZOOM = 0.330, 0.500


def build_film(doc):
    L, E, W = doc.L, doc.E, doc.W
    film = Film(doc.duration, fps=30, look="paper")

    # --- the title, small, at the near shore --------------------------------
    film.add(BigText("PEACE, BE STILL", NEAR_SHORE_X, -4600, 480,
                     L(1) - 0.1, rgb=INK, shadow=False, grunge=False, type_on=1.1, t_out=9.4))
    film.add(PenMark("underline", NEAR_SHORE_X, -4280, 4600, 46,
                     t_in=W(1, "long") - 0.1, dur=0.8, width=20, rgb=ACCENT, t_out=9.4))

    # --- the illustrations, drawn in as the story is told --------------------
    for art, caption, ax, ay, first, last, hold in ART:
        # no caption on the page: at this framing the margin is cropped, and the narration is
        # already saying the words — a second copy on screen would only compete with it
        film.add(Picture(art, ax, ay, ART_W, L(first) + 0.4, dur=hold, seed=hash(art) % 997))

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
    # Beats are listed once, in story order, and the keys are generated from that list, so the
    # camera can never be looking somewhere else while a picture is still being drawn under the
    # voice. A picture is reached 1.2 s before its pen starts and held until its pen stops.
    beats = []
    for art, _cap, ax, ay, first, last, hold in ART:
        t_in = L(first) + 0.4
        beats.append((t_in - 1.2, ax, ay, _ART_ZOOM, f"{art} begins"))
        beats.append((t_in + hold + 0.5, ax, ay, _ART_ZOOM + 0.045, f"{art} finishes"))
    for title, _bodies, cx, cy, line, _rgb in VERSES:
        beats.append((L(line) + 0.45, cx, cy, _CARD_ZOOM, title))
    # the four words, alone in the middle of the water
    beats.append((L(THE_WORDS_LINE) + 0.2, DEEP_WATER_X, 1500, 0.200, "the words"))
    beats.append((E(THE_WORDS_LINE) + 0.6, DEEP_WATER_X, 1500, 0.180, "the words, held"))

    title_start = [(0.0, NEAR_SHORE_X, -4600, 0.235, "title"),
                   (E(1) + 0.8, NEAR_SHORE_X, -1600, 0.150, "the shore they leave")]
    wide = [(L(76) + 0.3, 600, -300, 0.100, "the whole crossing")]
    # The last lines are Psalm 4:8 and a blessing to sleep, so the film ends on the bed and the lamp:
    # a slow push in on the last illustration, held until the fade. Ending on the whole crossing
    # pulled the other nine pictures into the corners of the frame and read as clutter.
    ending = [(L(103) - 0.2, ART[9][2], ART[9][3], 0.515, "the lamp, and sleep"),
              (E(104) + 0.6, ART[9][2], ART[9][3], 0.552, "held to the fade")]

    # The prayer runs nearly a minute and a half. Hold the picture while it is drawn and finished,
    # then EASE BACK from it rather than cutting: the camera centre closes on the centre of the
    # frame, so the page is never left hanging off one side on the way to the last verse.
    prayer_hold = [(L(82) + 0.4 + 19 + 0.6, ART[8][2], ART[8][3], 0.470, "the prayer, finished"),
                   (L(99) - 0.6, ART[8][2], ART[8][3], 0.545, "the prayer, closed")]

    keys = title_start + sorted(beats, key=lambda b: b[0]) + prayer_hold + wide + ending
    keys.sort(key=lambda b: b[0])          # the wide shots interleave by time

    # A beat that lands inside a picture's hold would cut the drawing in half — drop it. The
    # words on the card still carry the moment; the camera has to stay with the pen.
    holds = [(L(f) + 0.4 - 1.2, L(f) + 0.4 + d + 0.3) for _a, _c, _x, _y, f, _u, d in ART]
    keys = [k for k in keys
            if k[4] in ("title", "the shore they leave", "the four words", "the four words, held")
            or not any(a + 0.2 < k[0] < b - 0.2 for a, b in holds)
            or k[3] >= 0.45]                    # keep the picture's own two keys

    # The camera had long, slow traverses between beats, and a slow traverse across a paper world
    # is just blank paper for twenty seconds. Instead: STAY on the beat that is already on screen
    # (a card or a finished picture, both of which remain visible), then move to the next beat
    # quickly, in about half a second. A fast move reads as a cut; a slow one reads as a mistake.
    travelled = [keys[0]]
    for prev, nxt in zip(keys, keys[1:]):
        if nxt[0] - prev[0] > 1.6:
            travelled.append((nxt[0] - 0.55, prev[1], prev[2], prev[3], "holding"))
        travelled.append(nxt)
    for t, bx, by, bz, _why in travelled:
        film.shot(t, bx, by, bz)
    return film
