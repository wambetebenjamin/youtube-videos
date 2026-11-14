# Unused Is Lost — Book One

**CHRISCO Youth Aflame · A Ministry of CHRISCO Fellowship of Churches**

Built to the **SCHOOL BOOK** template (`library/design-references/school-prospectus-22pp.pdf`) — same page
size, palette, type scale, page furniture and organic shape system. Nothing about the layout was invented;
the template's page types were re-used and its copy replaced.

## Files

| File | What it is |
|---|---|
| `unused-is-lost.pdf` | The interior, 22 pages, A4, colour. |
| `unused-is-lost.docx` | Editable manuscript of the same text (not the designed layout). |
| `book.md` | The manuscript in Markdown. |
| `images/` | The six photographs used in the interior. |

Rebuild:

```bash
python3 scripts/build_book.py --all      # pdf + docx + md
python3 scripts/book_template.py         # pdf only
```

* `scripts/book_template.py` — the layout. One function per template page type.
* `scripts/book_content.py` — the manuscript text.
* `brand/template-shapes.json` — the template's organic shapes, extracted from the source PDF and re-used
  for the blue fields, squiggles and photo windows.

## How it maps to the template

| Template page | Book page |
|---|---|
| Cover (blue field, photo, wordmark, big white display type) | 1 · Cover |
| Table of Contents (blue, hairline rows, numbers right) | 2 · Contents |
| Welcome To … (photo, blue field, welcome line, body) | 3 · Welcome / Foreword |
| Our Vision / Our Mission / Core Values | 4 · Vision, Mission, Core Values |
| At A Glance (blue, photo blob, orange pill, stat blocks) | 5 · The Two Laws At A Glance |
| Our Programs (blue band, 3-photo strip, pill, icon bullets) | 6 · Part One, 7 · Ch 1, 8 · Ch 2 |
| Program spread (sub-head, photos, pill, star bullets) | 9 · Ch 3, 12 · Part Two, 13 · Ch 5 |
| Numbered benefits (orange circles, two columns) | 10 · Ch 4 worksheet, 14 · Ch 6 keys |
| Requirements / list page | 11 · Interlude, 15 · Ch 7, 16 · Ch 8 |
| Important Dates (orange pills + text rows) | 17 · My Thirty Days |
| Contact block (blue field, white columns) | 19 · Prayer & commissioning |
| Principal's Desk (blue, photo window, letter) | 18 · Charge |
| Page numbers bottom-left, 10 pt bold | all pages |

## Design system (taken from the template)

* Page 595.5 × 842.25 pt (A4).
* Blue `#2a49f2`, orange `#fa6704`, green `#67cf4e`, light blue `#5d81ec`, grey `#ececec`, white.
* Type: bold grotesque for display 45 pt (section), 21 pt (sub-head), 14 pt (card head); body 10/13.6;
  list rows 12; page number 10 bold. DejaVu Sans stands in for the template's Anantason, which is not
  available under a free licence.
* Blue field with a wavy lower edge, photos in rounded/organic windows with torn-paper wedge cuts,
  orange pill labels, star icon bullets, hairline rules.

## Photography — licence record

Real photographs only — no watermarks, no AI generation.

| File | Subject | Source | Licence |
|---|---|---|---|
| `01-flame-night.jpg` | Campfire at night | Unsplash | Unsplash Licence |
| `02-leap.jpg` | Silhouetted leap at sunset | Unsplash | Unsplash Licence |
| `03-starting-blocks.jpg` | Athlete in starting blocks | Unsplash | Unsplash Licence |
| `04-worship-light.jpg` | Choir in sunbeams | Pexels | Pexels Licence |
| `06-maize-farmer.jpg` | Maize farmer, Kenya | The Habari Network | Editorial credit |
| `07-harvest-field.jpg` | Wheat field at dusk | Unsplash | Unsplash Licence |

Both the Unsplash and Pexels licences permit free commercial use without attribution; credit is given
in the book anyway.

## Source

Written in response to the transcript in `library/transcripts/law-of-use-and-sowing-reaping-ep01.txt`
(a talk by Jim Rohn on two "basic laws"). Original text in our own words — not a transcript, not an
authorised edition. Scripture: King James Version (public domain).
