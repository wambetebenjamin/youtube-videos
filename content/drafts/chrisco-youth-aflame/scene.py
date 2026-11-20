"""The poster film: one still, five camera moves, and text that lands on the word.

The brief asks for five AI-generated clips and a lip-sync pass. That is not possible here, so this
does the honest version of the same job: the poster is treated as a plate and shot like a camera
would shoot a banner — a slow push that settles, a drift that follows the speaker's gesture, a small
handheld shake on the accent beats. Nothing in the frame pretends to move; what moves is the camera,
the grain, and the type.

Deliberately NOT done: cross-dissolving between the five scenes. A poster is one continuous image,
and a dissolve between two crops of the same picture reads as a rendering fault — the frame would
appear to swim. Each scene holds, and the cut from one framing to the next IS the transition, which
is exactly how a real camera operator would cover a static subject.
"""
import pathlib
import sys

HERE = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent.parent.parent / "tools" / "cinematic-skill"
                       / "skills" / "cinematic-film" / "scripts"))
sys.path.insert(0, str(HERE))

import numpy as np
import skia

from engine import Film, Item, draw_text, paint, ramp, ease_in_out
import script as S


POSTER = HERE / "art2" / "poster.png"
# 3840 px is the engine's unit width at zoom 1, so at 1080p this fills the frame exactly
_CAM_ZOOM = 3840.0 / 1920.0
YELLOW = (247, 208, 61)          # the poster's own yellow, so the type belongs to it
WHITE = (255, 255, 255)
INK = (17, 20, 26)
NAVY = (15, 23, 41)         # the poster's own date-bar navy


class Plate(Item):
    """The poster, framed by the camera.

    `cam` is (scale_from, scale_to, x_from, x_to, y_from, y_to) where x/y are the point in the
    picture held at frame centre, as a percentage. The image is drawn slightly oversized so that a
    move toward an edge never reveals the picture's boundary.
    """

    z = 0

    def __init__(self, scene, t_in, t_out, img_w, img_h):
        super().__init__(t_in, t_out, z=None, sfx=False)
        self.sc, self.t_in, self.t_out = scene, t_in, t_out
        self.img_w, self.img_h = img_w, img_h
        self.anchor = 0.375         # poster's vertical centre sits ~37% down the frame
        self._img = None

    def bounds(self, res):
        return skia.Rect.MakeLTRB(-9000, -8000, 9000, 8000)

    def draw(self, c, res, t):
        if self._img is None:
            from PIL import Image
            im = Image.open(POSTER).convert("RGBA")
            self._img = skia.Image.fromarray(np.ascontiguousarray(np.asarray(im)),
                                             colorType=skia.ColorType.kRGBA_8888_ColorType)
        u = ease_in_out(ramp(t, self.t_in, max(0.001, self.t_out - self.t_in)))
        s0, s1, x0, x1, y0, y1 = self.sc["cam"]
        scale = s0 + (s1 - s0) * u

        # The engine draws in world units; `res.view` is the visible world rect, padded by a quarter
        # for culling, so divide that padding back out.
        vis_w = res.view.width() / 1.25
        vis_h = res.view.height() / 1.25
        src = skia.Rect.MakeLTRB(0, 0, float(self.img_w), float(self.img_h))
        samp = skia.SamplingOptions(skia.FilterMode.kLinear, skia.MipmapMode.kLinear)

        # Not a blurred copy of the poster: a blurred duplicate repeated the car and the number
        # plate below the frame and read as a rendering fault. The frame is backed with the same
        # navy as the date bar, so every margin reads as part of one designed panel.
        c.drawRect(skia.Rect.MakeXYWH(-vis_w / 2, -vis_h / 2, vis_w, vis_h),
                   paint(NAVY, 1.0))

        # the poster itself, fitted to the frame's width, with the camera move applied
        fit = vis_w / self.img_w * scale
        draw_w, draw_h = self.img_w * fit, self.img_h * fit
        px = (x0 + (x1 - x0) * u) / 100.0
        py = (y0 + (y1 - y0) * u) / 100.0
        # hold the poster in the upper part of the frame, leaving the lower third for type
        anchor_y = -vis_h / 2 + vis_h * self.anchor
        left = -px * draw_w
        top = anchor_y - py * draw_h
        # never let a navy strip open above the poster: the header must sit on the frame edge, and
        # the camera's vertical move is free to push the poster DOWN, not to lift it off the top.
        top = min(top, -vis_h / 2)
        c.drawImageRect(self._img, src,
                        skia.Rect.MakeXYWH(left, top, draw_w, draw_h), samp,
                        paint((255, 255, 255), 1.0))

        # The lower third is a navy panel that starts exactly at the poster's bottom edge, so it can
        # never leave a white gap as the camera pushes in and the poster grows. It picks up the
        # poster's own dark date bar, and the hairline picks up its yellow.
        bottom = top + draw_h
        c.drawRect(skia.Rect.MakeLTRB(-vis_w / 2, bottom, vis_w / 2, vis_h / 2),
                   paint(NAVY, 1.0))
        c.drawRect(skia.Rect.MakeLTRB(-vis_w / 2, bottom, vis_w / 2, bottom + vis_h * 0.006),
                   paint(YELLOW, 1.0))


class Caption(Item):
    """The line the scene is about, landing on the word rather than fading in politely.

    Placed above the speaker's head in the poster's sky, in the poster's own yellow: it reads as part
    of the banner rather than as a video subtitle.
    """

    z = 50                       # above the Plate's navy panel, whichever order they are added

    def __init__(self, text, t_in, t_out, y=0.375, size=0.056, kicker=""):
        super().__init__(t_in, t_out, z=None, sfx=False)
        self.text, self.size, self.kicker = text, size, kicker
        self.y = y                   # offset from frame CENTRE, in units of visible height

    def bounds(self, res):
        return skia.Rect.MakeLTRB(-9000, -8000, 9000, 8000)

    def draw(self, c, res, t):
        # a short, hard arrival: four frames in, then hold. A long fade would read as a slide.
        a = ramp(t, self.t_in, 0.13) * self.fade(t)
        if a <= 0:
            return
        vis_h = res.view.height() / 1.25
        vis_w = res.view.width() / 1.25
        track = 0.045                      # em fraction -- engine.draw_text multiplies by size

        # Fit the line to the frame instead of trusting a fixed size: a caption that overflows the
        # edge is worse than one that is slightly small, and the strings differ in length.
        target = vis_w * 0.84
        size = vis_h * self.size
        for _ in range(40):
            f = res.font("label", size)
            w = f.measureText(self.text) + track * size * max(0, len(self.text) - 1)
            if w <= target or size < vis_h * 0.012:
                break
            size *= 0.92
        total = w
        x = -total / 2
        ty = vis_h * self.y - (1 - ease_in_out(ramp(t, self.t_in, 0.22))) * vis_h * 0.018
        draw_text(c, res, self.text, x, ty, size, "label", (255, 255, 255), a, track, "left")

        # A small yellow kicker above the headline, in the poster's own yellow: it is what makes the
        # lower third read as a designed panel rather than one lonely line of type.
        if self.kicker:
            ks = vis_h * 0.0145
            kw = res.font("label", ks).measureText(self.kicker) + 0.16 * ks * (len(self.kicker) - 1)
            draw_text(c, res, self.kicker, -kw / 2, ty - size * 1.28, ks, "label",
                      YELLOW, 0.92 * a, 0.16, "left")


def make(timeline, total, fps=30):
    import engine
    # The poster is already a designed, brightly lit graphic. The cinematic finish -- grain, heavy
    # vignette, warm grade -- is built for photographs and makes a poster look muddy and old. So the
    # look is the studio one with almost all of that turned off: a whisper of grain so the still does
    # not look like a digital freeze, and nothing else.
    look = dict(engine.LOOKS["studio"])
    look.update(grain=0.010, vignette=0.18, glow=0.0, curve=0.05,
                grade=(1.0, 1.0, 1.0), dim=(255, 255, 255))
    film = Film(total, fps=fps, look=look)
    # The engine requires at least one camera key even when the items frame themselves. One key,
    # held: the Plate items do the moving, and a camera key here would fight them.
    film.cam(0.0, 0, 0, _CAM_ZOOM)
    film.cam(total, 0, 0, _CAM_ZOOM)
    for sc in timeline:
        film.add(Plate(sc, sc["start"], sc["end"], 1122, 1402))
    # captions land on the beat, held for the scene
    for sc in timeline:
        film.add(Caption(sc["caption"], sc["start"] + 0.28, sc["end"] - 0.12,
                         kicker=sc.get("kicker", "")))
    return film


class PosterDoc:
    """Minimal stand-in for the engine's Doc: this film has no narration cue sheet to read.

    The timeline lives in script.py, measured from the takes, so the render and the mix cannot
    disagree about where a scene starts.
    """

    def __init__(self):
        self._tl, self._lead, self._total = S.timeline()

    @property
    def duration(self):
        return self._total

    def L(self, i):
        return self._tl[i]["start"]

    def E(self, i):
        return self._tl[i]["end"]


def build_film(doc=None):
    """Render entry point. The engine's Doc is ignored; the timeline is ours."""
    tl, lead, total = S.timeline()
    return make(tl, total)
