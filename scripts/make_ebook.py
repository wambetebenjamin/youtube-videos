#!/usr/bin/env python3
"""Build a PDF ebook from Markdown chapters using pandoc -> Typst -> PDF.

No LaTeX and no Docker required, so this runs anywhere the venv exists.

    source tools/activate-studio.sh
    python3 scripts/make_ebook.py --src content/drafts/my-book \
        --out out/ebooks/my-book.pdf --title "From Cherry to Cup"

Reads every *.md in --src in filename order, so prefix chapters with numbers
(01-intro.md, 02-grow.md, ...). Style it by editing PAGE/THEME below or by
matching an uploaded design in templates/ebooks/.
"""
import argparse, pathlib, sys

PAGE = dict(width="155mm", height="235mm", margin_x="22mm", margin_y="20mm")
THEME = dict(accent="#E4572E", body="#1A1A1A", muted="#666666", rule="#D8D8D8")


def typst_document(body: str, title: str, subtitle: str) -> str:
    return f'''
#set page(width: {PAGE['width']}, height: {PAGE['height']},
  margin: (x: {PAGE['margin_x']}, y: {PAGE['margin_y']}), numbering: "1")
#set text(font: "DejaVu Serif", size: 10.5pt, lang: "en", fill: rgb("{THEME['body']}"))
#set par(justify: true, leading: 0.72em)

#show heading.where(level: 1): it => pagebreak(weak: true) + block(below: 1.2em)[
  #text(size: 20pt, weight: "bold")[#it.body]
  #v(4pt) #line(length: 40%, stroke: 1.5pt + rgb("{THEME['accent']}"))]

#show heading.where(level: 2): it => block(above: 1.1em, below: 0.6em)[
  #text(size: 13pt, weight: "bold", fill: rgb("{THEME['body']}"))[#it.body]]

#align(center)[
  #v(40mm)
  #text(size: 26pt, weight: "bold")[{title}]
  #v(8pt)
  #text(size: 12pt, fill: rgb("{THEME['muted']}"))[{subtitle}]
  #v(14pt)
  #line(length: 30%, stroke: 1.5pt + rgb("{THEME['accent']}"))
]

#pagebreak()
#outline(title: "Contents", indent: auto)
#pagebreak()

{body}
'''


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--src", required=True, help="folder of .md chapter files")
    ap.add_argument("--out", required=True, help="output .pdf path")
    ap.add_argument("--title", required=True)
    ap.add_argument("--subtitle", default="")
    a = ap.parse_args()

    try:
        import pypandoc, typst
    except ImportError:
        print("Missing deps — run: .venv/bin/pip install -r requirements.txt", file=sys.stderr)
        return 1

    src = pathlib.Path(a.src)
    chapters = sorted(p for p in src.glob("*.md") if p.is_file())
    if not chapters:
        print(f"No .md files in {src}", file=sys.stderr)
        return 1

    md = "\n\n".join(p.read_text() for p in chapters)
    # A chapter heading must start a new page, so promote each file's H1.
    body = pypandoc.convert_text(md, "typst", format="markdown")

    out = pathlib.Path(a.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    pdf = typst.compile(typst_document(body, a.title, a.subtitle).encode(), format="pdf")
    out.write_bytes(pdf)
    print(f"{len(chapters)} chapters -> {out} ({len(pdf):,} bytes)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
