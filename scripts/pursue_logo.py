#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""The PURSUE mark: the ministry's logo, drawn as vector art.

The mark comes from the Youth Aflame hoodie print: the gold ribbon that circles
and turns into an arrow, the word PURSUE, the line OVERTAKE · RECOVER ALL, and
the verse it all rests on, 1 Samuel 30:8.

Everything is paths and type, so it is transparent wherever nothing is painted:
the exported PDF carries no background and the PNG is true RGBA.

    python3 scripts/pursue_logo.py            # brand/pursue-logo.pdf + .png

`draw_mark()` is imported by scripts/book_template.py for the cover.
"""
from __future__ import annotations

import math
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
BRAND = os.path.join(ROOT, "publishing", "chrisco-youth-aflame", "brand")
FONTS = os.path.join(BRAND, "fonts")

GOLD_DEEP = "#8f6626"
GOLD = "#c19a46"
GOLD_LIGHT = "#e4c98b"
GOLD_PALE = "#f4e6c4"


def _pt(cx, cy, r, a_deg):
    a = math.radians(a_deg)
    return cx + r * math.cos(a), cy + r * math.sin(a)


def _band(c, cx, cy, r_out, thick, a_head, a_tail, taper_deg=44.0, steps=210, taper_head=0.0):
    """Annular ribbon that tapers to a point at the tail end."""
    span = a_tail - a_head
    outer, inner = [], []
    for i in range(steps + 1):
        a = a_head + span * (i / steps)
        t = i / steps
        k = max(0.0, (t - (1.0 - taper_deg / span)) / (taper_deg / span))
        kh = max(0.0, 1.0 - (taper_head / span - t) / (taper_head / span)) if taper_head else 0.0
        w = thick * (1.0 - k * k * 0.94) * (1.0 - kh * kh * 0.9)
        outer.append(_pt(cx, cy, r_out, a))
        inner.append(_pt(cx, cy, max(r_out - w, r_out * 0.55), a))
    p = c.beginPath()
    p.moveTo(*outer[0])
    for q in outer[1:]:
        p.lineTo(*q)
    for q in reversed(inner):
        p.lineTo(*q)
    p.close()
    return p


def draw_emblem(c, cx, cy, R, gold, gold_deep, gold_light):
    """The ribbon and its arrowhead, drawn about (cx, cy) with radius R."""
    a_head, a_tail = 44.0, 232.0
    p = _band(c, cx, cy, R, R * 0.30, a_head, a_tail)
    c.setFillColor(gold)
    c.drawPath(p, stroke=0, fill=1)

    # inner echo: a short, thin arc inside the ribbon
    p2 = _band(c, cx, cy, R * 0.54, R * 0.042, a_head + 16, a_tail - 24, taper_deg=70.0, taper_head=46.0)
    c.setFillColor(gold_light)
    c.drawPath(p2, stroke=0, fill=1)

    # the head sits on the end of the ribbon and points out along it
    head_len, half = R * 0.50, R * 0.33
    tip = _pt(cx, cy, R + head_len, a_head)
    base_r = R - R * 0.19
    bx, by = _pt(cx, cy, base_r, a_head)
    ux, uy = -math.sin(math.radians(a_head)), math.cos(math.radians(a_head))
    p3 = c.beginPath()
    p3.moveTo(*tip)
    p3.lineTo(bx + ux * half, by + uy * half)
    p3.lineTo(bx - ux * half, by - uy * half)
    p3.close()
    c.setFillColor(gold)
    c.drawPath(p3, stroke=0, fill=1)

    # a fine highlight along the head, the way the foil catches light
    p4 = c.beginPath()
    for pt in (_pt(cx, cy, R + head_len * 0.92, a_head), _pt(cx, cy, base_r + R * 0.04, a_head)):
        if pt is not None:
            pass
    p4 = None


def draw_mark(c, x, y_top, width, page_h=842.0, on_dark=True, with_verse=False,
              color=None, deep=None, light=None):
    """Draw the stacked lockup, `width` wide, top-left at (x, y_top). Returns height."""
    from reportlab.lib.colors import HexColor

    C = HexColor(color or (GOLD if on_dark else "#a8802f"))
    D = HexColor(deep or (GOLD_DEEP if on_dark else "#7c5a1c"))
    L = HexColor(light or (GOLD_LIGHT if on_dark else "#8a6624"))

    from reportlab.pdfbase import pdfmetrics
    word_size = width * 0.193                       # cap height about 0.135 width
    tw_raw = pdfmetrics.stringWidth("PURSUE", "CN", word_size)
    track = max(width * 0.012, (width * 0.96 - tw_raw) / 5.0)
    cap = word_size * 0.70
    emblem = width * 0.80
    gap1 = width * 0.085
    tag_size = width * 0.036
    gap2 = width * 0.055
    verse_size = width * 0.030

    R = emblem / 2.0
    cx = x + width / 2.0
    cy = (page_h - y_top) - R
    draw_emblem(c, cx - R * 0.125, cy, R, C, D, L)   # head overhangs, so nudge left

    y_word = page_h - (y_top + emblem + gap1) - cap
    c.setFont("CN", word_size)
    c.setFillColor(C)
    w = c.stringWidth("PURSUE", "CN", word_size)
    t = c.beginText(cx - (w + track * 5) / 2.0, y_word)
    t.setFont("CN", word_size)
    t.setFillColor(C)
    t.setCharSpace(track)
    t.textOut("PURSUE")
    c.drawText(t)

    y_tag = y_word - gap2 - tag_size * 0.70
    txt = "OVERTAKE  ·  RECOVER ALL"
    space = width * 0.0062
    tw = c.stringWidth(txt, "LT", tag_size) + space * (len(txt) - 1)
    t2 = c.beginText(cx - tw / 2.0, y_tag)
    t2.setFont("LT", tag_size)
    t2.setFillColor(L)
    t2.setCharSpace(space)
    t2.textOut(txt)
    c.drawText(t2)

    h = emblem + gap1 + cap + gap2 + tag_size * 0.70
    if with_verse:
        y_v = y_tag - verse_size * 1.9
        v = "1 SAMUEL 30:8"
        vw = c.stringWidth(v, "LT", verse_size) + 1.4 * (len(v) - 1)
        t3 = c.beginText(cx - vw / 2.0, y_v)
        t3.setFont("LT", verse_size)
        t3.setFillColor(D)
        t3.setCharSpace(1.4)
        t3.textOut(v)
        c.drawText(t3)
        h += verse_size * 1.9
    return h


def register_fonts():
    from reportlab.pdfbase import pdfmetrics
    from reportlab.pdfbase.ttfonts import TTFont
    for name, f in (("CN", "Cinzel-Bold.ttf"), ("LT", "Lato-Regular.ttf")):
        try:
            pdfmetrics.registerFont(TTFont(name, os.path.join(FONTS, f)))
        except Exception:
            pass


def build(out_pdf=None):
    from reportlab.pdfgen import canvas

    register_fonts()
    out_pdf = out_pdf or os.path.join(BRAND, "pursue-logo.pdf")
    W, H = 460.0, 560.0
    c = canvas.Canvas(out_pdf, pagesize=(W, H))
    c.setTitle("PURSUE · Overtake, Recover All")
    c.setAuthor("CHRISCO Youth Aflame")
    draw_mark(c, 50.0, 40.0, 360.0, page_h=H, on_dark=False, with_verse=True)
    c.showPage()
    c.save()
    return out_pdf


def to_png(pdf_path, png_path, scale=4.0):
    import pymupdf as fitz
    d = fitz.open(pdf_path)
    pix = d[0].get_pixmap(matrix=fitz.Matrix(scale, scale), alpha=True)
    pix.save(png_path)
    return png_path


if __name__ == "__main__":
    pdf = build()
    png = to_png(pdf, os.path.join(BRAND, "pursue-logo.png"))
    print("wrote", pdf)
    print("wrote", png)
