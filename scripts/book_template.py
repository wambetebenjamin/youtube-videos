#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""UNUSED IS LOST — interior built to the SCHOOL BOOK template.

This module reproduces the reference layout (library/design-references/
school-prospectus-22pp.pdf) page type for page type: same page size, same
palette, same type scale, same page furniture, and the same organic shapes
(extracted from the template into brand/template-shapes.json).

Emits: publishing/chrisco-youth-aflame/book-01-unused-is-lost/unused-is-lost.pdf
"""
from __future__ import annotations

import html
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)

BOOK_DIR = os.path.join(ROOT, "publishing", "chrisco-youth-aflame", "book-01-unused-is-lost")
IMG = os.path.join(BOOK_DIR, "images")
FONTS = os.path.join(ROOT, "publishing", "chrisco-youth-aflame", "brand", "fonts")
SHAPE_FILE = os.path.join(ROOT, "publishing", "chrisco-youth-aflame", "brand", "template-shapes.json")

# ---------------------------------------------------------------- geometry --
PW, PH = 595.5, 842.25          # exactly the template page
M = 61.0                        # template left margin on cover/welcome
CW = PW - 2 * M


def u(t: str) -> str:
    """HTML entities -> unicode."""
    return html.unescape(t)


def esc(t: str) -> str:
    t = t.replace("&amp;", "\x00")
    t = html.unescape(t).replace("\x00", "&amp;")
    return t.replace("<b>", "<b>").replace("&", "&amp;") if False else t


def p_esc(t: str) -> str:
    t = t.replace("&amp;", "\x00")
    t = html.unescape(t).replace("\x00", "&amp;")
    out, i = [], 0
    while i < len(t):
        if t[i] == "&":
            j = t.find(";", i)
            if j != -1 and t[i + 1:j] in ("amp", "lt", "gt", "quot", "apos"):
                out.append(t[i:j + 1])
                i = j + 1
                continue
            out.append("&amp;")
            i += 1
            continue
        out.append(t[i])
        i += 1
    return "".join(out)


class Book:
    def __init__(self, path: str):
        from reportlab.lib.colors import HexColor
        from reportlab.lib.styles import ParagraphStyle
        from reportlab.pdfbase import pdfmetrics
        from reportlab.pdfbase.ttfonts import TTFont
        from reportlab.pdfgen import canvas

        from reportlab.platypus import Paragraph as _P
        self.HexColor = HexColor
        self.ParagraphStyle = ParagraphStyle
        self.Paragraph = _P
        pdfmetrics.registerFont(TTFont("B", os.path.join(FONTS, "DejaVuSans-Bold.ttf")))
        pdfmetrics.registerFont(TTFont("R", os.path.join(FONTS, "DejaVuSans.ttf")))
        pdfmetrics.registerFont(TTFont("SB", os.path.join(FONTS, "DejaVuSerif-Bold.ttf")))
        pdfmetrics.registerFontFamily("R", normal="R", bold="B", italic="R", boldItalic="B")
        pdfmetrics.registerFontFamily("B", normal="B", bold="B", italic="B", boldItalic="B")

        self.c = canvas.Canvas(path, pagesize=(PW, PH))
        self.c.setTitle("Unused Is Lost — CHRISCO Youth Aflame")
        self.c.setAuthor("CHRISCO Youth Aflame")
        self.c.setSubject("The Law of Use and the Law of Sowing and Reaping")

        self.BLUE = HexColor("#2a49f2")
        self.ORANGE = HexColor("#fa6704")
        self.GREEN = HexColor("#67cf4e")
        self.LBLUE = HexColor("#5d81ec")
        self.GREY = HexColor("#ececec")
        self.WHITE = HexColor("#ffffff")
        self.INK = HexColor("#000000")
        self.BODY = HexColor("#111111")
        self.shapes = json.load(open(SHAPE_FILE, encoding="utf-8"))
        self.page_no = 0
        self.numbers = {}

    # ---------------------------------------------------------- primitives --
    def Y(self, y_top):
        """top-down -> reportlab y"""
        return PH - y_top

    def bg(self, color=None):
        c = self.c
        c.setFillColor(color or self.WHITE)
        c.rect(0, 0, PW, PH, stroke=0, fill=1)

    def new(self, color=None):
        if self.page_no:
            self.c.showPage()
        self.page_no += 1
        self.bg(color)
        return self.page_no

    def _path(self, sh, dx=0.0, dy=0.0, sx=1.0, sy=1.0):
        c = self.c
        p = c.beginPath()
        first = True
        for it in sh["items"]:
            if it[0] == "re":
                x0, y0, x1, y1 = it[1]
                p.moveTo(x0 * sx + dx, PH - (y0 * sy + dy))
                p.lineTo(x1 * sx + dx, PH - (y0 * sy + dy))
                p.lineTo(x1 * sx + dx, PH - (y1 * sy + dy))
                p.lineTo(x0 * sx + dx, PH - (y1 * sy + dy))
                p.close()
                first = False
                continue
            pts = [it[1], it[2]] + list(it[3:])
            pts = [(q[0] * sx + dx, PH - (q[1] * sy + dy)) for q in pts]
            if first:
                p.moveTo(*pts[0])
                first = False
            else:
                p.lineTo(*pts[0])
            if it[0] == "l":
                p.lineTo(*pts[1])
            else:
                p.curveTo(pts[1][0], pts[1][1], pts[2][0], pts[2][1], pts[3][0], pts[3][1])
        p.close()
        return p

    def blob(self, name, color=None, dx=0.0, dy=0.0, sx=1.0, sy=1.0, alpha=None):
        c = self.c
        sh = self.shapes[name]
        col = color or self.HexColor(sh["fill"])
        if alpha is not None:
            from reportlab.lib.colors import Color
            col = Color(col.red, col.green, col.blue, alpha=alpha)
        c.setFillColor(col)
        c.drawPath(self._path(sh, dx, dy, sx, sy), stroke=0, fill=1)

    def photo(self, path, x, y, w, h, shape=None, dx=0, dy=0, sx=1, sy=1):
        """Draw image clipped to a rect or to one of the extracted shapes."""
        from PIL import Image
        c = self.c
        iw, ih = Image.open(path).size
        c.saveState()
        if shape:
            c.clipPath(self._path(self.shapes[shape], dx, dy, sx, sy), stroke=0, fill=0)
            bb = self.shapes[shape]["bbox"]
            bx0, by0 = bb[0] * sx + dx, PH - (bb[3] * sy + dy)
            bw, bh = (bb[2] - bb[0]) * sx, (bb[3] - bb[1]) * sy
            x, y, w, h = bx0, by0, bw, bh
        else:
            p = c.beginPath()
            p.rect(x, y, w, h)
            c.clipPath(p, stroke=0, fill=0)
        scale = max(w / iw, h / ih)
        dw, dh = iw * scale, ih * scale
        c.drawImage(path, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh, mask="auto")
        c.restoreState()

    def roundphoto(self, path, x, y_top, w, h, r=22):
        """Photo in a rounded window (template photo treatment)."""
        c = self.c
        y = self.Y(y_top + h)
        c.saveState()
        p = c.beginPath()
        p.roundRect(x, y, w, h, r)
        c.clipPath(p, stroke=0, fill=0)
        from PIL import Image
        iw, ih = Image.open(path).size
        scale = max(w / iw, h / ih)
        dw, dh = iw * scale, ih * scale
        c.drawImage(path, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh, mask="auto")
        c.restoreState()

    def wavy_photo(self, path, depth_l=430, depth_r=260, bulge=0.0):
        """Full-width photo across the top with the template's wavy lower edge."""
        c = self.c
        c.saveState()
        p = c.beginPath()
        p.moveTo(0, PH)
        p.lineTo(PW, PH)
        p.lineTo(PW, PH - depth_r)
        p.curveTo(PW - 60, PH - depth_r - 60, PW - 150, PH - depth_l + 30, PW * 0.56, PH - depth_l + 8)
        p.curveTo(PW * 0.34, PH - depth_l - 10, PW * 0.14, PH - depth_l - 44, 0, PH - depth_l - 30)
        p.close()
        c.clipPath(p, stroke=0, fill=0)
        from PIL import Image
        iw, ih = Image.open(path).size
        W, H = PW, depth_l + 60
        scale = max(W / iw, H / ih)
        dw, dh = iw * scale, ih * scale
        c.drawImage(path, (W - dw) / 2, PH - H + (H - dh) / 2 + 20, dw, dh, mask="auto")
        c.restoreState()

    def notched_photo(self, path, x, y, w, h):
        """Photo with the template's torn-paper wedge cuts."""
        c = self.c
        self.photo(path, x, y, w, h)
        c.setFillColor(self.WHITE)
        c.setStrokeColor(self.WHITE)
        p = c.beginPath()
        p.moveTo(x - 1, y + h + 1)
        p.lineTo(x + 0.34 * w, y + h + 1)
        p.lineTo(x + 0.06 * w, y + 0.52 * h)
        p.close()
        c.drawPath(p, stroke=0, fill=1)
        p = c.beginPath()
        p.moveTo(x + w + 1, y - 1)
        p.lineTo(x + 0.58 * w, y - 1)
        p.lineTo(x + w + 1, y + 0.42 * h)
        p.close()
        c.drawPath(p, stroke=0, fill=1)

    # ---------------------------------------------------------------- text --
    def text(self, x, y_top, s, font="R", size=10, color=None, spacing=0.0):
        c = self.c
        c.setFont(font, size)
        c.setFillColor(color or self.BODY)
        if spacing:
            c.saveState()
            t = c.beginText(x, self.Y(y_top))
            t.setFont(font, size)
            t.setFillColor(color or self.BODY)
            t.setCharSpace(spacing)
            t.textOut(s)
            c.drawText(t)
            c.restoreState()
        else:
            c.drawString(x, self.Y(y_top), s)
        return self.width(s, font, size, spacing)

    def width(self, s, font="R", size=10, spacing=0.0):
        return self.c.stringWidth(s, font, size) + spacing * max(0, len(s) - 1)

    def block(self, x, y_top, w, s, font="R", size=10, leading=13.6, color=None,
              align=0, spacing=0.0):
        """Wrapped paragraph; returns the y (top-down) after the last line."""
        st = self.ParagraphStyle("p", fontName=font, fontSize=size, leading=leading,
                                 textColor=color or self.BODY, alignment=align)
        p = self.Paragraph(p_esc(s), st)
        _, h = p.wrap(w, 10000)
        p.drawOn(self.c, x, self.Y(y_top) - h)
        return y_top + h

    def head(self, x, y_top, lines, size=45, color=None, leading=None, font="B", spacing=-0.5, max_w=None):
        """Big multi-line heading. If max_w is given the size shrinks until every line fits."""
        if max_w:
            while size > 11 and max(self.width(l, font, size, spacing) for l in lines) > max_w:
                size -= 0.5
            leading = None if leading is None else None
        lead = leading or size * 1.02
        c = self.c
        yy = y_top + size * 0.78
        for ln in lines:
            c.saveState()
            t = c.beginText(x, self.Y(yy))
            t.setFont(font, size)
            t.setFillColor(color or self.WHITE)
            t.setCharSpace(spacing)
            t.textOut(ln)
            c.drawText(t)
            c.restoreState()
            yy += lead
        return yy - size * 0.78

    def pill(self, x, y_top, label, size=11, h=31, color=None, text_color=None, padx=14):
        c = self.c
        w = self.width(label, "B", size) + 2 * padx
        c.setFillColor(color or self.ORANGE)
        c.roundRect(x, self.Y(y_top + h), w, h, h / 2.0, stroke=0, fill=1)
        c.setFillColor(text_color or self.WHITE)
        c.setFont("B", size)
        c.drawString(x + padx, self.Y(y_top + h) + (h - size * 0.72) / 2 + 1.2, label)
        return w

    def star(self, x, y_top, r=6, color=None):
        import math
        c = self.c
        c.setFillColor(color or self.BLUE)
        p = c.beginPath()
        for i in range(10):
            rad = r if i % 2 == 0 else r * 0.42
            a = -math.pi / 2 + i * math.pi / 5
            px, py = x + rad * math.cos(a), self.Y(y_top) + rad * math.sin(a)
            if i == 0:
                p.moveTo(px, py)
            else:
                p.lineTo(px, py)
        p.close()
        c.drawPath(p, stroke=0, fill=1)

    def circle(self, cx, cy_top, r, color, text=None, tsize=15, tcolor=None):
        c = self.c
        c.setFillColor(color)
        c.circle(cx, self.Y(cy_top), r, stroke=0, fill=1)
        if text:
            c.setFillColor(tcolor or self.WHITE)
            c.setFont("B", tsize)
            tw = c.stringWidth(text, "B", tsize)
            c.drawString(cx - tw / 2, self.Y(cy_top) - tsize * 0.35, text)

    def icon_bullet(self, x, y_top, label, body, w=230, color=None):
        self.star(x + 5, y_top + 4, 6.5, color or self.BLUE)
        y = self.text(x + 18, y_top + 9, label, "B", 10, self.INK)
        if body:
            y = self.block(x + 18, y_top + 12, w, body, "R", 10, 13.2, self.BODY)
        else:
            y = y_top + 14
        return y + 4

    def pagenum(self, n=None):
        n = n or self.page_no
        self.text(43.8, 792, "%02d" % n, "B", 10, self.BLUE)

    def pagenum_white(self, n=None):
        n = n or self.page_no
        self.text(43.8, 792, "%02d" % n, "B", 10, self.WHITE)

    def hairline(self, x0, x1, y_top, color=None, width=0.8):
        c = self.c
        c.setStrokeColor(color or self.WHITE)
        c.setLineWidth(width)
        c.line(x0, self.Y(y_top), x1, self.Y(y_top))

    # ------------------------------------------------------------ pieces ----
    def logo(self, x, y_top, color=None, scale=1.0):
        """Small square mark + three-line wordmark, as on the template cover."""
        c = self.c
        s = 34 * scale
        c.setFillColor(color or self.WHITE)
        c.rect(x, self.Y(y_top + s), s, s, stroke=0, fill=1)
        c.setFillColor(self.BLUE if color is None or color == self.WHITE else self.WHITE)
        c.setFont("B", 16 * scale)
        c.drawString(x + s * 0.22, self.Y(y_top + s * 0.68), "C")
        for i, ln in enumerate(("CHRISCO", "YOUTH", "AFLAME")):
            self.text(x + s + 9, y_top + 12 + i * 12.4, ln, "B", 10.5 * scale, color or self.WHITE)

    def blue_band(self, depth_left=392, depth_right=292, curve=52):
        """Full-width blue field across the top with a wavy lower edge."""
        c = self.c
        c.setFillColor(self.BLUE)
        p = c.beginPath()
        p.moveTo(0, PH)
        p.lineTo(PW, PH)
        p.lineTo(PW, PH - depth_right)
        p.curveTo(PW - 90, PH - depth_right - curve,
                  PW - 210, PH - depth_left + curve * 0.4,
                  PW * 0.42, PH - depth_left + 6)
        p.curveTo(PW * 0.24, PH - depth_left - 6, PW * 0.10, PH - depth_left + 18, 0, PH - depth_left + 26)
        p.close()
        c.drawPath(p, stroke=0, fill=1)


# ------------------------------------------------------------------ content --
TOC = [
    ("Welcome", 3), ("The Two Laws At A Glance", 5),
    ("Part One — The Law of Use", 6),
    ("One · Nobody Votes On It", 7),
    ("Two · Seven Things That Leak", 8),
    ("Three · The Servant Who Played It Safe", 9),
    ("Four · Take A New Inventory Of Yourself", 10),
    ("Part Two — The Law Of Sowing And Reaping", 12),
    ("Five · Look In The Mirror", 13),
    ("Six · Seven Keys To Sowing And Reaping", 14),
    ("Seven · The Seed Already In Your Hand", 15),
    ("Eight · Thirty Days Of Sowing", 16),
    ("My Thirty Days", 17),
    ("A Charge — Don't Let The Springs Pass", 18),
    ("A Prayer To Close", 19),
    ("Notes", 20), ("Credits And Acknowledgements", 21),
]


def build(out_path: str):
    b = Book(out_path)
    B, R, SB = "B", "R", "SB"

    # ------------------------------------------------------------------ 01 --
    b.new(b.BLUE)
    b.wavy_photo(os.path.join(IMG, "04-worship-light.jpg"), depth_l=470, depth_r=300)
    b.blob("toc_green", b.GREEN, dx=340, dy=-250, sx=0.75, sy=0.75)
    b.logo(39.6, 45)
    b.head(61.2, 486.8, ["UNUSED", "IS LOST"], size=62, color=b.WHITE, max_w=440)
    b.text(61.2, 700.6, "The Law of Use and the", B, 30.4, b.WHITE, -0.4)
    b.text(61.2, 733.6, "Law of Sowing and Reaping", B, 30.4, b.WHITE, -0.4)

    # ------------------------------------------------------------------ 02 --
    b.new(b.BLUE)
    b.blob("toc_green", b.GREEN)
    b.head(62.4, 41.5, ["Table of", "Contents"], size=45, color=b.WHITE, max_w=400)
    y = 240.0
    b.hairline(126.9, 458.9, y - 2.5)
    b.text(126.9, y + 9, "Table of Contents", B, 12, b.WHITE)
    b.text(442.8, y + 9, "02", R, 12, b.WHITE)
    for label, pg in TOC:
        y += 36.6 if len(label) < 34 else 44.0
        b.hairline(126.9, 458.9, y - 2.5)
        b.text(126.9, y + 9, label, B, 12, b.WHITE)
        b.text(442.8, y + 9, "%02d" % pg, R, 12, b.WHITE)
    b.pagenum_white()

    # ------------------------------------------------------------------ 03 --
    b.new(b.WHITE)
    b.blue_band(616, 560, 58)
    b.roundphoto(os.path.join(IMG, "04-worship-light.jpg"), 392, 70, 160, 250, r=80)
    b.blob("welcome_green", b.GREEN, dx=30, dy=-190, sx=0.72, sy=0.72)
    b.text(66.9, 383.5, "Welcome To", R, 20, b.WHITE)
    b.head(66.9, 393.4, ["Unused", "Is Lost"], size=45, leading=49.5, color=b.WHITE, max_w=330)
    b.text(66.9, 557.7, "Two laws that decide what a life becomes", R, 20.6, b.WHITE)
    b.text(61.0, 656.0, "FOREWORD", B, 9, b.BLUE, 2.4)
    y = b.block(122.0, 680.0, 380,
                "Some sentences are so small that you walk past them, and so true that you never do. "
                "This book is built on one of those: <b>whatever you don't use, you lose.</b> An older man "
                "handed it to a younger one a long time ago, and the younger man spent the rest of his life proving it.",
                R, 9.6, 13.2)
    y = b.block(122.0, y + 7, 380,
                "It is not a proverb about money. It is a law about everything you have been given. It does not send "
                "a warning letter; it simply takes back what you refuse to put to work.", R, 9.6, 13.2)
    b.hairline(122.0, 502.0, 778.0, b.GREY, 1.0)
    for i, (lab) in enumerate(["Law One — Use", "Law Two — Sow"]):
        x = 122.0 + i * 200
        b.c.setFillColor(b.BLUE)
        b.c.circle(x, b.Y(798.0), 4.4, stroke=0, fill=1)
        b.text(x + 13, 802.0, lab, B, 10, b.INK)
    b.pagenum()

    # ------------------------------------------------------------------ 04 --
    b.new(b.WHITE)
    b.blue_band(500, 470, 44)
    b.roundphoto(os.path.join(IMG, "02-leap.jpg"), 45, 70, 245, 300, r=90)
    b.text(355.4, 123.0, "Our Vision", B, 21, b.WHITE)
    b.block(355.4, 148.4, 178,
            "A generation of young people who put everything God gave them to work — and who are not found "
            "with a buried gift in their hands.", R, 9.6, 13.0, b.WHITE)
    b.text(355.4, 236.6, "Our Mission", B, 21, b.WHITE)
    b.block(355.4, 262.5, 178,
            "To teach the two basic laws in plain language, in our own words, to every young person who will read: "
            "the law of use and the law of sowing and reaping — then send them out to practise them in the ordinary "
            "fields of home, church, school and work.", R, 9.6, 13.0, b.WHITE)
    b.text(59.5, 434.4, "Core Values", B, 21, b.WHITE)
    b.pill(59.5, 452.0, "Unused is lost · Sown is not", 11, 34)
    for i, (h, t, img) in enumerate([
        ("Use What You Have",
         "Every gift has a maintenance cost and the fee is use. We start with what is already in our hands.",
         "03-starting-blocks.jpg"),
        ("Sow Where You Are",
         "We do not wait for a bigger field. We plant in the one we can see, this week, with what we have.",
         "06-maize-farmer.jpg"),
    ]):
        x = 61.0 if i == 0 else 336.0
        b.roundphoto(os.path.join(IMG, img), x, 560.0, 210, 120, r=18)
        b.text(x, 707.8, h, B, 14, b.INK)
        b.block(x, 726.0, 196, t, R, 9.6, 13.0)
    b.pagenum()

    # ------------------------------------------------------------------ 05 --
    b.new(b.BLUE)
    b.wavy_photo(os.path.join(IMG, "04-worship-light.jpg"), depth_l=330, depth_r=300)
    b.head(85.0, 380.0, ["The Two Laws"], size=45, color=b.WHITE, max_w=430)
    b.head(85.0, 432.0, ["At A Glance"], size=45, color=b.WHITE, max_w=430)
    b.pill(203.0, 510.0, "Basic Laws", 11.5, 33)
    rows = [
        ("Law One — Use", "Whatever you don't use, you lose. Talent, ability, ambition, vitality, energy, "
                          "strong feelings, faith: unused, every one of them declines."),
        ("Law Two — Sow", "Whatever you are reaping is what you have sown. If the crop is bitter, "
                          "the farmer is not hard to find."),
        ("The Turn", "You cannot fix a harvest. You can change a seed — and you can start today."),
    ]
    y = 570.0
    for lab, txt in rows:
        b.text(203.0, y, lab, B, 21, b.WHITE)
        y = b.block(203.0, y + 15, 330, txt, R, 9.6, 13.4, b.WHITE) + 34
    b.pagenum_white()

    # ------------------------------------------------------------ 06 part 1 --
    b.new(b.WHITE)
    b.blue_band(392, 300, 54)
    b.head(85.0, 100.0, ["Part One"], size=45, color=b.WHITE, max_w=290)
    b.head(85.0, 165.0, ["The Law", "Of Use"], size=45, color=b.WHITE, max_w=290)
    b.block(390.0, 112.0, 150,
            "Nothing you own stays yours by accident. Every gift carries a maintenance cost, and the fee is use. "
            "This first part is the audit: what have you been given, and what are you doing with it?", R, 10, 13.6, b.WHITE)
    b.head(85.0, 440.0, ["What The Law Says"], size=21, color=b.INK, leading=24)
    for i, f in enumerate(("04-worship-light.jpg", "03-starting-blocks.jpg", "02-leap.jpg")):
        b.notched_photo(os.path.join(IMG, f), 85 + i * 137, b.Y(660.0), 128, 160)
    b.block(290.0, 680.0, 250,
            "The law of use is quiet and it is ruthless. It never argues with you, never sends a bill on the day. "
            "It waits — and then it closes the window. A talent unused is lost. An ability unused is lost. "
            "It is a law.", R, 10, 13.5)
    b.pill(290.0, 745.0, "Four chapters, one question", 11, 31)
    b.pagenum()

    # ------------------------------------------------------------- 07 ch 1 --
    b.new(b.WHITE)
    b.blue_band(300, 236, 46)
    b.head(85.0, 96.0, ["Nobody", "Votes On It"], size=45, color=b.WHITE, max_w=290)
    b.text(390.0, 118.0, "CHAPTER ONE", B, 9, b.GOLD if False else b.WHITE, 2.2)
    b.block(390.0, 134.0, 150,
            "The law does not ask your opinion. It does not bring your case up for a vote.", R, 10, 13.2, b.WHITE)
    b.head(85.0, 350.0, ["Whatever You Don't Use,", "You Lose"], size=21, leading=24, color=b.INK)
    y = b.block(85.0, 400.0, 250,
                "There is a kind of person who says, “I'll work twice as hard tomorrow to make up for today.” "
                "That is arithmetic that feels honest and is not. The day is not a bank; you cannot deposit it back.")
    b.block(85.0, y + 6, 250,
            "Tie your arm to your side. Leave it there long enough and you will never use it again — not because anything "
            "dramatic happened, but because you stopped. Stopping was enough. If you quit, you lose automatically. "
            "They do not bring it up for a vote.")
    b.roundphoto(os.path.join(IMG, "03-starting-blocks.jpg"), 352, 348, 185, 250, r=100)
    b.pill(85.0, 600.0, "So take an inventory", 11, 31)
    b.icon_bullet(85, 652, "Talent", "What am I good at that I have not touched this year?", 430)
    b.icon_bullet(85, 692, "Ambition", "Unused, it does not stay at full strength; it declines into cynicism.", 430)
    b.icon_bullet(85, 732, "Faith", "Not faith spoken about — faith exercised. Unused, it decreases.", 430)
    b.pagenum()

    # ------------------------------------------------------------- 08 ch 2 --
    b.new(b.WHITE)
    b.blob("prog_grey", b.GREY, dx=0, dy=-120)
    b.head(85.0, 76.0, ["Seven Things", "That Leak"], size=45, color=b.INK, leading=46, max_w=430)
    b.text(85.0, 200.0, "CHAPTER TWO", B, 9, b.BLUE, 2.4)
    b.block(85.0, 218.0, 250,
            "The law of use does not only apply to money or muscles. It applies to the invisible things that decide "
            "what a life becomes. Name them plainly and they stop being vague.")
    items = [
        ("01", "Talent", "Unusually good at it, unusually lazy about it. It does not wait forever."),
        ("02", "Ability", "Talent you have trained. Untrained, it stays a rumour your family repeats."),
        ("03", "Ambition", "Unused, it declines into cynicism about people who still want things."),
        ("04", "Vitality", "It diminishes in the body first, long before you notice."),
        ("05", "Energy", "You cannot store it like grain. Rest is not storage."),
        ("06", "Strong feelings", "Conviction and compassion grow only by being acted on."),
        ("07", "Faith", "Not faith spoken about — faith exercised. Unused, it decreases."),
    ]
    for i, (n, h, t) in enumerate(items):
        col = i // 4
        row = i % 4
        x = 85.0 + col * 245
        y = 292.0 + row * 104
        b.circle(x + 22, y + 6, 21, b.ORANGE, n, 13, b.WHITE)
        b.text(x + 54, y + 10, h, B, 14, b.INK)
        b.block(x + 54, y + 22, 160, t, R, 10, 13.2)
    b.block(85.0, 714.0, 420, "Seven things. One law. And a mercy inside it: the leak is reversible while you can still read these words.",
            SB, 11, 15, b.BLUE)
    b.pagenum()

    # ------------------------------------------------------------- 09 ch 3 --
    b.new(b.WHITE)
    b.blue_band(292, 240, 44)
    b.head(85.0, 92.0, ["The Servant Who", "Played It Safe"], size=45, color=b.WHITE, max_w=470)
    b.text(85.0, 258.0, "MATTHEW 25:14–30  ·  THREE SERVANTS, ONE BURIED TALENT", B, 8.6, b.WHITE, 1.8)
    b.head(85.0, 344.0, ["He Was Not Condemned", "For The Talent"], size=21, leading=24, color=b.INK)
    y = b.block(85.0, 400.0, 250,
                "A master went on a journey and handed his property to three servants — five talents, two, and one. "
                "The first two traded and doubled. The third wrapped his in cloth, dug a hole, and buried it. "
                "He handed it back exactly as received, and called that a success.")
    b.block(85.0, y + 6, 250,
            "The verdict is one of the hardest sentences in the Bible: the talent is taken from him and given to the man "
            "who already has ten. Not because he was cruel — because he was idle. He had confused doing no harm with doing good.")
    b.roundphoto(os.path.join(IMG, "07-harvest-field.jpg"), 352, 348, 185, 240, r=100)
    b.pill(85.0, 606.0, "The buried gift", 11, 31)
    b.icon_bullet(85, 658, "Safety is not obedience", "Burying the talent was the one thing he could have done differently.", 430)
    b.icon_bullet(85, 700, "What is wrapped in cloth?", "Name it tonight. Dig it up this week. Put it to work before Sunday.", 430)
    b.pagenum()

    # ------------------------------------------------------------- 10 ch 4 --
    b.new(b.WHITE)
    b.blob("green_tail", b.GREEN, dx=60, dy=-30)
    b.head(85.0, 80.0, ["Take A New"], size=45, color=b.INK, max_w=430)
    b.head(85.0, 145.0, ["Inventory"], size=45, color=b.INK, max_w=430)
    b.text(85.0, 232.0, "CHAPTER FOUR · WORKSHEET", B, 9, b.BLUE, 2.4)
    b.block(85.0, 250.0, 250, "An inventory is not a guilt trip. It is a map. Fill it in honestly, in pencil, and revisit it every quarter.")
    hdrs = ["What I have been given", "Where I last used it", "One way to use it"]
    xs = [85.0, 250.0, 385.0]
    b.c.setFillColor(b.BLUE)
    b.c.rect(85.0, b.Y(320.0), 430, 24, stroke=0, fill=1)
    for x, hh in zip(xs, hdrs):
        b.text(x + 6, 315.0, hh.upper(), B, 8, b.WHITE)
    for r in range(6):
        yy = 344.0 + r * 34
        b.hairline(85.0, 515.0, yy, b.BLUE, 0.6)
    for i, x in enumerate(xs[1:], start=1):
        b.c.setStrokeColor(b.BLUE)
        b.c.setLineWidth(0.6)
        b.c.line(x - 10, b.Y(344.0), x - 10, b.Y(344.0 + 6 * 34))
    b.pill(85.0, 566.0, "Three questions", 11, 31)
    qs = ["The gift people keep thanking me for is…",
          "The thing I have called “not yet” for over a year is…",
          "What I would attempt this month if I truly believed unused is lost:"]
    y = 612.0
    for q in qs:
        b.text(85.0, y, q, B, 10.5, b.INK)
        for k in range(2):
            b.hairline(85.0, 515.0, y + 20 + k * 26, b.GREY, 1.0)
        y += 78
    b.text(85.0, y + 6, "Show this page to one person who loves you and is not impressed by you. Then act on the first line before Sunday.",
           SB, 11, b.BLUE)
    b.pagenum()

    # ------------------------------------------------------------- 11 quote --
    b.new(b.BLUE)
    b.blob("close_green", b.GREEN, dx=250, dy=340, sx=0.8, sy=0.8)
    b.head(85.0, 300.0, ["“You don't lose your gift", "in a tragedy. You lose it", "on an ordinary Tuesday.”"],
           size=32, leading=42, color=b.WHITE, spacing=-0.3)
    b.text(85.0, 460.0, "BETWEEN PART ONE AND PART TWO", B, 9, b.WHITE, 2.6)
    b.text(85.0, 700.0, "UNUSED IS LOST", B, 10, b.WHITE, 4.0)
    b.pagenum_white()

    # ------------------------------------------------------------ 12 part 2 --
    b.new(b.WHITE)
    b.blue_band(392, 300, 54)
    b.head(85.0, 100.0, ["Part Two"], size=45, color=b.WHITE, max_w=290)
    b.head(85.0, 165.0, ["The Law Of", "Sowing"], size=45, color=b.WHITE, max_w=290)
    b.block(390.0, 112.0, 150,
            "If the harvest is bitter, the question is not why God is doing this. The question is who planted it — "
            "and you will find the farmer in the mirror.", R, 10, 13.6, b.WHITE)
    b.head(85.0, 440.0, ["You Reap What You've Sown"], size=21, color=b.INK, leading=24)
    for i, f in enumerate(("06-maize-farmer.jpg", "07-harvest-field.jpg", "04-worship-light.jpg")):
        b.notched_photo(os.path.join(IMG, f), 85 + i * 137, b.Y(660.0), 128, 160)
    b.block(290.0, 680.0, 250,
            "The same machinery that ruins a careless life will quietly build a faithful one. Many ways to sow. "
            "Anyone can. The only question is whether you will.", R, 10, 13.5)
    b.pill(290.0, 745.0, "Seven keys, one month", 11, 31)
    b.pagenum()

    # ------------------------------------------------------------- 13 ch 5 --
    b.new(b.WHITE)
    b.blue_band(300, 236, 46)
    b.head(85.0, 96.0, ["Look In", "The Mirror"], size=45, color=b.WHITE, max_w=290)
    b.text(390.0, 118.0, "CHAPTER FIVE", B, 9, b.WHITE, 2.2)
    b.block(390.0, 134.0, 150, "Two quotings of one law — and only the second one is useful.", R, 10, 13.2, b.WHITE)
    b.head(85.0, 350.0, ["Whatever You Are Reaping", "Is What You Have Sown"], size=19, leading=23, color=b.INK)
    y = b.block(85.0, 400.0, 250,
                "The polite version is: you reap what you sow. Everyone nods at that; it makes a good poster. "
                "The honest version is: whatever you are reaping is what you have sown. That one has a name and an address.")
    b.block(85.0, y + 6, 250,
            "If the crop is the problem, you cannot fix the crop — but you can change the seed, and you can start today. "
            "This is not fatalism. It is the most hopeful doctrine in the world, because it puts the harvest back inside your reach.")
    b.roundphoto(os.path.join(IMG, "07-harvest-field.jpg"), 366, 344, 172, 240, r=95)
    b.pill(85.0, 630.0, "Be not deceived", 11, 31)
    b.block(85.0, 676.0, 240,
            "“Be not deceived; God is not mocked: for whatsoever a man soweth, that shall he also reap.” "
            "— Galatians 6:7", SB, 11, 16, b.BLUE)
    b.pagenum()

    # ------------------------------------------------------------- 14 ch 6 --
    b.new(b.WHITE)
    b.blob("prog_grey", b.GREY, dx=-40, dy=-260)
    b.head(85.0, 76.0, ["Seven Keys To", "Sowing"], size=45, color=b.INK, leading=46, max_w=430)
    b.text(85.0, 200.0, "CHAPTER SIX", B, 9, b.BLUE, 2.4)
    b.block(85.0, 216.0, 260, "Learn them like you learned your own name, because they explain almost every outcome you will live through.")
    keys = [
        ("01", "Negative", "Sow bad, reap bad. Nobody escapes it by being sincere, well-liked or young."),
        ("02", "Positive", "Sow good, reap good. Same machinery, faithful crop."),
        ("03", "More", "You get back much more than you put out — in both directions."),
        ("04", "Many ways", "Many ways to change a life. Do not fixate on the one door you are angry at."),
        ("05", "Anyone can", "The question was never can. It is will."),
        ("06", "You can still lose", "Sometimes you do it right and lose. Be ready; do not be bitter."),
        ("07", "No sow, no reap", "Not a smaller harvest — no harvest at all."),
    ]
    y = 270.0
    for n, h, t in keys:
        b.c.setFillColor(b.ORANGE)
        b.c.roundRect(85.0, b.Y(y + 40), 30, 30, 6, stroke=0, fill=1)
        b.text(92.5, y + 20, n, B, 11, b.WHITE)
        b.text(128.0, y + 13, h, B, 13, b.INK)
        b.text(128.0, y + 29, t, R, 10, b.BODY)
        b.hairline(85.0, 515.0, y + 48, b.BLUE, 0.5)
        y += 62
    b.block(85.0, 736.0, 420, "Don't try to beat the law. You might as well sit on the sun to keep it from coming up.",
            SB, 11, 15, b.BLUE)
    b.pagenum()

    # ------------------------------------------------------------- 15 ch 7 --
    b.new(b.WHITE)
    b.head(85.0, 76.0, ["The Seed Already"], size=45, color=b.INK, max_w=430)
    b.head(85.0, 141.0, ["In Your Hand"], size=45, color=b.INK, max_w=430)
    b.text(85.0, 226.0, "CHAPTER SEVEN", B, 9, b.BLUE, 2.4)
    b.block(85.0, 244.0, 250,
            "You may be reading this with very little: no salary, no title, no platform, a rented room and a phone with "
            "a cracked screen. Good. The law of sowing does not require capital — it requires seed, and you already have some.")
    y = 330.0
    for lab, txt in [("Time", "The most honest seed you own."),
                     ("Words", "Encouragement sown in private returns as courage in public."),
                     ("Work", "Excellence in an unglamorous task is seed in the ground."),
                     ("Money", "However small. Generosity is the only thing you can give away and keep."),
                     ("Attention", "What you study becomes what you can carry for others."),
                     ("Presence", "Showing up for people who cannot repay you.")]:
        y = b.icon_bullet(85, y, lab, txt, 250) + 4
    b.photo(os.path.join(IMG, "06-maize-farmer.jpg"), 362, b.Y(560.0), 172, 250)
    b.pill(85.0, y + 10, "Sow in the field you can see", 11, 31)
    b.block(85.0, y + 58, 250,
            "“He which soweth sparingly shall reap also sparingly; and he which soweth bountifully shall reap also "
            "bountifully.” — 2 Corinthians 9:6", SB, 11, 16, b.BLUE)
    b.pagenum()

    # ------------------------------------------------------------- 16 ch 8 --
    b.new(b.WHITE)
    b.head(85.0, 80.0, ["Thirty Days"], size=45, color=b.INK, max_w=430)
    b.head(85.0, 145.0, ["Of Sowing"], size=45, color=b.INK, max_w=430)
    b.text(85.0, 232.0, "CHAPTER EIGHT", B, 9, b.BLUE, 2.4)
    b.block(85.0, 250.0, 260,
            "A law you agree with changes nothing. A law you practise changes everything. One month, small enough to finish.")
    weeks = [
        ("Week 1", "Sow in your walk with God", "Fifteen minutes a day in Scripture and prayer. Same chair, no phone."),
        ("Week 2", "Sow in your body", "Three sessions of movement, one earlier night, one honest meal plan."),
        ("Week 3", "Sow in a person", "Four hours given to somebody younger or needier than you."),
        ("Week 4", "Sow in your craft", "Forty-five minutes a day on the thing you want to be excellent at. Doing it."),
    ]
    y = 320.0
    for lab, h, t in weeks:
        b.pill(85.0, y, lab, 11, 31)
        b.text(196.0, y + 10, h, B, 12, b.INK)
        y = b.block(196.0, y + 20, 320, t, R, 10, 13.2) + 14
    b.pill(85.0, y + 10, "Grade yourself on days sown", 11, 31)
    b.block(85.0, y + 58, 430,
            "Results are God's department; sowing is yours. Keep the book open on a table for thirty days and write one "
            "line a day. A law you agree with changes nothing — a law you practise changes everything.", R, 10, 13.4)
    b.photo(os.path.join(IMG, "02-leap.jpg"), 85, b.Y(770.0), 430, 60) if False else None
    b.pagenum()

    # ---------------------------------------------------------- 17 tracker ---
    b.new(b.WHITE)
    b.head(85.0, 80.0, ["My Thirty Days"], size=40, color=b.INK)
    b.text(85.0, 150.0, "MY THIRTY DAYS", B, 9, b.BLUE, 2.4)
    b.block(85.0, 166.0, 430, "One line a day. Grade yourself on days sown, not on results.")
    hdrs = ["Day", "What I sowed", "What I noticed"]
    xs = [85.0, 140.0, 330.0]
    b.c.setFillColor(b.BLUE)
    b.c.rect(85.0, b.Y(212.0), 430, 22, stroke=0, fill=1)
    for x, hh in zip(xs, hdrs):
        b.text(x + 6, 207.0, hh.upper(), B, 8, b.WHITE)
    for r in range(30):
        yy = 232.0 + r * 17.2
        b.hairline(85.0, 515.0, yy, b.GREY, 0.7)
        b.text(91.0, yy + 13, "%02d" % (r + 1), "R", 8.6, b.BLUE)
    for x in xs[1:]:
        b.c.setStrokeColor(b.GREY)
        b.c.setLineWidth(0.7)
        b.c.line(x - 8, b.Y(232.0), x - 8, b.Y(232.0 + 30 * 17.2))
    b.pagenum()

    # ------------------------------------------------------------ 18 charge --
    b.new(b.BLUE)
    b.blob("close_green", b.GREEN, dx=-90, dy=-160, sx=0.9, sy=0.9)
    b.roundphoto(os.path.join(IMG, "03-starting-blocks.jpg"), 61, 300, 230, 300, r=100)
    b.text(345.0, 120.0, "From The Ministry Desk", R, 15, b.WHITE)
    b.head(345.0, 140.0, ["Don't Let", "The Springs", "Pass"], size=32, leading=38, color=b.WHITE, max_w=196)
    b.text(61.0, 110.0, "CHRISCO YOUTH AFLAME", B, 9.5, b.WHITE, 3.0)
    b.block(61.0, 128.0, 210,
            "Life is brief — not depressing, brief. The year you are in will pass whether or not you plant anything "
            "in it, and it will not come back to be used properly.", R, 9.4, 12.8, b.WHITE)
    b.block(61.0, 646.0, 470,
            "Take a new inventory of yourself. Make sure all of your talent, your mind, your faith and your courage are "
            "being used. Otherwise you lose. It is a law. Then go and sow — not tomorrow, not after the exams, the "
            "wedding or the salary. Now, with what you have, in the field you can see.", R, 10, 13.6, b.WHITE)
    b.text(61.0, 730.0, "CHRISCO Fellowship of Churches · A Ministry of CHRISCO Youth Aflame", B, 9.5, b.WHITE)
    b.pagenum_white()

    # ------------------------------------------------------------ 19 prayer --
    b.new(b.WHITE)
    b.head(85.0, 80.0, ["A Prayer"], size=45, color=b.INK, max_w=430)
    b.head(85.0, 145.0, ["To Close"], size=45, color=b.INK, max_w=430)
    b.text(85.0, 232.0, "COMMISSIONING", B, 9, b.BLUE, 2.4)
    y = b.block(85.0, 262.0, 430,
                "Father, thank You for what You have placed in my hands. Show me what I have buried, and give me the "
                "courage to dig it up. Teach me to sow where I am, with what I have, while I still can. Make my life a "
                "field and not a warehouse. In the name of Jesus, amen.", SB, 13, 21)
    b.text(85.0, y + 40, "“They that sow in tears shall reap in joy.” — Psalm 126:5", SB, 12, b.BLUE)
    # blue contact-style block
    b.c.setFillColor(b.BLUE)
    b.c.rect(0, 0, PW, b.Y(576.0), stroke=0, fill=1)
    b.text(70.0, 640.0, "Go And Sow", B, 21, b.WHITE)
    cols = [("Where", "Home · Church · School · Work"),
            ("What", "Time · Words · Work · Money"),
            ("When", "Today, not next week")]
    for i, (lab, val) in enumerate(cols):
        x = 70.0 + i * 165
        b.text(x, 700.0, lab, R, 9.5, b.WHITE)
        b.text(x, 718.0, val, B, 10.5, b.WHITE)
    b.text(70.0, 770.0, "CHRISCO Youth Aflame · A Ministry of CHRISCO Fellowship of Churches", B, 10, b.WHITE)
    b.pagenum()

    # ------------------------------------------------------------- 20 notes --
    b.new(b.WHITE)
    b.head(85.0, 80.0, ["Notes"], size=45, color=b.INK)
    b.text(85.0, 150.0, "NOTES & RESOLUTIONS", B, 9, b.BLUE, 2.4)
    for r in range(24):
        b.hairline(85.0, 515.0, 190.0 + r * 24.0, b.GREY, 0.8)
    b.pagenum()

    # ----------------------------------------------------------- 21 credits --
    b.new(b.WHITE)
    b.head(85.0, 80.0, ["Credits And", "Acknowledgements"], size=40, color=b.INK, leading=42, max_w=430)
    b.text(85.0, 214.0, "BOOK ONE", B, 9, b.BLUE, 2.4)
    y = b.block(85.0, 236.0, 210,
                "UNUSED IS LOST is Book One of the CHRISCO Youth Aflame library, a ministry of CHRISCO Fellowship of "
                "Churches, written for young people roughly fifteen to thirty and the adults who refuse to give up on them.", R, 9.2, 12.6)
    b.block(85.0, y + 8, 210,
            "The two laws are set out in a talk by Jim Rohn on basic laws taken from Scripture. This is an original work "
            "in our own words — not a transcript, not an authorised edition. Scripture: King James Version (public domain).", R, 9.2, 12.6)
    b.text(320.0, 236.0, "Photography", B, 11, b.INK)
    creds = [("Campfire at night", "Unsplash · _wR0kpSkt9A"),
             ("Leap at sunset", "Unsplash · fMIsAL72P3U"),
             ("Starting blocks", "Unsplash licence"),
             ("Choir in light", "Pexels · 7520355"),
             ("Maize farmer, Kenya", "The Habari Network"),
             ("Wheat field at dusk", "Unsplash licence")]
    yy = 254.0
    for n, s in creds:
        b.text(320.0, yy, n, B, 9, b.INK)
        b.text(320.0, yy + 10, s, R, 8.6, b.BLUE)
        yy += 30
    b.block(320.0, yy + 2, 205, "No AI-generated imagery is used anywhere in this book.", R, 8.4, 11.6, b.INK)
    b.text(85.0, 700.0, "CHRISCO Youth Aflame · A Ministry of CHRISCO Fellowship of Churches", B, 9.5, b.BLUE)
    b.text(85.0, 716.0, "First edition · Book One of the Aflame Library", R, 9, b.INK)
    b.pagenum()

    # ---------------------------------------------------------- 22 colophon --
    b.new(b.BLUE)
    b.blob("close_orange", b.ORANGE, sx=0.55, sy=0.55, dx=395, dy=470)
    b.head(85.0, 300.0, ["Unused", "is lost."], size=58, color=b.WHITE, leading=60, max_w=430)
    b.head(85.0, 430.0, ["Sown", "is not."], size=58, color=b.GREEN, leading=60, max_w=430)
    b.text(85.0, 640.0, "CHRISCO YOUTH AFLAME", B, 10, b.WHITE, 4.0)
    b.text(85.0, 660.0, "A Ministry of CHRISCO Fellowship of Churches", R, 10, b.WHITE)

    b.c.showPage()
    b.c.save()
    return b.page_no


if __name__ == "__main__":
    out = os.path.join(BOOK_DIR, "unused-is-lost.pdf")
    n = build(out)
    print("wrote", out, "pages", n)
