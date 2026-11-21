"""The graphics the reference style is made of: lower thirds, scripture, title cards, end card.

Everything is drawn in world units (4K screen pixels: at 1080p, world unit x 0.5 = screen px). The
camera in this film is parked at zoom 1.0, so world coordinates are simply screen coordinates times
two -- which is what makes "100 px from the edge at 1920x1080" mean "200 units" here.

Four rules, taken from the reference and kept everywhere:

1. **Nothing inside 10 % of an edge.** `SAFE` is the title-safe inset, and every item below clamps to
   it rather than to the frame.
2. **One lower third at a time**, except scripture (lower right) which may share the frame with a
   chapter bar (lower left).
3. **Easing, never linear.** Slides use `ease_out_cubic`; fades use a raised cosine.
4. **Type is fitted to its measure**, never trusted to a fixed size: the same bar has to hold
   "SIGN 1" and "The question after the calm" without either looking wrong.
"""
import skia

from engine import Item, draw_text, paint, ramp, ease_in_out, ease_out_cubic

# ---- palette (the reference's, not the previous film's) ----------------------------------------
GOLD = (212, 175, 55)          # #D4AF37 -- scripture references, rules, the accent
GOLD_LIGHT = (244, 196, 48)    # #F4C430 -- the highlight variant
WHITE = (255, 255, 255)
GREY = (204, 204, 204)         # #CCCCCC -- secondary text
CHARCOAL = (26, 26, 26)        # #1A1A1A -- the reference's shadow tone
BAR = (10, 10, 12)

FRAME_W = 3840.0
FRAME_H = 2160.0
SAFE_X = FRAME_W * 0.05        # 10 % of the frame edge-to-edge = 5 % each side
SAFE_Y = FRAME_H * 0.05


def fit(res, font, text, size, max_w, track=0.0, floor=0.018):
    """Largest size <= `size` at which `text` fits `max_w`. Returns (size, width)."""
    s = size
    while s > FRAME_H * floor:
        w = res.font(font, s).measureText(text) + track * s * max(0, len(text) - 1)
        if w <= max_w:
            return s, w
        s *= 0.94
    w = res.font(font, s).measureText(text) + track * s * max(0, len(text) - 1)
    return s, w


def bar(c, x0, y0, x1, y1, alpha, r=14.0, fill=BAR, a_fill=0.72):
    """A soft-cornered dark bar with a hairline, the house shape under every lower third."""
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect.MakeLTRB(x0, y0, x1, y1), r, r),
                paint(fill, a_fill * alpha))
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect.MakeLTRB(x0, y0, x1, y1), r, r),
                paint(GOLD, 0.20 * alpha, stroke=2.0))


class ChapterLowerThird(Item):
    """Two-tier chapter bar: sign number above, title below. Slides in from the left, holds, leaves.

    This is the reference's signature graphic, and the reason it works is the second tier: the
    number alone tells you where you are in a list, but the subtitle tells you why you are still
    watching.
    """

    z = 55

    def __init__(self, kicker, title, sub, t_in, t_out, hold=6.0, z=None):
        super().__init__(t_in, t_out, z, sfx=False)
        self.kicker, self.title, self.sub = kicker, title, sub
        self.hold = hold

    def bounds(self, res):
        return skia.Rect.MakeLTRB(-4000, -4000, 4000, 4000)

    def _geom(self, res):
        # the bar sits in the lower third, inside the safe area, with room for 100 px of air
        w = FRAME_W * 0.52
        x0 = -FRAME_W / 2 + SAFE_X + 40
        y1 = FRAME_H / 2 - SAFE_Y - FRAME_H * 0.03
        ks, _ = fit(res, "label", self.kicker, 56, w * 0.86, 0.30)
        ts, _ = fit(res, "label", self.title.upper(), 96, w * 0.86, 0.02)
        ss, _ = fit(res, "labelm", self.sub, 50, w * 0.86, 0.01)
        h = ks * 2.0 + ts * 1.6 + ss * 2.1 + 34
        return x0, y1 - h, x0 + w, y1, ks, ts, ss

    def draw(self, c, res, t):
        a = self.fade(t)
        if a <= 0:
            return
        # 300 ms slide in (ease-out), 300 ms slide out (ease-in) -- never a linear move
        tin = ramp(t, self.t_in, 0.30)
        tout = ramp(t, self.t_out, 0.30)
        dx = (1 - ease_out_cubic(tin)) * -(FRAME_W * 0.08) + ease_in_out(tout) * -(FRAME_W * 0.08)
        alpha = a * min(1.0, tin * 1.6) * (1 - tout)
        try:
            x0, y0, x1, y1, ks, ts, ss = self._geom(res)
        except Exception:
            return
        c.save()
        c.translate(dx, 0)
        bar(c, x0, y0, x1, y1, alpha, r=16.0)
        # gold rule in the bar's left margin, the reference's accent
        c.drawRect(skia.Rect.MakeLTRB(x0, y0 + 18, x0 + 6, y1 - 18), paint(GOLD, 0.9 * alpha))
        inx = x0 + 28
        ty = y0 + 30
        draw_text(c, res, self.kicker.upper(), inx, ty + ks, ks, "label", GOLD, alpha, 0.34, "left")
        ty += ks * 2.0
        draw_text(c, res, self.title.upper(), inx, ty + ts, ts, "label", WHITE, alpha, 0.02, "left")
        ty += ts * 1.55
        draw_text(c, res, self.sub, inx, ty + ss, ss, "labelm", GREY, alpha, 0.01, "left")
        # the bar is only on screen for `hold` seconds even if the item is alive longer
        c.restore()


class ScriptureLowerThird(Item):
    """The reference line, bottom right, in italic serif gold. One line, no bar chrome."""

    z = 56

    def __init__(self, reference, t_in, t_out, z=None):
        super().__init__(t_in, t_out, z, sfx=False)
        self.reference = reference

    def bounds(self, res):
        return skia.Rect.MakeLTRB(-4000, -4000, 4000, 4000)

    def draw(self, c, res, t):
        # 200 ms fade in, 200 ms out -- the reference's scripture lower third is a fade, not a slide
        a = ramp(t, self.t_in, 0.20) * (1 - ramp(t, self.t_out, 0.20))
        if a <= 0:
            return
        text = self.reference
        size, w = fit(res, "serif", text, 72, FRAME_W * 0.34, 0.02)
        x1 = FRAME_W / 2 - SAFE_X - 40
        y1 = FRAME_H / 2 - SAFE_Y - 30
        x0, y0 = x1 - w - 64, y1 - size * 2.4
        c.drawRRect(skia.RRect.MakeRectXY(skia.Rect.MakeLTRB(x0, y0, x1, y1), 12, 12),
                    paint(BAR, 0.55 * a))
        draw_text(c, res, text, x0 + 32, y1 - size * 0.72, size, "serif", GOLD, a, 0.02, "left")


class SignCard(Item):
    """Full-frame chapter card: dip to black, the number, the title, a gold rule, back out.

    The reference uses this at every one of the six boundaries, and it is doing real work: it gives
    the viewer a second to reset, which is what makes an eighteen-minute list feel navigable.
    """

    z = 70

    def __init__(self, kicker, title, sub, t_in, dur=3.2, z=None):
        super().__init__(t_in, t_in + dur, z, sfx=False)
        self.kicker, self.title, self.sub, self.dur = kicker, title, sub, dur

    def bounds(self, res):
        return skia.Rect.MakeLTRB(-4000, -4000, 4000, 4000)

    def draw(self, c, res, t):
        u = (t - self.t_in) / max(0.01, self.dur)
        # fade in from black, hold, fade to black: 0.45 s each way, no movement
        a = min(ramp(t, self.t_in, 0.45), 1 - ramp(t, self.t_in + self.dur - 0.45, 0.45))
        if a <= 0:
            return
        c.drawRect(skia.Rect.MakeLTRB(-FRAME_W / 2, -FRAME_H / 2, FRAME_W / 2, FRAME_H / 2),
                   paint((6, 6, 7), 0.94 * a))
        ks, _ = fit(res, "label", self.kicker.upper(), 60, FRAME_W * 0.8, 0.42)
        ts, _ = fit(res, "serifr", self.title, 150, FRAME_W * 0.76)
        ss, _ = fit(res, "serif", self.sub, 66, FRAME_W * 0.7, 0.01)
        y = -FRAME_H * 0.10
        draw_text(c, res, self.kicker.upper(), 0, y - ks * 1.4, ks, "label", GOLD, a, 0.42, "center")
        draw_text(c, res, self.title, 0, y + ts * 0.32, ts, "serifr", WHITE, a, 0.0, "center")
        # A thin gold rule, the reference's only ornament. Playfair's descender runs ~0.25 em
        # below the baseline, so the rule has to clear ts*0.32 + ts*0.25 or it cuts through the
        # tail of a "y" and reads as a strikethrough.
        c.drawRect(skia.Rect.MakeXYWH(-FRAME_W * 0.06, y + ts * 0.74, FRAME_W * 0.12, 4),
                   paint(GOLD, 0.85 * a))
        draw_text(c, res, self.sub, 0, y + ts * 1.24, ss, "serif", GREY, a, 0.01, "center")


class TitleCard(Item):
    """The opening: title over the picture, subtitle under it, no box -- the reference's cold open."""

    z = 68

    def __init__(self, title, subtitle, t_in, dur=5.0, z=None):
        super().__init__(t_in, t_in + dur, z, sfx=False)
        self.title, self.subtitle, self.dur = title, subtitle, dur

    def bounds(self, res):
        return skia.Rect.MakeLTRB(-4000, -4000, 4000, 4000)

    def draw(self, c, res, t):
        a = min(ramp(t, self.t_in, 0.7), 1 - ramp(t, self.t_in + self.dur - 0.8, 0.8))
        if a <= 0:
            return
        # A soft pool of dark behind the words so they survive a bright sky or a lit crowd.
        # MakeXYWH puts the rect's LEFT edge at x, so a vignette "centred" on 0 is half off frame --
        # use MakeLTRB with a real centre, or the words sit on bare picture on their left half.
        c.drawOval(skia.Rect.MakeLTRB(-FRAME_W * 0.48, -FRAME_H * 0.20,
                                      FRAME_W * 0.48, FRAME_H * 0.28),
                   paint((0, 0, 0), 0.50 * a, blur=300))
        ts, _ = fit(res, "serifr", self.title, 190, FRAME_W * 0.8, 0.02)
        ss, _ = fit(res, "labelm", self.subtitle.upper(), 40, FRAME_W * 0.62, 0.24)
        # the three elements stack with real leading: a rule that touches the descender of the
        # title reads as a mistake, and a subtitle that overruns the title is one
        draw_text(c, res, self.title, 0, 0, ts, "serifr", WHITE, a, 0.02, "center")
        # NB draw_text's `align` is the LAST positional arg before reveal, and it defaults to
        # left. Passing track and align in the wrong slots silently left-aligns the title, which
        # pushes it half a line to the right and under the subtitle.
        rule_y = ts * 0.46
        c.drawRect(skia.Rect.MakeXYWH(-FRAME_W * 0.05, rule_y, FRAME_W * 0.10, 4), paint(GOLD, 0.9 * a))
        # a shadow under the small tracked line: at 40 units it needs it more than the title does
        draw_text(c, res, self.subtitle.upper(), 2, rule_y + ss * 1.9 + 3, ss, "labelm",
                  (0, 0, 0), 0.65 * a, 0.24, "center")
        draw_text(c, res, self.subtitle.upper(), 0, rule_y + ss * 1.9, ss, "labelm", GOLD,
                  0.98 * a, 0.24, "center")


class KeyQuote(Item):
    """A full-width quote bar -- the reference's 'key point' lower third, mask-revealed."""

    z = 60

    def __init__(self, text, t_in, dur=5.0, z=None):
        super().__init__(t_in, t_in + dur, z, sfx=False)
        self.text, self.dur = text, dur

    def bounds(self, res):
        return skia.Rect.MakeLTRB(-4000, -4000, 4000, 4000)

    def draw(self, c, res, t):
        a = self.fade(t)
        if a <= 0:
            return
        # mask reveal: a clip that wipes across to expose the type, 0.55 s
        w = min(1.0, ease_out_cubic(ramp(t, self.t_in, 0.55)))
        if w <= 0:
            return
        size, tw = fit(res, "label", self.text.upper(), 66, FRAME_W * 0.78, 0.06)
        x0 = -tw / 2 - 70
        x1 = tw / 2 + 70
        y = FRAME_H * 0.055
        c.save()
        c.clipRect(skia.Rect.MakeLTRB(x0, y - size * 2.0,
                                      x0 + (x1 - x0) * w, y + size * 1.2))
        c.drawRect(skia.Rect.MakeLTRB(x0, y - size * 1.55, x1, y + size * 0.92),
                   paint(BAR, 0.62 * a))
        c.drawRect(skia.Rect.MakeLTRB(x0, y - size * 1.55, x0 + 6, y + size * 0.92),
                   paint(GOLD, 0.9 * a))
        draw_text(c, res, self.text.upper(), -tw / 2, y, size, "label", WHITE, a, 0.06, "left")
        c.restore()


class EndCard(Item):
    """Subscribe CTA over the last picture, and a clear 5 s for YouTube's end screen."""

    z = 72

    def __init__(self, line1, line2, t_in, t_out, z=None):
        super().__init__(t_in, t_out, z, sfx=False)
        self.line1, self.line2 = line1, line2

    def bounds(self, res):
        return skia.Rect.MakeLTRB(-4000, -4000, 4000, 4000)

    def draw(self, c, res, t):
        a = ramp(t, self.t_in, 0.8) * self.fade(t)
        if a <= 0:
            return
        s1, _ = fit(res, "label", self.line1.upper(), 78, FRAME_W * 0.7, 0.10)
        s2, _ = fit(res, "labelm", self.line2, 44, FRAME_W * 0.6, 0.14)
        # Upper third, not the middle: the candle and the table are the last image of the film and
        # a caption across them covers the only two objects in shot. Upper third also leaves the
        # bottom-right and the last five seconds clear for a YouTube end screen.
        y = -FRAME_H * 0.20
        c.drawOval(skia.Rect.MakeLTRB(-FRAME_W * 0.42, y - FRAME_H * 0.11,
                                      FRAME_W * 0.42, y + FRAME_H * 0.09),
                   paint((0, 0, 0), 0.48 * a, blur=220))
        draw_text(c, res, self.line1.upper(), 0, y, s1, "label", WHITE, a, 0.10, "center")
        c.drawRect(skia.Rect.MakeXYWH(-FRAME_W * 0.04, y + s1 * 0.72, FRAME_W * 0.08, 3),
                   paint(GOLD, 0.85 * a))
        draw_text(c, res, self.line2.upper(), 0, y + s1 * 0.72 + s2 * 1.5, s2, "labelm", GOLD,
                  0.95 * a, 0.14, "center")


class Grade(Item):
    """The reference's warm, moody finish, applied as a draw-time veil rather than baked into files.

    Warm amber in the highlights, near-black but uncrushed shadows, desaturated cool shadows, and a
    light grain. Doing it here rather than in the source keeps one grade over A-roll and B-roll alike,
    which is the whole point of a grade.
    """

    z = 80

    def __init__(self, t_in=0.0, t_out=None, amount=1.0, z=None):
        super().__init__(t_in, t_out, z, sfx=False)
        self.amount = amount

    def bounds(self, res):
        return skia.Rect.MakeLTRB(-4000, -4000, 4000, 4000)

    def draw(self, c, res, t):
        # warm wash: a very low-alpha amber that lifts skin and stone without tinting white type
        c.drawRect(skia.Rect.MakeLTRB(-FRAME_W / 2, -FRAME_H / 2, FRAME_W / 2, FRAME_H / 2),
                   paint((255, 176, 84), 0.055 * self.amount))
        # lifted, slightly cool shadows at the frame edges -- the "filmic" matte
        c.drawRect(skia.Rect.MakeLTRB(-FRAME_W / 2, -FRAME_H / 2, FRAME_W / 2, FRAME_H / 2),
                   paint((18, 22, 34), 0.05 * self.amount))
