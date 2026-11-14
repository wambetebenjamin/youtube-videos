# Unused Is Lost — Book One

**CHRISCO Youth Aflame · A Ministry of CHRISCO Fellowship of Churches**

## Files

| File | What it is |
|---|---|
| `unused-is-lost.pdf` | Print-ready A4 interior, 21 pages, full colour, 5 mm bleed-free (designed to margins). Ready for print or PDF sharing. |
| `unused-is-lost.docx` | Editable A4 version of the same manuscript, for corrections and re-use. |
| `book.md` | The manuscript in Markdown — the fastest place to edit copy. |
| `images/` | The seven photographs used in the interior (plain blobs, not LFS). |

Rebuild everything with:

```bash
python3 scripts/build_book.py --all
```

`scripts/book_content.py` holds the text; `scripts/build_book.py` holds the design.

## Design

* Palette: navy `#141B4D`, aflame orange `#F25C2A`, ember gold `#F5B301`, flame red `#C0341E`, cream `#F7F3EC`.
* Type: DejaVu Sans Bold (display) and DejaVu Serif (body) — both free and open licensed.
* Structure: cover → imprint → contents → foreword → **Part One: The Law of Use** (4 chapters + worksheet) →
  **Part Two: The Law of Sowing and Reaping** (4 chapters + 30-day plan) → charge → notes → credits.
* Source design language: `library/design-references/school-prospectus-22pp.pdf` (see `../README.md`).

## Source

Written in response to the transcript in `library/transcripts/law-of-use-and-sowing-reaping-ep01.txt`
(a talk by Jim Rohn on two "basic laws"). This is an original work in our own words — not a transcript,
not an authorised edition. Scripture: King James Version (public domain).

## Photography — licence record

Every image below is a real photograph (no AI generation), carries no watermark, and is used under a
free commercial licence or with editorial credit.

| File | Subject | Source | Reference | Licence |
|---|---|---|---|---|
| `01-flame-night.jpg` | Campfire at night | Unsplash | unsplash.com/photos/_wR0kpSkt9A | Unsplash Licence |
| `02-leap.jpg` | Silhouetted leap at sunset | Unsplash | unsplash.com/photos/fMIsAL72P3U | Unsplash Licence |
| `03-starting-blocks.jpg` | Athlete in starting blocks | Unsplash | unsplash.com (Unsplash Licence) | Unsplash Licence |
| `04-worship-light.jpg` | Choir in sunbeams | Pexels | pexels.com/photo/7520355 | Pexels Licence |
| `06-maize-farmer.jpg` | Maize farmer, Kenya | The Habari Network | thehabarinetwork.com | Editorial credit |
| `07-harvest-field.jpg` | Wheat field at dusk | Unsplash | unsplash.com (Unsplash Licence) | Unsplash Licence |

Both the Unsplash Licence and the Pexels Licence permit free commercial use without attribution;
credit is given in the book anyway, as a matter of practice.

## What was rejected, and why

Many search results were stock-agency previews (iStock, Adobe Stock, Dreamstime, Shutterstock) carrying
visible watermarks, and several were AI-generated images. All were rejected on sight. Images with a
"premium"/`plus.unsplash.com` origin were also rejected, as they sit outside the free Unsplash Licence.
The rule we applied: **real photograph + free licence + no watermark, verified by eye at full size.**
