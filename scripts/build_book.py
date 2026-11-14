#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Build UNUSED IS LOST (CHRISCO Youth Aflame, Book One).

Outputs, in publishing/chrisco-youth-aflame/book-01-unused-is-lost/:
    book.md              manuscript, editable
    unused-is-lost.pdf   print-ready A4 interior
    unused-is-lost.docx  editable A4 interior

Usage:  python3 scripts/build_book.py [--md] [--pdf] [--docx] [--all]
"""
from __future__ import annotations

import argparse
import html
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)

from book_content import (  # noqa: E402
    BOOK, CONTENTS, FOREWORD, PART1, CH1, CH2, CH3, CH4, CH5, CH6, CH7, CH8,
    CLOSE, CREDITS,
)

BOOK_DIR = os.path.join(ROOT, "publishing", "chrisco-youth-aflame", "book-01-unused-is-lost")
IMG_DIR = os.path.join(BOOK_DIR, "images")
FONT_DIR = os.path.join(ROOT, "publishing", "chrisco-youth-aflame", "brand", "fonts")


def img(name: str) -> str:
    return os.path.join(IMG_DIR, name)


# --------------------------------------------------------------------------- #
# text helpers
# --------------------------------------------------------------------------- #
def prep(text: str) -> str:
    """HTML entities -> unicode, then re-escape bare ampersands for reportlab."""
    t = text.replace("&amp;", "\x00")
    t = html.unescape(t)
    t = t.replace("\x00", "&amp;")
    t = re.sub(r"&(?!(amp|lt|gt|quot|apos|#\d+|#x[0-9a-fA-F]+);)", "&amp;", t)
    return t


def plain(text: str) -> str:
    return html.unescape(text)


def md(text: str) -> str:
    """Plain text with inline HTML tags converted to Markdown emphasis."""
    t = html.unescape(text)
    t = t.replace("<b>", "**").replace("</b>", "**")
    t = t.replace("<i>", "*").replace("</i>", "*")
    return t


# --------------------------------------------------------------------------- #
# PDF
# --------------------------------------------------------------------------- #
def build_pdf(out_path: str) -> dict:
    from reportlab.lib.colors import HexColor, Color
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import ParagraphStyle
    from reportlab.pdfbase import pdfmetrics
    from reportlab.pdfbase.ttfonts import TTFont
    from reportlab.pdfgen import canvas
    from reportlab.platypus import Paragraph

    pdfmetrics.registerFont(TTFont("Sans", os.path.join(FONT_DIR, "DejaVuSans.ttf")))
    pdfmetrics.registerFont(TTFont("SansB", os.path.join(FONT_DIR, "DejaVuSans-Bold.ttf")))
    pdfmetrics.registerFont(TTFont("Serif", os.path.join(FONT_DIR, "DejaVuSerif.ttf")))
    pdfmetrics.registerFont(TTFont("SerifB", os.path.join(FONT_DIR, "DejaVuSerif-Bold.ttf")))
    pdfmetrics.registerFontFamily("Serif", normal="Serif", bold="SerifB", italic="Serif", boldItalic="SerifB")
    pdfmetrics.registerFontFamily("Sans", normal="Sans", bold="SansB", italic="Sans", boldItalic="SansB")

    NAVY = HexColor("#141B4D")
    ORANGE = HexColor("#F25C2A")
    GOLD = HexColor("#F5B301")
    RED = HexColor("#C0341E")
    CREAM = HexColor("#F7F3EC")
    INK = HexColor("#20222B")
    MUTED = HexColor("#6C6F7A")
    WHITE = HexColor("#FFFFFF")
    PANEL = HexColor("#EFE8DA")

    PW, PH = A4
    M = 58.0
    TW = PW - 2 * M

    body = ParagraphStyle(
        "body", fontName="Serif", fontSize=10.2, leading=15.9, textColor=INK,
        spaceBefore=0, spaceAfter=9.0, alignment=4,
    )
    body_first = ParagraphStyle("bodyf", parent=body)
    h2 = ParagraphStyle(
        "h2", fontName="SansB", fontSize=11.5, leading=15, textColor=NAVY,
        spaceBefore=10, spaceAfter=8,
    )
    bullet = ParagraphStyle(
        "bullet", parent=body, leftIndent=16, bulletIndent=2, spaceAfter=6,
    )
    small = ParagraphStyle(
        "small", fontName="Serif", fontSize=9.4, leading=15, textColor=MUTED, alignment=4,
    )

    c = None

    state = {"page": 0, "numbers": {}, "y": 0.0, "head": ""}

    # ---------------- primitives ----------------
    def tracked(x, y, text, font, size, color, space=2.0, align="l"):
        text = str(text)
        w = c.stringWidth(text, font, size) + space * max(0, len(text) - 1)
        if align == "c":
            x -= w / 2.0
        elif align == "r":
            x -= w
        c.saveState()
        to = c.beginText(x, y)
        to.setFont(font, size)
        to.setFillColor(color)
        to.setCharSpace(space)
        to.textOut(text)
        c.drawText(to)
        c.restoreState()
        return w

    def subhead(text):
        state["y"] -= 14
        tracked(M, state["y"], plain(text).upper(), "SansB", 7.8, ORANGE, 2.4)
        state["y"] -= 22

    def bg(color=CREAM):
        c.setFillColor(color)
        c.rect(0, 0, PW, PH, stroke=0, fill=1)

    def image_cover(path, x, y, w, h, radius=None, tint=None, tint_alpha=0.0, focus=0.5):
        from PIL import Image as PILImage
        iw, ih = PILImage.open(path).size
        scale = max(w / iw, h / ih)
        dw, dh = iw * scale, ih * scale
        dx, dy = x + (w - dw) / 2.0, y + (h - dh) * focus
        c.saveState()
        p = c.beginPath()
        if radius:
            p.roundRect(x, y, w, h, radius)
        else:
            p.rect(x, y, w, h)
        c.clipPath(p, stroke=0, fill=0)
        c.drawImage(path, dx, dy, dw, dh, mask="auto")
        c.restoreState()
        if tint is not None and tint_alpha:
            c.saveState()
            c.setFillColor(Color(tint.red, tint.green, tint.blue, alpha=tint_alpha))
            if radius:
                c.roundRect(x, y, w, h, radius, stroke=0, fill=1)
            else:
                c.rect(x, y, w, h, stroke=0, fill=1)
            c.restoreState()

    def ornament(x, y, size=5, color=ORANGE):
        c.setFillColor(color)
        p = c.beginPath()
        p.moveTo(x, y + size)
        p.lineTo(x + size, y)
        p.lineTo(x, y - size)
        p.lineTo(x - size, y)
        p.close()
        c.drawPath(p, stroke=0, fill=1)

    def new_page(number=False):
        if state["page"] > 0:
            c.showPage()
        state["page"] += 1
        bg(CREAM)
        state["y"] = PH - M - 18
        if number:
            # running foot
            tracked(M, M - 22, "UNUSED IS LOST", "SansB", 6.6, MUTED, 1.8)
            tracked(PW - M, M - 22, str(state["page"]), "SansB", 7.6, NAVY, 0, "r")
            tracked(PW - M - 16, M - 22, "·", "SansB", 7.6, ORANGE, 0, "r")
        return state["page"]

    def avail():
        return state["y"] - (M + 6)

    def need(h):
        return avail() >= h

    def para(p_text, style=body):
        p = Paragraph(prep(p_text), style)
        w, h = p.wrap(TW, 10000)
        if h > avail() and h < PH - 2 * M - 140:
            cont_page()
        state["y"] -= h
        p.drawOn(c, M, state["y"])
        state["y"] -= style.spaceAfter
        return p

    def para_at(p_text, style, x, width, top_y):
        """Draw a paragraph with its top at top_y; returns new top."""
        p = Paragraph(prep(p_text), style)
        w, h = p.wrap(width, 2000)
        p.drawOn(c, x, top_y - h)
        return top_y - h - style.spaceAfter

    def cont_page():
        title = state["head"]
        new_page(number=True)
        if title:
            tracked(M, PH - M - 4, title.upper(), "SansB", 7.2, MUTED, 2.2)
            c.setStrokeColor(HexColor("#DCD3C2"))
            c.setLineWidth(0.6)
            c.line(M, PH - M - 12, PW - M, PH - M - 12)
            state["y"] = PH - M - 34

    def chapter_head(kick, title, key=None, size=27, color=NAVY, kicker_color=ORANGE):
        state["head"] = plain(title)
        if key and key not in state["numbers"]:
            state["numbers"][key] = state["page"]
        tracked(M, state["y"], plain(kick).upper(), "SansB", 8.0, kicker_color, 3.0)
        state["y"] -= 21
        # wrap big title manually
        c.setFont("SansB", size)
        words, line, lines = plain(title).split(), "", []
        for wd in words:
            test = (line + " " + wd).strip()
            if c.stringWidth(test, "SansB", size) <= TW:
                line = test
            else:
                lines.append(line)
                line = wd
        lines.append(line)
        c.setFillColor(color)
        for ln in lines:
            c.saveState()
            to = c.beginText(M, state["y"])
            to.setFont("SansB", size)
            to.setFillColor(color)
            to.setCharSpace(-0.3)
            to.textOut(ln)
            c.drawText(to)
            c.restoreState()
            state["y"] -= size * 1.14
        state["y"] -= 6
        c.setStrokeColor(ORANGE)
        c.setLineWidth(2.2)
        c.line(M, state["y"], M + 54, state["y"])
        state["y"] -= 21

    def pull_quote(text, attribution=""):
        q = ParagraphStyle("q", fontName="SerifB", fontSize=13.6, leading=20.5, textColor=NAVY)
        p = Paragraph(prep(text), q)
        w, h = p.wrap(TW - 60, 400)
        if not need(h + 60):
            cont_page()
        box_top = state["y"] - 6
        box_bot = box_top - h - 28
        c.setFillColor(HexColor("#EFE8DA"))
        c.rect(M, box_bot, TW, h + 28, stroke=0, fill=1)
        c.setFillColor(ORANGE)
        c.rect(M, box_bot, 4, h + 28, stroke=0, fill=1)
        p.drawOn(c, M + 26, box_bot + 12)
        state["y"] = box_bot - 16
        if attribution:
            tracked(M + 26, state["y"], plain(attribution).upper(), "SansB", 7, MUTED, 1.8)
            state["y"] -= 14

    def scripture(text, ref):
        q = ParagraphStyle("s", fontName="SerifB", fontSize=11.0, leading=17.6, textColor=NAVY, alignment=1)
        p = Paragraph(prep(text), q)
        w, h = p.wrap(TW - 80, 400)
        if not need(h + 70):
            cont_page()
        c.setStrokeColor(GOLD)
        c.setLineWidth(1.4)
        c.line(M + TW / 2 - 22, state["y"], M + TW / 2 + 22, state["y"])
        p.drawOn(c, M + 40, state["y"] - 20 - h)
        tracked(M + TW / 2, state["y"] - 34 - h, plain(ref).upper(), "SansB", 7.2, ORANGE, 2.2, "c")
        state["y"] -= h + 56

    def num_card(n, title, text, fs=10.0, lead=15.3):
        q = ParagraphStyle("nq", fontName="Serif", fontSize=fs, leading=lead, textColor=INK, alignment=4)
        body_txt = "<b>" + title + ".</b> " + text
        p = Paragraph(prep(body_txt), q)
        tw = TW - 66
        w, h = p.wrap(tw, 400)
        box_h = h + 20
        if not need(box_h + 7):
            cont_page()
        top = state["y"]
        c.setFillColor(HexColor("#EFE8DA"))
        c.roundRect(M, top - box_h, TW, box_h, 8, stroke=0, fill=1)
        c.setFont("SansB", 17)
        c.setFillColor(ORANGE)
        c.drawString(M + 15, top - 24, n)
        p.drawOn(c, M + 52, top - h - 10)
        state["y"] -= box_h + 14

    def bullet_list(items):
        for it in items:
            p = Paragraph(prep(it), bullet, bulletText="•")
            w, h = p.wrap(TW - 16, avail())
            if not need(h):
                cont_page()
                w, h = p.wrap(TW - 16, avail())
            p.drawOn(c, M + 16, state["y"] - h)
            state["y"] -= h + bullet.spaceAfter

    # ---------------- pages ----------------
    def page_cover():
        new_page(number=False)
        image_cover(img("01-flame-night.jpg"), 0, 0, PW, PH)
        c.setFillColor(Color(0.02, 0.04, 0.12, alpha=0.55))
        c.rect(0, 0, PW, PH, stroke=0, fill=1)
        # glow
        c.setFillColor(Color(0.949, 0.361, 0.165, alpha=0.10))
        c.circle(PW * 0.5, PH * 0.62, 250, stroke=0, fill=1)

        tracked(M, PH - 96, "CHRISCO YOUTH AFLAME", "SansB", 9.5, GOLD, 4.4)
        c.setStrokeColor(GOLD)
        c.setLineWidth(1.2)
        c.line(M, PH - 112, M + 92, PH - 112)

        y = PH - 300
        for ln in ("UNUSED", "IS LOST"):
            c.saveState()
            to = c.beginText(M, y)
            to.setFont("SansB", 62)
            to.setFillColor(WHITE)
            to.setCharSpace(-1.4)
            to.textOut(ln)
            c.drawText(to)
            c.restoreState()
            y -= 66

        c.setStrokeColor(ORANGE)
        c.setLineWidth(3)
        c.line(M, y + 20, M + 120, y + 20)

        c.setFillColor(HexColor("#F3E3C7"))
        c.setFont("Serif", 13.4)
        yy = y - 16
        for ln in ("The Law of Use and the Law of", "Sowing and Reaping"):
            c.drawString(M, yy, ln)
            yy -= 20

        ornament(M + 4, M + 78, 5, ORANGE)
        tracked(M, M + 44, "BOOK ONE  ·  THE AFLAME LIBRARY", "SansB", 8, WHITE, 2.6)
        tracked(M, M + 26, "A MINISTRY OF CHRISCO FELLOWSHIP OF CHURCHES", "SansB", 7, HexColor("#C9C4BA"), 2.0)

    def page_imprint():
        new_page(number=False)
        c.setFillColor(NAVY)
        c.rect(0, PH - 190, PW, 190, stroke=0, fill=1)
        tracked(M, PH - 82, "CHRISCO YOUTH AFLAME", "SansB", 8.6, GOLD, 4.0)
        c.setFillColor(WHITE)
        c.setFont("SansB", 25)
        c.drawString(M, PH - 122, "UNUSED IS LOST")
        c.setFillColor(HexColor("#CFCAC2"))
        c.setFont("Serif", 10.5)
        c.drawString(M, PH - 146, "The Law of Use and the Law of Sowing and Reaping")

        state["y"] = PH - 240
        para("This book belongs to:", small)
        c.setStrokeColor(HexColor("#C9BFAC"))
        c.setLineWidth(0.8)
        c.line(M, state["y"] - 6, M + TW * 0.62, state["y"] - 6)
        state["y"] -= 40

        para(BOOK["tagline"], body)
        para("A ministry of CHRISCO Fellowship of Churches, written for young people between fifteen and thirty, "
             "and for the adults who refuse to give up on them.", body)
        para("Free to read. Free to give away. Not free to ignore.", body)

        # epigraph
        ep = ParagraphStyle("ep", fontName="SerifB", fontSize=20, leading=29, textColor=NAVY, alignment=1)
        pe = Paragraph("&ldquo;Whatever you don&rsquo;t use,<br/>you lose.&rdquo;", ep)
        w, h = pe.wrap(TW, 200)
        ey = PH * 0.44
        pe.drawOn(c, M + (TW - w) / 2.0, ey)
        c.setStrokeColor(ORANGE)
        c.setLineWidth(1.6)
        c.line(PW / 2 - 20, ey - 26, PW / 2 + 20, ey - 26)
        tracked(PW / 2, ey - 46, "THE FIRST OF TWO BASIC LAWS", "SansB", 6.8, MUTED, 2.4, "c")

        # copyright block
        y0 = M + 66
        c.setStrokeColor(HexColor("#DCD3C2"))
        c.setLineWidth(0.6)
        c.line(M, y0 + 34, PW - M, y0 + 34)
        tracked(M, y0 + 16, "FIRST EDITION  ·  BOOK ONE OF THE AFLAME LIBRARY", "SansB", 6.8, MUTED, 1.8)
        c.setFont("Serif", 8.4)
        c.setFillColor(MUTED)
        c.drawString(M, y0, "© CHRISCO Youth Aflame. Scripture quotations are from the King James Version (public domain).")

    def page_contents():
        new_page(number=False)
        chapter_head("Contents", "What Is Inside", size=25)
        state["y"] = PH - M - 96
        for kick, title, key in CONTENTS:
            pg = state["numbers"].get(key, "")
            if kick:
                tracked(M, state["y"], plain(kick).upper(), "SansB", 6.6, ORANGE, 2.0)
            c.setFont("Serif", 12.2)
            c.setFillColor(NAVY)
            c.drawString(M + (0 if not kick else 74), state["y"] - 15, plain(title))
            c.setStrokeColor(HexColor("#CFC5B2"))
            c.setLineWidth(0.5)
            c.setDash(1, 3)
            c.line(M + 74 + 6 + c.stringWidth(plain(title), "Serif", 12.2), state["y"] - 12, PW - M - 22, state["y"] - 12)
            c.setDash()
            if pg:
                c.setFont("SansB", 9)
                c.setFillColor(MUTED)
                c.drawRightString(PW - M, state["y"] - 15, str(pg))
            state["y"] -= 31
        state["y"] -= 8
        c.setFillColor(HexColor("#EFE8DA"))
        c.rect(M, state["y"] - 70, TW, 66, stroke=0, fill=1)
        c.setFont("Serif", 9.6)
        c.setFillColor(INK)
        c.drawString(M + 18, state["y"] - 26, "Two laws. Learn them young and they will pay you for the rest of your life.")
        c.drawString(M + 18, state["y"] - 44, "Ignore them and they will still send the bill — only later.")

    def page_part(part, key):
        new_page(number=False)
        if key and key not in state["numbers"]:
            state["numbers"][key] = state["page"]
        image_cover(img(part["image"]), 0, 0, PW, PH)
        c.setFillColor(Color(0.03, 0.05, 0.16, alpha=0.52))
        c.rect(0, 0, PW, PH, stroke=0, fill=1)
        tracked(M, PH * 0.60, part["number"], "SansB", 9.5, GOLD, 5.0)
        c.setFillColor(WHITE)
        c.setFont("SansB", 44 if len(part["title"]) < 22 else 36)
        y = PH * 0.52
        for ln in part["title"].split("\n"):
            c.drawString(M, y, ln)
            y -= 48
        c.setStrokeColor(ORANGE)
        c.setLineWidth(3)
        c.line(M, y + 22, M + 100, y + 22)
        c.setFillColor(HexColor("#EDE2CE"))
        c.setFont("Serif", 11.4)
        yy = y - 8
        words, line = part["blurb"].split(), ""
        for wd in words:
            test = (line + " " + wd).strip()
            if c.stringWidth(test, "Serif", 11.4) <= TW - 40:
                line = test
            else:
                c.drawString(M, yy, line)
                yy -= 18
                line = wd
        c.drawString(M, yy, line)
        cap = part.get("caption", "").upper()
        while cap and c.stringWidth(cap, "SansB", 6.6) + 1.6 * len(cap) > TW - 10:
            cap = cap[:-2]
        tracked(M, M + 30, cap, "SansB", 6.6, HexColor("#BFB8AC"), 1.6)

    def page_interlude():
        new_page(number=False)
        image_cover(img("03-starting-blocks.jpg"), 0, 0, PW, PH * 0.82)
        c.setFillColor(CREAM)
        c.rect(0, 0, PW, PH * 0.18, stroke=0, fill=1)
        q = ParagraphStyle("il", fontName="SerifB", fontSize=15, leading=22, textColor=NAVY, alignment=1)
        p = Paragraph("The gun has not gone off yet.<br/>That is not a reason to stay in the blocks.", q)
        w, h = p.wrap(TW - 40, 200)
        p.drawOn(c, M + 20, PH * 0.18 - h - 6)
        tracked(M + TW / 2, PH * 0.18 - h - 34, "CHRISCO YOUTH AFLAME", "SansB", 6.6, MUTED, 2.4, "c")

    def table(headers, rows, widths, row_h=26.0, header_h=22.0):
        col_w = [TW * x for x in widths]
        total = header_h + row_h * len(rows)
        if not need(total + 10):
            cont_page()
        top = state["y"]
        c.setFillColor(NAVY)
        c.rect(M, top - header_h, TW, header_h, stroke=0, fill=1)
        c.setFont("SansB", 8.2)
        c.setFillColor(WHITE)
        x = M
        for i, htxt in enumerate(headers):
            c.drawString(x + 8, top - header_h + 7, plain(htxt).upper())
            x += col_w[i]
        y = top - header_h
        for r, row in enumerate(rows):
            if r % 2 == 0:
                c.setFillColor(HexColor("#FBF7F0"))
                c.rect(M, y - row_h, TW, row_h, stroke=0, fill=1)
            c.setStrokeColor(HexColor("#E1D8C7"))
            c.setLineWidth(0.5)
            c.line(M, y - row_h, PW - M, y - row_h)
            c.setFont("Serif", 9.2)
            c.setFillColor(INK)
            xx = M
            for i, cell in enumerate(row):
                if cell:
                    c.drawString(xx + 8, y - row_h + 8.5, str(cell))
                xx += col_w[i]
            y -= row_h
        c.setStrokeColor(NAVY)
        c.setLineWidth(0.9)
        x = M
        for i in range(len(col_w) + 1):
            c.line(x, top, x, y)
            if i < len(col_w):
                x += col_w[i]
        c.line(M, top, PW - M, top)
        state["y"] = y - 18

    def ruled_lines(n, gap=27.0):
        for _ in range(n):
            if not need(gap):
                cont_page()
            c.setStrokeColor(HexColor("#BFB49C"))
            c.setLineWidth(0.7)
            c.setDash(1, 2)
            c.line(M, state["y"] - 7, PW - M, state["y"] - 7)
            c.setDash()
            state["y"] -= gap

    def framed_image(name, caption, height):
        if not need(height + 40):
            cont_page()
        image_cover(img(name), M, state["y"] - height, TW, height, radius=10)
        state["y"] -= height + 8
        c.setFont("Serif", 8.6)
        c.setFillColor(MUTED)
        c.drawString(M, state["y"] - 4, plain(caption))
        state["y"] -= 24

    def page_notes():
        new_page(number=True)
        chapter_head("Notes", "Notes &amp; Resolutions", key="notes", size=24)
        state["y"] = PH - M - 110
        ruled_lines(22, gap=25)

    def page_credits():
        new_page(number=True)
        chapter_head("Book One", "Credits and Acknowledgements", key="credits", size=23)
        for b in CREDITS:
            if isinstance(b, str):
                para(b, small)
            elif b[0] == "h2":
                state["y"] -= 12
                tracked(M, state["y"], plain(b[1]).upper(), "SansB", 7.6, ORANGE, 2.4)
                state["y"] -= 26
            elif b[0] == "imgcredits":
                state["y"] -= 2
                for name_, source, url in b[1]:
                    if not need(20):
                        cont_page()
                    c.setFont("Serif", 9.0)
                    c.setFillColor(INK)
                    c.drawString(M, state["y"] - 9, name_)
                    c.setFillColor(MUTED)
                    c.drawRightString(PW - M, state["y"] - 9, f"{source} · {url}")
                    c.setStrokeColor(HexColor("#E6DDCB"))
                    c.setLineWidth(0.5)
                    c.line(M, state["y"] - 15, PW - M, state["y"] - 15)
                    state["y"] -= 17
                state["y"] -= 8

    # ---------------- render pass ----------------
    def render(pass1_numbers=None, path=None):
        nonlocal c
        c = canvas.Canvas(path, pagesize=A4)
        c.setTitle("Unused Is Lost")
        c.setAuthor("CHRISCO Youth Aflame")
        c.setSubject("The Law of Use and the Law of Sowing and Reaping")
        c.setCreator("CHRISCO Youth Aflame")
        state["page"] = 0
        state["head"] = ""
        state["numbers"] = dict(pass1_numbers or {})
        state["y"] = PH - M
        page_cover()
        page_imprint()
        page_contents()

        # foreword
        new_page(number=True)
        chapter_head("Foreword", "A Word Before You Begin", key="foreword")
        framed_image("04-worship-light.jpg", "Worship is the first place a gift is either used or shelved.", 138)
        for b in FOREWORD:
            if isinstance(b, str):
                para(b, body)
            elif b[0] == "h2":
                subhead(b[1])
            elif b[0] == "list":
                bullet_list(b[1])

        page_part(PART1, "pt1")

        # ch1
        new_page(number=True)
        chapter_head(CH1["kick"], CH1["title"], key="ch1")
        for b in CH1["blocks"]:
            if isinstance(b, str):
                para(b)
            elif b[0] == "pull":
                pull_quote(b[1], b[2] if len(b) > 2 else "")

        # ch2
        new_page(number=True)
        chapter_head(CH2["kick"], CH2["title"], key="ch2")
        para(CH2["intro"])
        for n, t, txt in CH2["items"]:
            num_card(n, t, txt)
        state["y"] -= 4
        para(CH2["outro"])

        # ch3
        new_page(number=True)
        chapter_head(CH3["kick"], CH3["title"], key="ch3")
        for b in CH3["blocks"]:
            if isinstance(b, str):
                para(b)
            elif b[0] == "pull":
                pull_quote(b[1])

        # ch4
        new_page(number=True)
        chapter_head(CH4["kick"], CH4["title"], key="ch4", size=24)
        para(CH4["intro"])
        table(*CH4["table"], row_h=33, header_h=22)
        state["y"] -= 2
        para("Be specific. &ldquo;Encouragement&rdquo; is not an entry; &ldquo;texted three people who were struggling, "
             "twice a week&rdquo; is an entry.", small)

        new_page(number=True)
        state["head"] = "Take a New Inventory of Yourself"
        tracked(M, PH - M - 4, "TAKE A NEW INVENTORY OF YOURSELF", "SansB", 7.2, MUTED, 2.2)
        c.setStrokeColor(HexColor("#DCD3C2"))
        c.setLineWidth(0.6)
        c.line(M, PH - M - 12, PW - M, PH - M - 12)
        state["y"] = PH - M - 46
        tracked(M, state["y"], "THREE QUESTIONS", "SansB", 9, ORANGE, 3.0)
        state["y"] -= 30
        for i, pr in enumerate(CH4["prompts"]):
            pobj = Paragraph(prep(pr), ParagraphStyle("pr", fontName="SansB", fontSize=10.0, leading=14.6, textColor=NAVY))
            w, h = pobj.wrap(TW, 100)
            pobj.drawOn(c, M, state["y"] - h)
            state["y"] -= h + 17
            ruled_lines(4, gap=28)
            state["y"] -= 30
        para(CH4["outro"])

        page_interlude()
        page_part({"number": "PART TWO",
                   "title": "The Law of Sowing\nand Reaping",
                   "blurb": "You are not waiting on a harvest. You are still choosing the seed.",
                   "image": "07-harvest-field.jpg",
                   "caption": "Whatever you are reaping is what you have sown."}, "pt2")

        # ch5
        new_page(number=True)
        chapter_head(CH5["kick"], CH5["title"], key="ch5")
        for b in CH5["blocks"]:
            if isinstance(b, str):
                para(b)
            elif b[0] == "pull":
                pull_quote(b[1])
            elif b[0] == "scripture":
                scripture(b[1], b[2])

        # ch6
        new_page(number=True)
        chapter_head(CH6["kick"], CH6["title"], key="ch6", size=24)
        para(CH6["intro"])
        for n, t, txt in CH6["items"]:
            num_card(n, t, txt, fs=9.8, lead=15.0)
        state["y"] -= 4
        para(CH6["outro"])

        # ch7
        new_page(number=True)
        chapter_head(CH7["kick"], CH7["title"], key="ch7", size=24)
        for b in CH7["blocks"]:
            if isinstance(b, str):
                para(b)
            elif b[0] == "list":
                bullet_list(b[1])
            elif b[0] == "scripture":
                scripture(b[1], b[2])
            elif b[0] == "img":
                framed_image(b[1], b[2], b[3])

        # ch8
        new_page(number=True)
        chapter_head(CH8["kick"], CH8["title"], key="ch8", size=25)
        para(CH8["intro"])
        for wk, title, txt in CH8["weeks"]:
            if not need(62):
                cont_page()
            c.setFillColor(HexColor("#EFE8DA"))
            c.roundRect(M, state["y"] - 58, TW, 56, 8, stroke=0, fill=1)
            tracked(M + 14, state["y"] - 18, wk, "SansB", 7.2, ORANGE, 2.2)
            c.setFont("SansB", 10.2)
            c.setFillColor(NAVY)
            c.drawString(M + 74, state["y"] - 18, plain(title))
            p = Paragraph(prep(txt), ParagraphStyle("wk", fontName="Serif", fontSize=9.3, leading=13.6, textColor=INK, alignment=4))
            w, h = p.wrap(TW - 90, 100)
            p.drawOn(c, M + 74, state["y"] - 34 - h)
            state["y"] -= 62
        state["y"] -= 6
        para(CH8["outro"])
        new_page(number=True)
        state["head"] = "Thirty Days of Sowing"
        tracked(M, PH - M - 4, "THIRTY DAYS OF SOWING", "SansB", 7.2, MUTED, 2.2)
        c.setStrokeColor(HexColor("#DCD3C2"))
        c.setLineWidth(0.6)
        c.line(M, PH - M - 12, PW - M, PH - M - 12)
        state["y"] = PH - M - 44
        tracked(M, state["y"], "MY THIRTY DAYS", "SansB", 9, ORANGE, 2.6)
        state["y"] -= 16
        para("One line a day. Do not grade yourself on results &mdash; grade yourself on days sown.", small)
        state["y"] -= 2
        table(*CH8["table"], row_h=17.6, header_h=20)

        # charge
        new_page(number=True)
        chapter_head(CLOSE["kick"], CLOSE["title"], key="close", size=26, color=RED)

        for b in CLOSE["blocks"]:
            if isinstance(b, str):
                para(b)
            elif b[0] == "pull":
                pull_quote(b[1])
            elif b[0] == "scripture":
                scripture(b[1], b[2])
            elif b[0] == "h2":
                subhead(b[1])

        # commissioning lockup
        state["y"] -= 14
        c.setStrokeColor(HexColor("#D8CDB8"))
        c.setLineWidth(0.8)
        c.line(PW / 2 - 26, state["y"], PW / 2 + 26, state["y"])
        state["y"] -= 22
        tracked(PW / 2, state["y"], "GO AND SOW", "SansB", 8.6, ORANGE, 4.0, "c")
        state["y"] -= 18
        tracked(PW / 2, state["y"], "CHRISCO YOUTH AFLAME  ·  A MINISTRY OF CHRISCO FELLOWSHIP OF CHURCHES",
                "SansB", 6.4, MUTED, 1.8, "c")

        page_notes()
        page_credits()

        # final: back cover-ish colophon page
        new_page(number=False)
        bg(NAVY)
        ornament(M + 4, PH - M - 8, 4, ORANGE)
        tracked(M, PH * 0.62, "CHRISCO YOUTH AFLAME", "SansB", 9, GOLD, 4.2)
        c.setFillColor(WHITE)
        c.setFont("SansB", 30)
        c.drawString(M, PH * 0.54, "Unused is lost.")
        c.setFont("Serif", 12)
        c.setFillColor(HexColor("#DDD6CA"))
        c.drawString(M, PH * 0.54 - 26, "Sown is not.")
        c.setStrokeColor(ORANGE)
        c.setLineWidth(2.5)
        c.line(M, M + 96, M + 90, M + 96)
        tracked(M, M + 74, "A MINISTRY OF CHRISCO FELLOWSHIP OF CHURCHES", "SansB", 6.8, HexColor("#BDB6AA"), 2.0)
        c.showPage()
        c.save()
        return dict(state["numbers"])

    tmp = out_path + ".pass1.pdf"
    numbers = render(None, tmp)
    numbers = render(numbers, out_path)
    if os.path.exists(tmp):
        os.remove(tmp)
    return numbers


# --------------------------------------------------------------------------- #
# Markdown
# --------------------------------------------------------------------------- #
def build_md(out_path: str) -> None:
    L = []
    add = L.append
    add(f"# {plain(BOOK['title'])}")
    add(f"### {plain(BOOK['subtitle'])}")
    add(f"**{BOOK['series']} · {BOOK['book_no']}**  ")
    add(f"*{BOOK['ministry']}*")
    add("")
    add("> " + plain(BOOK["tagline"]))
    add("")
    add("---")
    add("")
    add("## Contents")
    add("")
    for kick, title, key in CONTENTS:
        label = f"**{plain(kick)}** — " if kick else ""
        add(f"- {label}{plain(title)}")
    add("")
    add("---")
    add("")
    add("## Foreword: A Word Before You Begin")
    add("")
    for b in FOREWORD:
        if isinstance(b, str):
            add(md(b))
            add("")
        elif b[0] == "h2":
            add(f"### {plain(b[1])}")
            add("")
        elif b[0] == "list":
            for it in b[1]:
                add(f"- {md(it)}")
            add("")
    add("---")
    add("")
    add(f"# {PART1['number']}: {PART1['title']}")
    add("")
    add(f"> {plain(PART1['blurb'])}")
    add("")
    for ch in (CH1, CH2, CH3, CH4):
        add(f"## {plain(ch['kick']).title()} — {plain(ch['title'])}")
        add("")
        if "intro" in ch:
            add(md(ch["intro"]))
            add("")
        if "blocks" in ch:
            for b in ch["blocks"]:
                if isinstance(b, str):
                    add(md(b))
                    add("")
                elif b[0] == "pull":
                    add(f"> *{md(b[1])}*")
                    add("")
                elif b[0] == "list":
                    for it in b[1]:
                        add(f"- {md(it)}")
                    add("")
        for n, t, txt in ch.get("items", []):
            add(f"**{n}. {md(t)}** — {md(txt)}")
            add("")
        if "prompts" in ch:
            for pr in ch["prompts"]:
                add(f"- {plain(pr)}")
                add("")
        if "outro" in ch:
            add(md(ch["outro"]))
            add("")
    add("---")
    add("")
    add("# PART TWO: The Law of Sowing and Reaping")
    add("")
    for ch in (CH5, CH6, CH7, CH8):
        add(f"## {plain(ch['kick']).title()} — {plain(ch['title'])}")
        add("")
        if "intro" in ch:
            add(md(ch["intro"]))
            add("")
        if "blocks" in ch:
            for b in ch["blocks"]:
                if isinstance(b, str):
                    add(md(b))
                    add("")
                elif b[0] == "pull":
                    add(f"> *{md(b[1])}*")
                    add("")
                elif b[0] == "scripture":
                    add(f"> {md(b[1])}  ")
                    add(f"> — {md(b[2])}")
                    add("")
                elif b[0] == "list":
                    for it in b[1]:
                        add(f"- {md(it)}")
                    add("")
                elif b[0] == "img":
                    add(f"![{plain(b[2])}](images/{b[1]})")
                    add("")
        for n, t, txt in ch.get("items", []):
            add(f"**{n}. {md(t)}** — {md(txt)}")
            add("")
        for wk, title, txt in ch.get("weeks", []):
            add(f"**{wk} — {md(title)}** {md(txt)}")
            add("")
        if "outro" in ch:
            add(md(ch["outro"]))
            add("")
    add("---")
    add("")
    add(f"## {plain(CLOSE['kick']).title()} — {plain(CLOSE['title'])}")
    add("")
    for b in CLOSE["blocks"]:
        if isinstance(b, str):
            add(md(b))
            add("")
        elif b[0] == "scripture":
            add(f"> {plain(b[1])}")
            add(f"> — {plain(b[2])}", )
            add("")
        elif b[0] == "pull":
            add(f"> *{md(b[1])}*")
            add("")
        elif b[0] == "h2":
            add(f"### {plain(b[1])}")
            add("")
    add("---")
    add("")
    for b in CREDITS:
        if isinstance(b, str):
            add(md(b))
            add("")
        elif b[0] == "h2":
            add(f"### {plain(b[1])}")
            add("")
        elif b[0] == "imgcredits":
            add("| Image | Source | Reference |")
            add("|---|---|---|")
            for n_, s, u in b[1]:
                add(f"| {n_} | {s} | {u} |")
            add("")
    with open(out_path, "w", encoding="utf-8") as f:
        f.write("\n".join(L))


# --------------------------------------------------------------------------- #
# DOCX
# --------------------------------------------------------------------------- #
def build_docx(out_path: str) -> None:
    from docx import Document
    from docx.enum.section import WD_SECTION
    from docx.enum.text import WD_ALIGN_PARAGRAPH
    from docx.shared import Cm, Pt, RGBColor

    NAVY = RGBColor(0x14, 0x1B, 0x4D)
    ORANGE = RGBColor(0xF2, 0x5C, 0x2A)
    MUTED = RGBColor(0x6C, 0x6F, 0x7A)

    doc = Document()
    sec = doc.sections[0]
    sec.page_width, sec.page_height = Cm(21.0), Cm(29.7)
    for attr in ("left_margin", "right_margin"):
        setattr(sec, attr, Cm(2.4))
    sec.top_margin, sec.bottom_margin = Cm(2.2), Cm(2.2)

    st = doc.styles["Normal"]
    st.font.name = "Georgia"
    st.font.size = Pt(11)
    st.paragraph_format.space_after = Pt(8)
    st.paragraph_format.line_spacing = 1.25

    def head(text, size=26, color=NAVY):
        p = doc.add_paragraph()
        r = p.add_run(text)
        r.font.size = Pt(size)
        r.font.bold = True
        r.font.color.rgb = color
        r.font.name = "Arial"
        p.paragraph_format.space_before = Pt(6)
        p.paragraph_format.space_after = Pt(10)

    def kick(text):
        p = doc.add_paragraph()
        r = p.add_run(text.upper())
        r.font.size = Pt(8)
        r.font.bold = True
        r.font.color.rgb = ORANGE
        r.font.name = "Arial"
        p.paragraph_format.space_after = Pt(2)

    def body(text_, italic=False, size=11, color=None):
        p = doc.add_paragraph()
        r = p.add_run(plain(text_))
        r.italic = italic
        r.font.size = Pt(size)
        if color:
            r.font.color.rgb = color
        return p

    def picture(name, width_cm=15.6, caption=""):
        doc.add_picture(img(name), width=Cm(width_cm))
        doc.paragraphs[-1].alignment = WD_ALIGN_PARAGRAPH.CENTER
        if caption:
            p = doc.add_paragraph()
            r = p.add_run(caption)
            r.italic = True
            r.font.size = Pt(8.5)
            r.font.color.rgb = MUTED
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER

    # title page
    kick(BOOK["series"] + " · " + BOOK["book_no"])
    head(BOOK["title"], 34)
    body(BOOK["subtitle"], size=13, color=NAVY)
    body(BOOK["ministry"], size=10, color=MUTED)
    body(BOOK["tagline"], italic=True)
    picture("01-flame-night.jpg", 12.0)
    doc.add_page_break()

    # contents
    kick("Contents")
    head("What Is Inside", 22)
    for k, t, _ in CONTENTS:
        p = doc.add_paragraph()
        if k:
            r = p.add_run(k.upper() + "  ")
            r.font.size = Pt(8)
            r.font.bold = True
            r.font.color.rgb = ORANGE
            r.font.name = "Arial"
        r2 = p.add_run(t)
        r2.font.size = Pt(11.5)
        p.paragraph_format.space_after = Pt(4)
    doc.add_page_break()

    kick("Foreword")
    head("A Word Before You Begin", 22)
    picture("04-worship-light.jpg", 15.6, "Worship is the first place a gift is either used or shelved.")
    for b in FOREWORD:
        if isinstance(b, str):
            body(b)
        elif b[0] == "h2":
            head(b[1], 13)
        elif b[0] == "list":
            for it in b[1]:
                doc.add_paragraph(plain(it), style="List Bullet")
    doc.add_page_break()

    head(PART1["number"] + " · " + PART1["title"], 24)
    body(PART1["blurb"], italic=True, size=12, color=NAVY)
    picture("02-leap.jpg", 15.6, PART1["caption"])
    doc.add_page_break()

    def chapter(ch, with_items=False, with_weeks=False, extra_table=False):
        kick(ch["kick"])
        head(ch["title"], 22)
        if "intro" in ch:
            body(ch["intro"])
        for b in ch.get("blocks", []):
            if isinstance(b, str):
                body(b)
            elif b[0] == "pull":
                p = doc.add_paragraph()
                r = p.add_run("\u201c" + plain(b[1]) + "\u201d")
                r.italic = True
                r.font.size = Pt(14)
                r.font.color.rgb = NAVY
                p.paragraph_format.left_indent = Cm(1.0)
                p.paragraph_format.space_before = Pt(6)
                p.paragraph_format.space_after = Pt(10)
            elif b[0] == "scripture":
                p = doc.add_paragraph()
                r = p.add_run(plain(b[1]) + " ")
                r.italic = True
                r.font.size = Pt(11)
                r2 = p.add_run("— " + plain(b[2]))
                r2.font.size = Pt(9)
                r2.font.bold = True
                r2.font.color.rgb = ORANGE
                p.paragraph_format.left_indent = Cm(0.8)
            elif b[0] == "list":
                for it in b[1]:
                    doc.add_paragraph(plain(it), style="List Bullet")
            elif b[0] == "img":
                picture(b[1], 14.0, b[2])
        for n, t, txt in ch.get("items", []):
            p = doc.add_paragraph()
            r = p.add_run(n + "  ")
            r.font.bold = True
            r.font.color.rgb = ORANGE
            r.font.size = Pt(13)
            r2 = p.add_run(plain(t))
            r2.font.bold = True
            r2.font.size = Pt(11.5)
            r2.font.color.rgb = NAVY
            body(txt, size=10.5)
        for wk, title, txt in ch.get("weeks", []):
            p = doc.add_paragraph()
            r = p.add_run(wk + "  ")
            r.font.bold = True
            r.font.size = Pt(9)
            r.font.color.rgb = ORANGE
            r2 = p.add_run(plain(title))
            r2.font.bold = True
            r2.font.size = Pt(11.5)
            r2.font.color.rgb = NAVY
            body(txt, size=10.5)
        if "prompts" in ch:
            for pr in ch["prompts"]:
                p = doc.add_paragraph()
                r = p.add_run(plain(pr))
                r.font.bold = True
                r.font.size = Pt(10)
                p.paragraph_format.space_after = Pt(18)
        if extra_table:
            headers, rows, widths = ch["table"]
            t = doc.add_table(rows=1 + len(rows), cols=len(headers))
            t.style = "Table Grid"
            for i, htxt in enumerate(headers):
                cell = t.rows[0].cells[i]
                cell.text = ""
                r = cell.paragraphs[0].add_run(htxt)
                r.font.bold = True
                r.font.size = Pt(8.5)
                r.font.color.rgb = NAVY
            for ri, row in enumerate(rows):
                for ci, val in enumerate(row):
                    t.rows[ri + 1].cells[ci].text = str(val)
        if "outro" in ch:
            body(ch["outro"])
        doc.add_page_break()

    for ch in (CH1, CH2, CH3):
        chapter(ch)
    chapter(CH4, extra_table=True)
    picture("03-starting-blocks.jpg", 14.5,
            "The gun has not gone off yet. That is not a reason to stay in the blocks.")
    doc.add_page_break()

    head("PART TWO · Sowing and Reaping", 24)
    body("You are not waiting on a harvest. You are still choosing the seed.",
         italic=True, size=12, color=NAVY)
    picture("07-harvest-field.jpg", 15.6)
    doc.add_page_break()

    for ch in (CH5, CH6, CH7):
        chapter(ch)
    chapter(CH8, extra_table=True)
    chapter(CLOSE)
    doc.add_page_break()

    kick("Book One")
    head("Credits and Acknowledgements", 22)
    for b in CREDITS:
        if isinstance(b, str):
            body(b, size=9.5, color=MUTED)
        elif b[0] == "h2":
            head(b[1], 13)
        elif b[0] == "imgcredits":
            for n_, s, u in b[1]:
                p = doc.add_paragraph()
                r = p.add_run(n_ + " — ")
                r.font.size = Pt(9)
                r2 = p.add_run(f"{s} · {u}")
                r2.font.size = Pt(9)
                r2.font.color.rgb = MUTED
    doc.save(out_path)


# --------------------------------------------------------------------------- #
def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--md", action="store_true")
    ap.add_argument("--pdf", action="store_true")
    ap.add_argument("--docx", action="store_true")
    ap.add_argument("--all", action="store_true")
    a = ap.parse_args()
    do_all = a.all or not (a.md or a.pdf or a.docx)
    os.makedirs(BOOK_DIR, exist_ok=True)

    if a.md or do_all:
        p = os.path.join(BOOK_DIR, "book.md")
        build_md(p)
        print("wrote", p)
    if a.pdf or do_all:
        p = os.path.join(BOOK_DIR, "unused-is-lost.pdf")
        nums = build_pdf(p)
        print("wrote", p, nums)
    if a.docx or do_all:
        p = os.path.join(BOOK_DIR, "unused-is-lost.docx")
        build_docx(p)
        print("wrote", p)


if __name__ == "__main__":
    main()
