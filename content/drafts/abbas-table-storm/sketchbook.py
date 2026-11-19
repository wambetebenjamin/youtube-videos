"""The sketchbook: a hand that writes what the narrator is saying, while she says it.

Two things make this read as *someone drawing* rather than as text fading in:

1. **The pen is on the paper.** A visible nib follows the stroke, with a small shadow and a cast
   shadow under the hand, and it lifts between words.
2. **The ink arrives at speaking speed.** Each word is revealed over the same fraction of time that
   the narrator spends saying it, so the writing and the voice stay together — if she slows down,
   the pen slows down; if she pauses, the pen stops.

Everything is deterministic: the stroke schedule is computed once from the line's text and its
narration window, so two render workers draw identical frames.
"""
import math

import numpy as np
import skia

from engine import Item, ramp, ease_out_cubic
from engine import paint as _paint


def paint(rgb=(0, 0, 0), a=1.0, stroke=None, blur=None, blend=None):
    """engine.paint, plus a blend mode.

    Kept here rather than in the engine because `tools/` is not tracked: a change there would be
    lost on the next clone, and the page's additive lift is not optional.
    """
    p = _paint(rgb, a, stroke=stroke, blur=blur)
    if blend:
        p.setBlendMode({"plus": skia.BlendMode.kPlus,
                        "screen": skia.BlendMode.kScreen}[blend])
    return p

# A page in shadow, written by lamplight -- not a sheet of white paper.
#
# The film is lit like a room at dusk: deep browns, a warm lamp, a cold window. A bright cream page
# laid into that reads as a slide dropped over the picture, however carefully it is drawn, because
# nothing else in the frame is that bright and paper does not glow. So the page is warm and low,
# the pen is the light, and the writing is candle-coloured ink that catches: it looks like a man in
# the story writing by a lamp, which is the thing being asked for.
PAPER = (30, 23, 17)             # warm board, a shade above the shadows around it
PAPER_EDGE = (152, 126, 92)
LIFT = (16, 9, 3)                # additive, to survive the night grade's blue multiply
INK = (250, 236, 202)            # the writing: warm, pale, like ink catching the lamp
PENCIL = (196, 172, 136)
NIB = (232, 214, 178)
GOLD = (150, 118, 62)
RULE = (188, 160, 118)


def _rng(seed):
    return np.random.default_rng(seed)


def wrap_by_width(res, text, font, size, max_w):
    """Break `text` into lines that each fit `max_w` at a fixed type size."""
    f = res.font(font, size)
    out = [""]
    for w in text.split():
        if f.measureText((out[-1] + " " + w).strip()) <= max_w or not out[-1]:
            out[-1] = (out[-1] + " " + w).strip()
        else:
            out.append(w)
    return out


def fit_size(res, text, font, max_w, max_lines=4, start=190, floor=26):
    """The largest type size at which `text` fills `max_w` without running past `max_lines` lines.

    Handwriting that trails off in the corner of a big page looks like a mistake; the page should
    be *used*. So instead of a fixed size, the size is chosen per line of narration.
    """
    size = start
    while size > floor:
        f = res.font(font, size)
        probe = [""]
        for w in text.split():
            if f.measureText(probe[-1] + " " + w) <= max_w or not probe[-1]:
                probe[-1] = (probe[-1] + " " + w).strip()
            else:
                probe.append(w)
        if len(probe) <= max_lines and max(f.measureText(l) for l in probe) <= max_w:
            return size, probe
        size *= 0.965
    return floor, probe


class SketchPage(Item):
    """The paper the sketchbook writes on.

    A real surface rather than a white void: warm stock, faint grain, a soft vignette, and a
    handful of fixed specks so the page is never flat. `w`/`h` are in world units.
    """

    z = 20

    def __init__(self, x, y, w, h, t_in, t_out=None, seed=11, rot=0.0, z=None, rules=None):
        super().__init__(t_in, t_out, z, sfx=False)
        self.x, self.y, self.w, self.h = x, y, w, h
        self.rot = rot
        # (y of the first rule, spacing, count) -- set once the writing's type size is known, so the
        # lines on the page and the lines of writing are the same lines.
        self.rules = rules
        rng = _rng(seed)
        # Grain sized in FRACTIONS of the page, not world units. The page is nearly a full frame
        # wide, so a 2-unit speck is a sub-pixel smudge on screen and the paper reads as flat
        # white. These are large enough to see as tooth.
        self.grain = [(float(rng.uniform(-0.5, 0.5)), float(rng.uniform(-0.5, 0.5)),
                       float(rng.uniform(0.0015, 0.0045)), float(rng.uniform(0.05, 0.16)))
                      for _ in range(1400)]
        self.fibres = [(float(rng.uniform(-0.5, 0.5)), float(rng.uniform(-0.5, 0.5)),
                        float(rng.uniform(0.01, 0.05))) for _ in range(70)]

    def bounds(self, res):
        r = max(self.w, self.h) * 0.75
        return skia.Rect.MakeLTRB(self.x - r, self.y - r, self.x + r, self.y + r)

    def draw(self, c, res, t):
        a = ramp(t, self.t_in, 0.7) * self.fade(t)
        if a <= 0:
            return
        W, H = self.w, self.h
        # A sheet laid on the table, not a slide: it is tilted a degree and a half, and everything
        # that follows is drawn in its own frame so the grain and edge travel with the paper.
        c.save()
        c.translate(self.x, self.y)
        c.rotate(self.rot)
        c.translate(-self.x, -self.y)
        L, T = self.x - W / 2, self.y - H / 2
        # Light pooling on the page. A page lit by one lamp is not a uniform rectangle: it is
        # warm and open near the lamp and falls away into the corners. Without this the sheet is
        # flat brown card, and flat is what makes a panel look like a graphic instead of a surface.
        sh = skia.GradientShader.MakeRadial(
            skia.Point(self.x - W * 0.10, self.y - H * 0.05), W * 0.62,
            # NB: in this Skia binding the FIRST colour lands at the radius and the last at the
            # centre -- the reverse of what the argument order suggests. Both gradients here were
            # drawing inside-out until this was checked against a test surface.
            [skia.Color(0, 0, 0), skia.Color(44, 30, 16), skia.Color(150, 108, 60)],
            [0.0, 0.54, 1.0], skia.TileMode.kClamp)
        lp = skia.Paint(AntiAlias=True, Shader=sh)
        lp.setAlphaf(min(1.0, 0.95 * a))
        lp.setBlendMode(skia.BlendMode.kPlus)
        c.drawRect(skia.Rect.MakeXYWH(L, T, W, H), lp)

        # shadow: the page sits ON the picture, so it needs to lift off it
        c.save(); c.translate(0, H * 0.012)
        c.drawRect(skia.Rect.MakeXYWH(L, T, W, H), paint((0, 0, 0), 0.55 * a, blur=W * 0.030))
        c.restore()

        c.drawRect(skia.Rect.MakeXYWH(L, T, W, H), paint(PAPER, a))
        # The 'night' grade (blue multiply, red cut), the vignette and the glow all land on this
        # page after it is drawn, and together they pull cream down to a muddy olive. A dark warm
        # wash cannot fix that -- it can only make it browner. So the page is lifted additively,
        # in the two channels the grade leaves alone, which is what keeps it reading as paper.
        c.drawRect(skia.Rect.MakeXYWH(L, T, W, H), paint(LIFT, a, blend="plus"))

        # rules, so the page reads as a notebook and the writing has somewhere to sit
        if self.rules is not None:
            r0, step, n = self.rules
            for i in range(n):
                yy = r0 + i * step
                c.drawLine(L + W * 0.05, yy, L + W * 0.95, yy,
                           paint(RULE, 0.18 * a, stroke=max(1.0, W * 0.0008)))
        # a margin rule, slightly stronger than the rest
        c.drawLine(L + W * 0.085, T + H * 0.10, L + W * 0.085, T + H * 0.94,
                   paint((176, 112, 88), 0.30 * a, stroke=max(1.0, W * 0.0010)))

        # tooth
        for gx, gy, r, al in self.grain:
            c.drawCircle(self.x + gx * W, self.y + gy * H, r * W, paint((128, 104, 76), al * a))
        # a few longer fibres, so it is paper and not noise
        for fx, fy, ln in self.fibres:
            x0, y0 = self.x + fx * W, self.y + fy * H
            c.drawLine(x0, y0, x0 + ln * W, y0 + ln * W * 0.16,
                       paint((132, 108, 78), 0.12 * a, stroke=W * 0.0012))

        sv = skia.GradientShader.MakeRadial(
            skia.Point(self.x, self.y), W * 0.78,
            [skia.Color(0, 0, 0, 160), skia.Color(0, 0, 0, 0), skia.Color(0, 0, 0, 0)],
            [0.0, 0.58, 1.0], skia.TileMode.kClamp)
        vp = skia.Paint(AntiAlias=True, Shader=sv)
        vp.setAlphaf(min(1.0, a))
        c.drawRect(skia.Rect.MakeXYWH(L, T, W, H), vp)

        # edge: a hairline all round, heavier on the left, reads as a real sheet
        c.drawRect(skia.Rect.MakeXYWH(L, T, W, H), paint(PAPER_EDGE, 0.75 * a, stroke=W * 0.0015))
        c.drawRect(skia.Rect.MakeXYWH(L, T, W * 0.006, H), paint(PAPER_EDGE, 0.45 * a))
        c.restore()


class Written(Item):
    """A line of the narration, written by a hand, in step with the voice.

    `vo_start`/`vo_end` are the narration window for this exact sentence. The reveal is spread over
    that window word by word, weighted by each word's length in characters — which is a good proxy
    for how long it takes to say and therefore how long it should take to write. The nib rides the
    end of the revealed text and lifts between words.
    """

    z = 24

    def __init__(self, text, x, y, size, vo_start, vo_end, t_in=None, t_out=None,
                 font="serif", rgb=INK, seed=3, max_chars=34, z=None, res=None, max_w=None,
                 max_lines=5):
        super().__init__(t_in if t_in is not None else vo_start, t_out, z, sfx=False)
        self.text, self.x, self.y, self.size = text, x, y, size
        self.vo_start, self.vo_end = vo_start, vo_end
        self.font, self.rgb = font, rgb
        # if the page geometry is supplied, fit the writing to the page instead of guessing
        if res is not None and max_w is not None:
            # One hand, one pen: the type size is FIXED and the number of lines varies instead.
            # Fitting the size to the text made short lines huge and long lines tiny, and the ten
            # pages stopped looking like the same notebook.
            self.lines = wrap_by_width(res, text, font, self.size, max_w)
        else:
            self.lines = _wrap(text, max_chars)
        self.lead = self.size * 1.36
        rng = _rng(seed)
        # per-line baseline wobble and per-word ink density: handwriting is not typesetting
        self.wobble = rng.uniform(-0.012, 0.012, len(self.lines))
        self.slant = rng.uniform(-0.6, 0.6)
        n_words = sum(len(l.split()) for l in self.lines)
        self.ink = rng.uniform(0.72, 1.0, max(1, n_words))

    def bounds(self, res):
        r = self.size * 24
        return skia.Rect.MakeLTRB(self.x - r, self.y - r, self.x + r, self.y + r)

    # ------------------------------------------------------------------
    def _schedule(self):
        """[(line_index, word, frac_start, frac_end)] in reveal order.

        Weighted by characters (plus one for the space, because the pen still travels across it),
        which tracks speaking time closely enough that the writing and the voice stay together.
        """
        if getattr(self, "_sched", None) is None:
            total = max(1, sum(len(l.replace(" ", "")) + len(l.split()) for l in self.lines))
            out, done = [], 0
            for li, line in enumerate(self.lines):
                for w in line.split():
                    f0 = done / total
                    done += len(w) + 1
                    out.append((li, w, f0, done / total))
            self._sched = out
        return self._sched

    def draw(self, c, res, t):
        a = self.fade(t)
        if a <= 0 or t < self.vo_start - 0.05:
            return

        # progress through the spoken window: the pen starts on the first word and stops on the last
        span = max(0.4, self.vo_end - self.vo_start)
        u = min(1.0, ease_out_cubic(ramp(t, self.vo_start, span) * 0.98 + 0.02))

        f = res.font(self.font, self.size)
        sched = self._schedule()
        k = 0
        nib_x = nib_y = None

        for li, line in enumerate(self.lines):
            ly = self.y + li * self.lead
            words = line.split()
            widths = [f.measureText(w) for w in words]
            space = f.measureText(" ")
            total_w = sum(widths) + space * max(0, len(words) - 1)
            x = -total_w / 2

            c.save()
            c.translate(self.x, ly)
            c.rotate(self.wobble[li])

            for wi, w in enumerate(words):
                _, _, f0, f1 = sched[k]
                k += 1
                if u < f0:
                    x += widths[wi] + space
                    continue
                frac = 1.0 if u >= f1 else max(0.0, (u - f0) / max(1e-6, f1 - f0))
                ink = float(self.ink[min(k - 1, len(self.ink) - 1)])
                wa = a * min(1.0, 0.4 + frac * 3.0) * ink
                c.save()
                c.translate(x, 0)
                if frac < 0.999:
                    # reveal by clipping the word's own box, so it looks written rather than faded
                    c.clipRect(skia.Rect.MakeLTRB(-space, -self.size * 1.15,
                                                  widths[wi] * frac, self.size * 0.45))
                c.drawString(w, 0, 0, f, paint(self.rgb, wa))
                c.restore()
                if frac < 0.999:
                    nib_x, nib_y = x + widths[wi] * frac, li * self.lead - self.size * 0.26
                x += widths[wi] + space
            c.restore()

        # the nib rides the last revealed character, then lifts away as the line finishes
        if nib_x is not None and t < self.vo_end + 0.4:
            lift = ramp(t, self.vo_end, 0.35)
            _nib(c, self.x + nib_x, self.y + self.size * 0.92 + nib_y - lift * self.size * 0.45,
                 a * (1.0 - lift), self.size)


def _nib(c, x, y, a, size):
    """A pen seen from above, nib exactly on the paper. Small: it must not shout."""
    if a <= 0.01:
        return
    c.save()
    c.translate(x, y)
    c.rotate(-34)
    s = size * 0.105
    # shadow on the paper under the nib
    c.drawOval(skia.Rect.MakeLTRB(s * 1.0, -s * 0.5, s * 8.0, s * 2.8),
               paint((40, 34, 28), 0.30 * a, blur=s * 2.6))
    p = skia.Path()
    p.moveTo(0, 0)
    p.lineTo(s * 2.2, -s * 0.55)
    p.lineTo(s * 2.2, s * 0.55)
    p.close()
    c.drawPath(p, paint((24, 20, 17), 1.0 * a))                       # nib
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect.MakeLTRB(s * 2.0, -s * 0.85, s * 13.0, s * 0.85),
                                     s * 0.45, s * 0.45), paint((62, 48, 36), 0.98 * a))
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect.MakeLTRB(s * 2.2, -s * 0.85, s * 13.0, -s * 0.25),
                                     s * 0.3, s * 0.3), paint((150, 122, 92), 0.92 * a))  # highlight
    c.restore()


def _wrap(text, max_chars):
    out, line = [], ""
    for word in text.split():
        trial = f"{line} {word}".strip()
        if len(trial) <= max_chars or not line:
            line = trial
        else:
            out.append(line)
            line = word
    if line:
        out.append(line)
    return out
