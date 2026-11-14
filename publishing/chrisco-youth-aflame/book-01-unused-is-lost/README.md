# Unused Is Lost: Book One

**CHRISCO Youth Aflame · A Ministry of CHRISCO Fellowship of Churches**

Built to the **SCHOOL BOOK** template (`library/design-references/school-prospectus-22pp.pdf`): same page
size, palette, type scale, page furniture and organic shape system. Nothing about the layout was invented;
the template's page types were re-used and its copy replaced.

## Download

Click either link and the file downloads straight away.

* **PDF (the book):** <https://github.com/wambetebenjamin/youtube-videos/raw/arena/f482c0bc-youtube-videos/publishing/chrisco-youth-aflame/book-01-unused-is-lost/unused-is-lost.pdf>
* **DOCX (editable manuscript):** <https://github.com/wambetebenjamin/youtube-videos/raw/arena/f482c0bc-youtube-videos/publishing/chrisco-youth-aflame/book-01-unused-is-lost/unused-is-lost.docx>

Google Drive mirrors: PDF `1NvWcGWFh6sXkUekpV9TAdnUr0kBWZ8rR`, DOCX `1n0xbP15Bqe7tpCVHrEYZeFRejHAlKMIz`.

## Files

| File | What it is |
|---|---|
| `unused-is-lost.pdf` | The interior, 22 pages, A4, colour. |
| `unused-is-lost.docx` | Editable manuscript of the same text (not the designed layout). |
| `book.md` | The manuscript in Markdown. |
| `images/` | The twelve photographs used in the interior. |
| `../brand/pursue-logo.pdf` | The **PURSUE** mark as transparent vector art (gold on nothing, no background box). |
| `../brand/pursue-logo.png` | The same mark as a true RGBA PNG (1840 x 1600), for slides, social and the DOCX title page. |

Rebuild:

```bash
python3 scripts/build_book.py --all      # pdf + docx + md
python3 scripts/book_template.py         # pdf only
```

* `scripts/book_template.py` the layout. One block per template page type.
* `scripts/book_content.py` the manuscript text.
* `brand/template-shapes.json` the template's organic shapes, extracted from the source PDF and re-used
  for the blue fields, squiggles and photo windows.
* `scripts/pursue_logo.py` the PURSUE mark itself, drawn as vectors (`draw_mark()`), so it stays sharp at any
  size and sits on any colour with no plate behind it.

## The cover

Page one is the template's full bleed cover page, with three adjustments so the book opens like a printed
title rather than a slide:

* the flame photograph is shifted right and shaded down on its left third, which gives the mark a quiet black
  field to sit on without losing the picture;
* the hoodie wordmark from the PURSUE garment is redrawn in gold (Cinzel for the letters, Lato for the tagline)
  and set at the top of the page, on the dark part of the fire, at 150 pt wide;
* the title, subtitle, gold rule and press line run down the blue field on the same grid as the rest of the
  book.

The garment print in `library/` is a single flattened JPEG with no transparency, so it could not be lifted
out as a logo. The mark was reconstructed as vector art instead: a tapering gold ribbon that curls into an
arrowhead, a thin echo arc, the tracked wordmark and the tagline OVERTAKE · RECOVER ALL. The verse line
(1 Samuel 30:8) is available with `draw_mark(..., with_verse=True)`. Gold is `#c9a24a`, with `#8f6626` deep
and `#e4c98b` light for shading.

## House rules the interior follows

1. **No dashes.** No em or en dash appears anywhere in the text; sentences are rewritten instead.
2. **Only the template's two type families.** The template carries *Anantason Wd125 / Bold Wd125*
   (display) and *Univers LT Pro 55 Roman / 65 Bold* (body). Those embedded subsets are licence-locked
   and, more importantly, incomplete: each carries between 46 and 66 glyphs, with no punctuation and no
   K, Q, U, X, Y or Z. They cannot set a book. The interior therefore uses the closest free stand-ins in
   `brand/fonts/`: **Poppins Bold / SemiBold** for Anantason and **Lato Regular / Bold** for Univers.
   No third family sets text, and the PDF contains no DejaVu. The logo adds **Cinzel Bold**, used only for
   the five letters of the wordmark inside the mark, never for reading copy.
3. **Every photograph is real**, watermark free, cleared for commercial use, and chosen for the subject
   of the page it sits on. No image appears more than twice.

## Page by page

| Page | Template page type | Photograph |
|---|---|---|
| 1 Cover | Blue field, wavy photo, wordmark, big display | Campfire at night |
| 2 Contents | Blue, hairline rows, numbers right | none |
| 3 Welcome | Big rounded photo, blue field, display, body | Friends walking |
| 4 Vision / Mission / Core Values | Photo window, two text columns, card row | Leap at sunset, starting blocks, hands planting |
| 5 Two Laws At A Glance | Blue, wavy photo, pill, stat rows | Choir in light |
| 6 Part One | Blue band, three-photo strip, pill | Campfire, leap, starting blocks |
| 7 Ch 1 Nobody Votes On It | Blue band, photo window, star bullets | Guitar in the light |
| 8 Ch 2 Seven Things That Leak | Numbered circles, two columns | none |
| 9 Ch 3 The Servant Who Played It Safe | Blue band, photo window, star bullets | Wheat field at dusk |
| 10 Ch 4 Take A New Inventory | Worksheet table, ruled questions | none |
| 11 Interlude | Blue quote page, green squiggle | none |
| 12 Part Two | Blue band, three-photo strip, pill | Maize, wheat, seedlings |
| 13 Ch 5 Look In The Mirror | Blue band, photo window, scripture | Young man at a window |
| 14 Ch 6 Seven Keys To Sowing | Numbered squares, hairline rows | none |
| 15 Ch 7 The Seed Already In Your Hand | Display head, star bullets, photo | Maize farmer, Kenya |
| 16 Ch 8 Thirty Days Of Sowing | Display head, pills, photo window | Notebook and pen |
| 17 My Thirty Days | Thirty-row tracker | none |
| 18 A Charge | Blue, photo window, letter | Empty road at dawn |
| 19 A Prayer To Close | Blue contact block | none |
| 20 Notes | Ruled page | none |
| 21 Credits | Two columns | none |
| 22 Colophon | Blue, orange blob, closing display | none |

## Design system (taken from the template)

* Page 595.5 × 842.25 pt (A4).
* Blue `#2a49f2`, orange `#fa6704`, green `#67cf4e`, light blue `#5d81ec`, grey `#ececec`, white.
* Type: display 45 pt (section), 21 pt (sub-head), 14 pt (card head); body 10/13.6; page number 10 bold.
* Blue field with a wavy lower edge, photos in rounded/organic windows with torn-paper wedge cuts,
  orange pill labels, star icon bullets, hairline rules.

## Photography, licence record

| File | Subject | Source | Used on |
|---|---|---|---|
| `01-flame-night.jpg` | Campfire at night | Unsplash `_wR0kpSkt9A` | 1, 6 |
| `02-leap.jpg` | Leap at sunset | Unsplash `fMIsAL72P3U` | 4, 6 |
| `03-starting-blocks.jpg` | Runner in the blocks | Unsplash Licence | 4, 6 |
| `04-worship-light.jpg` | Choir in sunbeams | Pexels `7520355` | 5 |
| `06-maize-farmer.jpg` | Maize farmer, Kenya | The Habari Network (editorial credit) | 12, 15 |
| `07-harvest-field.jpg` | Wheat at dusk | Unsplash Licence | 9, 12 |
| `08-window-mirror.jpg` | Young man at a window | Unsplash `zBBlSdn6fVA` | 13 |
| `09-notebook.jpg` | Hands writing in a notebook | Pexels `17237364` | 16 |
| `10-road-dawn.jpg` | Empty road at dawn | Pexels `28202556` | 18 |
| `11-seedling-hands.jpg` | Hands planting seedlings | Unsplash `q13Zq1Jufks` | 4, 12 |
| `12-friends.jpg` | Three friends walking | Pexels `7972657` | 3 |
| `13-guitar.jpg` | Guitar in the light | Unsplash `jt8lLfH7mcw` | 7 |

Unsplash and Pexels both permit free commercial use without attribution; credit is given in the book
anyway. All files are shipped as baseline sRGB JPEG (progressive JPEGs confuse some PDF rasterisers).

## Source

Written in response to the transcript in `library/transcripts/law-of-use-and-sowing-reaping-ep01.txt`
(a talk by Jim Rohn on two "basic laws"). Original text in our own words: not a transcript, not an
authorised edition. Scripture: King James Version (public domain).
