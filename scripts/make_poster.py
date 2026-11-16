#!/usr/bin/env python3
"""Render a poster to PNG + PDF with Typst (no browser, no LaTeX).

    source tools/activate-studio.sh
    python3 scripts/make_poster.py --title "From Cherry to Cup" \
        --eyebrow "YOUTUBE VIDEOS" --sub "A 12-minute documentary" \
        --out out/graphics/cherry-to-cup --format story

Formats match the duduhaibao template set: a4, social, square, story, banner, wide.
Mirror an uploaded design in templates/posters/ by editing FORMATS and the body.
"""
import argparse, pathlib, sys

FORMATS = {  # width, height in pt
    "a4":     (595, 842),
    "social": (1200, 628),
    "square": (1080, 1080),
    "story":  (1080, 1920),
    "wide":   (1920, 1080),
    "banner": (600, 1600),
}

THEME = dict(bg="#0B0B0F", fg="#F5F5F7", muted="#8B8B99", accent="#E4572E")


def build(title: str, eyebrow: str, sub: str, fmt: str) -> str:
    w, h = FORMATS[fmt]
    pad = int(w * 0.075)
    title_size = int(min(w, h) * (0.085 if fmt != "story" else 0.075))
    eyebrow_size = max(14, int(title_size * 0.26))
    sub_size = max(15, int(title_size * 0.34))
    return f'''
#set page(width: {w}pt, height: {h}pt, margin: 0pt, fill: rgb("{THEME['bg']}"))
#set text(fill: rgb("{THEME['fg']}"), font: "DejaVu Sans")

#let bar = rect(width: {int(w*0.11)}pt, height: {max(6, int(title_size*0.09))}pt, radius: 3pt, fill: rgb("{THEME['accent']}"))
#place(top + left, dx: {pad}pt, dy: {pad}pt, bar)
#place(top + left, dx: {pad}pt, dy: {pad + int(title_size*0.345)}pt, text(size: {eyebrow_size}pt, fill: rgb("{THEME['muted']}"))[{eyebrow}])
#place(top + left, dx: {pad}pt, dy: {pad + int(title_size*0.75)}pt,
   block(width: {w - pad * 2}pt, text(size: {title_size}pt, weight: "bold")[{title}]))
#place(bottom + left, dx: {pad}pt, dy: -{pad}pt,
   block(width: {w - pad * 2}pt, text(size: {sub_size}pt, fill: rgb("{THEME['muted']}"))[{sub}]))
'''


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--title", required=True)
    ap.add_argument("--eyebrow", default="")
    ap.add_argument("--sub", default="")
    ap.add_argument("--out", required=True, help="path without extension, e.g. out/graphics/poster")
    ap.add_argument("--format", default="story", choices=sorted(FORMATS))
    ap.add_argument("--ppi", type=int, default=216, help="raster resolution (216 = 3x)")
    a = ap.parse_args()

    try:
        import typst
    except ImportError:
        print("typst not installed — run: .venv/bin/pip install -r requirements.txt", file=sys.stderr)
        return 1

    src = build(a.title, a.eyebrow, a.sub, a.format).encode()
    out = pathlib.Path(a.out)
    out.parent.mkdir(parents=True, exist_ok=True)

    png_path, pdf_path = out.with_suffix(".png"), out.with_suffix(".pdf")
    png_path.write_bytes(typst.compile(src, format="png", ppi=a.ppi))
    pdf_path.write_bytes(typst.compile(src, format="pdf"))
    w, h = FORMATS[a.format]
    print(f"{a.format} {w}x{h}pt -> {png_path} @{a.ppi}ppi, {pdf_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
