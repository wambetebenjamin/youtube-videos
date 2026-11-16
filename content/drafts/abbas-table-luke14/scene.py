"""There Was Room For You — Abba's Table, episode 1.

One camera over one world: the table sits at the centre of the light; the verses and the small
quiet cards are placed around it like place settings, and the camera moves between them on the
word that names them.

Look: `paper` — the engine's light desk, meant for gentle teaching stories. Warm, low contrast,
slow moves. Nothing snaps; everything settles.

Timings come from the narration (doc.L line start, doc.W spoken word), never fixed seconds, so a
new voice re-times the whole piece by itself.
"""
from engine import BigText, Card, Film, PenMark, Route

ACCENT = (176, 116, 74)      # warm terracotta, not red — nothing alarming in this piece
INK = (58, 50, 44)
SOFT = (128, 116, 104)

# The three verse cards and the two "still room" moments, placed around the table.
# (title, body lines, x, y, line id that opens it)
CARDS = [
    ("PSALM 100:4",
     ["Enter into his gates with thanksgiving,",
      "into his courts with praise."], -6200, -3400, 2),
    ("LUKE 14:10",
     ["Friend, move up higher."],                     -6600,  2600, 13),
    ("AND THERE IS STILL ROOM",
     ["The servant: Lord, it is done,",
      "and there is still room."],                      0,  4200, 33),
    ("JAMES 4:8",
     ["Draw near to God,",
      "and he will draw near to you."],                6400,  2400, 41),
    ("JOHN 1:12",
     ["To as many as received him,",
      "the right to become God's children."],          6600, -3200, 46),
]

# the prayer is one long quiet passage: the camera simply holds on the table
PRAYER_LINE = 60
CLOSE_LINE = 72


def build_film(doc):
    L, E, W = doc.L, doc.E, doc.W
    film = Film(doc.duration, fps=30, look="paper")

    # --- the title, small and warm, above the table ---------------------------
    film.add(BigText("THERE WAS ROOM FOR YOU", 0, -5200, 470,
                     L(1) - 0.1, rgb=INK, shadow=False, grunge=False, type_on=1.1))
    film.add(PenMark("underline", 0, -4880, 4600, 46,
                     t_in=W(1, "crawling") - 0.1, dur=0.8, width=20, rgb=ACCENT))

    # --- the verse cards -------------------------------------------------------
    for title, bodies, x, y, line in CARDS:
        film.add(Card(x, y, 5000, 2000, L(line) + 0.05,
                      title=title, lines=bodies, accent=ACCENT,
                      title_size=225, body_size=128))

    # threads from the table out to each verse: the verses belong to the table
    for _t, _b, x, y, line in CARDS:
        film.add(Route((0, 1200), (x, y - 1000),
                       t_in=L(line) - 0.3, dur=1.1, bend=0.18, width=14, rgb=SOFT))

    # --- camera: slow, always settling ---------------------------------------
    # Frame maths: a 5000x2000 card fits a 1920x1080 frame at zoom <= 0.34.
    film.shot(0.0, 0, -5200, 0.225)                     # the title alone
    film.shot(E(1) + 0.6, 0, -3600, 0.120)              # drift back, table in view

    film.shot(L(2) + 0.5, -6200, -3400, 0.300)          # Psalm 100:4
    film.shot(L(7) + 0.4, -1200, -2200, 0.135)          # the doorway line, wide
    film.shot(L(13) + 0.5, -6600, 2600, 0.300)          # Luke 14:10, the Host lifting
    film.shot(L(21) + 0.4, 0, 400, 0.100)               # the whole table
    film.shot(L(33) + 0.5, 0, 4200, 0.300)              # "there is still room"
    film.shot(L(41) + 0.5, 6400, 2400, 0.300)           # James 4:8
    film.shot(L(46) + 0.5, 6600, -3200, 0.300)          # John 1:12
    film.shot(L(54) + 0.4, 0, 400, 0.100)               # communion: the table itself

    # the prayer: one long, still hold — no cuts while they are praying
    film.shot(L(PRAYER_LINE) + 0.8, 0, 300, 0.105)
    film.shot(film.duration - 2.0, 0, -600, 0.230)      # slow lift for the close
    film.shot(film.duration, 0, -900, 0.205, radius=22000, strength=0.06)
    return film
