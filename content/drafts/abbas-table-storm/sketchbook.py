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

from engine import Item, paint, ramp, ease_out_cubic

PAPER = (238, 230, 214)          # warm, slightly cream
PAPER_EDGE = (214, 203, 183)
INK = (43, 38, 34)
PENCIL = (86, 78, 70)
NIB = (58, 52, 46)
GOLD = (158, 126, 66)


def _rng(seed):
    return np.random.default_rng(seed)


class SketchPage(Item):
    """The paper the sketchbook writes on.

    A real surface rather than a white void: warm stock, faint grain, a soft vignette, and a
    handful of fixed specks so the page is never flat. `w`/`h` are in world units.
    """

    z = 20

    def __init__(self, x, y, w, h, t_in, t_out=None, seed=11, z=None):
        super().__init__(t_in, t_out, z, sfx=False)
        self.x, self.y, self.w, self.h = x, y, w, h
        rng = _rng(seed)
        # grain: fixed points on the page, drawn small and faint; they read as paper tooth
        self.grain = [(float(rng.uniform(-0.5, 0.5)), float(rng.uniform(-0.5, 0.5)),
                       float(rng.uniform(0.8, 2.2)), float(rng.uniform(0.03, 0.09)))
                      for _ in range(900)]
        self.fibres = [(float(rng.uniform(-0.5, 0.5)), float(rng.uniform(-0.5, 0.5)),
                        float(rng.uniform(20, 90))) for _ in range(40)]

    def bounds(self, res):
        r = max(self.w, self.h) * 0.75
        return skia.Rect.MakeLTRB(self.x - r, self.y - r, self.x + r, self.y + r)

    def draw(self, c, res, t):
        a = ramp(t, self.t_in, 0.7) * self.fade(t)
        if a <= 0:
            return
        W, H = self.w, self.h
        L, T = self.x - W / 2, self.y - H / 2
        c.drawRect(skia.Rect.MakeXYWH(L, T, W, H), paint(PAPER, a))

        # grain
        for gx, gy, r, al in self.grain:
            c.drawCircle(self.x + gx * W, self.y + gy * H, r, paint(PENCIL, al * a))
        # a few longer fibres, so it is paper and not noise
        for fx, fy, ln in self.fibres:
            x0 = self.x + fx * W
            y0 = self.y + fy * H
            c.drawLine(x0, y0, x0 + ln * 0.5, y0 + ln * 0.12, paint(PENCIL, 0.035 * a, stroke=1.1))

        # edge: a heavier line on the left and top reads as the page's spine and top edge
        c.drawRect(skia.Rect.MakeXYWH(L, T, W, H), paint(PAPER_EDGE, 0.55 * a, stroke=3.0))
        c.drawRect(skia.Rect.MakeXYWH(L, T, 26, H), paint(PAPER_EDGE, 0.30 * a))
        c.drawRect(skia.Rect.MakeXYWH(L, T, W, 22), paint(PAPER_EDGE, 0.18 * a))


class Written(Item):
    """A line of the narration, written by a hand, in step with the voice.

    `vo_start`/`vo_end` are the narration window for this exact sentence. The reveal is spread over
    that window word by word, weighted by each word's length in characters — which is a good proxy
    for how long it takes to say and therefore how long it should take to write. The nib rides the
    end of the revealed text and lifts between words.
    """

    z = 24

    def __init__(self, text, x, y, size, vo_start, vo_end, t_in=None, t_out=None,
                 font="serif", rgb=INK, seed=3, max_chars=34, z=None):
        super().__init__(t_in if t_in is not None else vo_start, t_out, z, sfx=False)
        self.text, self.x, self.y, self.size = text, x, y, size
        self.vo_start, self.vo_end = vo_start, vo_end
        self.font, self.rgb = font, rgb
        self.lines = _wrap(text, max_chars)
        self.lead = size * 1.36
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
                    nib_x, nib_y = x + widths[wi] * frac, -self.size * 0.26
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
    s = size * 0.030
    # shadow on the paper under the nib
    c.drawOval(skia.Rect.MakeLTRB(s * 1.5, -s * 0.7, s * 6.5, s * 2.2),
               paint((60, 52, 46), 0.16 * a, blur=s * 2.2))
    p = skia.Path()
    p.moveTo(0, 0)
    p.lineTo(s * 2.2, -s * 0.55)
    p.lineTo(s * 2.2, s * 0.55)
    p.close()
    c.drawPath(p, paint(NIB, 0.95 * a))                       # nib
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect.MakeLTRB(s * 2.0, -s * 0.75, s * 9.0, s * 0.75),
                                     s * 0.4, s * 0.4), paint((196, 172, 120), 0.95 * a))  # barrel
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
