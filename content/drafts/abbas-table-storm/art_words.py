"""Illustrations that are drawn in while the narration runs.

Each `Picture` is a sheet of paper carrying one illustration. At its reveal time a wash of ink
spreads down the sheet, and a pen sits at the moving edge, so the picture is visibly *being made*
under the voice rather than simply appearing. The camera lingers while it happens.

`prepare_art()` crops the tall generated plates to a 5:4 sketchbook page and writes them to
assets/prep/art/ as JPEGs, which is where Res.image() looks.
"""
import math
import pathlib

import numpy as np
import skia
from PIL import Image

from engine import Item, draw_text, paint, ramp, ease_in_out

ART_ASPECT = 5 / 4          # width / height of the page


def prepare_art(src_dir, prep_dir, quality=92):
    """Crop each plate to the sketchbook page aspect and drop it into the render's asset cache.

    The generated plates are portrait with a lot of empty sky; a 16:9 film can only show a page
    this shape at a readable size, so keep the middle band where the drawing actually is."""
    src_dir, out = pathlib.Path(src_dir), pathlib.Path(prep_dir) / "art"
    out.mkdir(parents=True, exist_ok=True)
    written = []
    for p in sorted(src_dir.glob("*.jpg")) + sorted(src_dir.glob("*.png")):
        im = Image.open(p).convert("RGB")
        w, h = im.size
        want_h = int(round(w / ART_ASPECT))
        if want_h <= h:
            # The plates are tall with a lot of bare sky. Find where the ink actually is and
            # centre the page on it, rather than guessing at a fixed offset from the top.
            g = np.asarray(im.convert("L").resize((w // 4, h // 4)), np.float32)
            ink = np.clip((196 - g) / 96, 0, 1).sum(axis=1)
            rows = np.arange(len(ink))
            cy = float((ink * rows).sum() / max(ink.sum(), 1e-6)) * 4
            top = int(min(max(cy - want_h / 2, 0), h - want_h))
            im = im.crop((0, top, w, top + want_h))
        else:
            want_w = int(round(h * ART_ASPECT))
            left = (w - want_w) // 2
            im = im.crop((left, 0, left + want_w, h))
        dst = out / (p.stem + ".jpg")
        im.save(dst, quality=quality, optimize=True)
        written.append(dst)
    return written


class Picture(Item):
    """A drawn illustration on a paper page, revealed as if the ink were still going down."""

    z = 18

    def __init__(self, key, x, y, w, t_in, dur=16.0, t_out=None, rot=0.0, seed=3,
                 caption=None, pencil=True, sfx=True, z=None):
        super().__init__(t_in, t_out, z, sfx)
        self.key, self.x, self.y, self.w = key, x, y, w
        self.h = w / ART_ASPECT
        self.dur = dur
        self.rot = rot
        self.caption = caption
        self.pencil = pencil
        rng = np.random.default_rng(seed)
        # the ragged leading edge of the wash, baked so every worker draws it identically
        n = 26
        self.edge = [rng.uniform(0.55, 1.45) for _ in range(n)]
        self.edges = np.linspace(-0.5, 0.5, n)

    # -- Item protocol -----------------------------------------------------
    def bounds(self, res):
        r = max(self.w, self.h) * 0.8
        return skia.Rect.MakeLTRB(self.x - r, self.y - r, self.x + r, self.y + r)

    def fade(self, t):
        return 1.0 if self.t_out is None else 1 - ramp(t, self.t_out, 0.6)

    def cues(self):
        out = [("slide", self.t_in, 0.65, {})]
        if self.pencil:
            out.append(("pencil", self.t_in, 0.28, {"dur": round(min(9.0, self.dur * 0.9), 2)}))
            out.append(("pencil", self.t_in + self.dur * 0.5, 0.24, {"dur": round(min(9.0, self.dur * 0.5), 2)}))
        return out

    def shakes(self):
        return []

    @property
    def t_end(self):
        return self.t_in + self.dur

    # -- drawing -----------------------------------------------------------
    def draw(self, c, res, t):
        a = self.fade(t)
        if a <= 0:
            return
        img = res.image(f"art/{self.key}.jpg", max_side=int(self.w))
        W, H = self.w, self.h

        c.save()
        c.translate(self.x, self.y)
        c.rotate(self.rot)

        # the page: shadow, paper, hairline edge
        c.save(); c.translate(0, 18)
        c.drawRect(skia.Rect.MakeXYWH(-W / 2, -H / 2, W, H), paint((0, 0, 0), 0.18 * a, blur=30))
        c.restore()
        c.drawRect(skia.Rect.MakeXYWH(-W / 2, -H / 2, W, H), paint((250, 247, 240), a))

        u = ease_in_out(ramp(t, self.t_in, self.dur))
        c.save()
        c.clipRect(skia.Rect.MakeXYWH(-W / 2, -H / 2, W, H))
        if u >= 1:
            c.drawImageRect(img, skia.Rect.MakeXYWH(-W / 2, -H / 2, W, H),
                            skia.SamplingOptions(skia.FilterMode.kLinear), paint((255, 255, 255), a))
        elif u > 0:
            # clip to everything above a ragged, slowly descending line
            y = -H / 2 + H * u
            p = skia.Path()
            p.moveTo(-W / 2 - 2, -H / 2 - 2)
            for j, ex in enumerate(self.edges):
                p.lineTo(ex * W + W / 2, y + (self.edge[j] - 1.0) * H * 0.05)
            p.lineTo(W / 2 + 2, -H / 2 - 2)
            p.close()
            c.save()
            c.clipPath(p, skia.ClipOp.kIntersect, True)
            c.drawImageRect(img, skia.Rect.MakeXYWH(-W / 2, -H / 2, W, H),
                            skia.SamplingOptions(skia.FilterMode.kLinear), paint((255, 255, 255), a))
            c.restore()
            if self.pencil:
                _pen(c, (math.sin(t * 2.1) * W * 0.34, y), a)
        c.restore()

        # caption, written on by hand after the wash has passed
        if self.caption:
            ca = a * ramp(t, self.t_end - 0.4, 0.7)
            if ca > 0:
                draw_text(c, res, self.caption, 0, H / 2 + 190, 100, "hand", (92, 82, 72), ca, 0.0, "center")
        c.restore()


def _pen(c, tip, a):
    """A fine pen seen from above, its nib exactly on the edge of the wash."""
    c.save()
    c.translate(*tip)
    c.rotate(28)
    L, Wd = 190.0, 22.0
    c.drawPath(_wedge(0, 0, 26, Wd * 0.28), paint((78, 72, 66), 0.95 * a))     # nib
    c.drawPath(_wedge(22, 0, 34, Wd * 0.52), paint((214, 198, 176), 0.95 * a))  # collar
    c.drawRect(skia.Rect.MakeXYWH(54, -Wd / 2, L - 54, Wd), paint((74, 68, 62), 0.95 * a))
    c.drawRect(skia.Rect.MakeXYWH(54, -Wd / 2, L - 54, Wd * 0.3), paint((92, 86, 80), 0.9 * a))
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect.MakeXYWH(L, -Wd / 2, 16, Wd), 6, 6),
                paint((186, 162, 92), 0.95 * a))
    c.restore()


def _wedge(tip_x, tip_y, length, half):
    p = skia.Path()
    p.moveTo(tip_x, tip_y)
    p.lineTo(tip_x + length, tip_y - half)
    p.lineTo(tip_x + length, tip_y + half)
    p.close()
    return p


# Where each illustration belongs on the route. Keys are the art file stems.
PICTURES = [
    # (art, caption written under it)
    ("shore_at_evening", "the crowd left standing on the shore"),
    ("the_other_boats", "other small boats were with him"),
    ("storm", "the waves beat into the boat"),
    ("asleep_on_the_cushion", "asleep on the cushion"),
    ("the_question", "teacher, don't you care?"),
    ("peace_be_still", "peace. be still."),
    ("the_calm", "and there was a great calm"),
    ("why_are_you_afraid", "why are you so afraid?"),
    ("who_then_is_this", "who then is this?"),
    ("prayer", "let us pray"),
    ("sleep_in_peace", "in peace i will lay myself down"),
]
