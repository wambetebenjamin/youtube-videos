"""The look of the long edition: full-bleed photographs, and scripture set like a book page.

Two ideas, and everything here serves them.

**Pictures fill the frame.** There is no paper page, photo border or canvas anywhere in this film.
`Photo` paints an illustration edge to edge, and the camera is locked to its centre while it is on
screen. Because the still has slack on every side, a slow push-in can never pull an edge into view.

**Scripture is set, not boxed.** `Scripture` is not a rounded panel: it is a soft darkening of the
picture with the verse typeset over it in a serif face — wrapped to a measure, sized for the screen,
a hairline gold rule, the reference tracked out in small capitals beneath. There is no handwriting
and no UI chrome anywhere in this film.
"""
import pathlib

import numpy as np
import skia
from PIL import Image

from engine import Item, draw_text, paint, ramp, ease_in_out, ease_out_cubic

PHOTO_ASPECT = 16 / 9


def prepare_photos(src_dir, prep_dir, quality=93, frame_w=1920):
    """Scale the plates to exactly one frame wide, and sharpen them for it.

    The generator returns about 1376 px across; a full-frame picture at 1080p is 1920. Left alone
    the renderer would stretch them with a bilinear filter and the result looks soft — which is the
    first thing anyone notices on a big screen. So each plate is resampled once, offline, with
    Lanczos and given a light unsharp pass at its final size. That does not invent detail, but it
    keeps the detail that is there instead of smearing it, and it costs nothing at render time.
    """
    from PIL import ImageFilter

    src_dir, out = pathlib.Path(src_dir), pathlib.Path(prep_dir) / "art"
    out.mkdir(parents=True, exist_ok=True)
    written = []
    for p in sorted(src_dir.glob("*.jpg")) + sorted(src_dir.glob("*.png")):
        if p.stem.startswith("_"):
            continue
        im = Image.open(p).convert("RGB")
        w, h = im.size
        if w != frame_w:
            im = im.resize((frame_w, round(h * frame_w / w)), Image.LANCZOS)
        # a light unsharp: enough to restore edges, not enough to halo the detail
        im = im.filter(ImageFilter.UnsharpMask(radius=1.4, percent=58, threshold=3))
        dst = out / (p.stem + ".jpg")
        im.save(dst, quality=quality, optimize=True, progressive=True)
        written.append(dst)
    return written


class Photo(Item):
    """One illustration, edge to edge, drifting almost imperceptibly so the frame is never dead.

    `span` is the picture width in world units and is set well beyond the visible width at the
    camera's zoom. `drift` is the total push over the shot; `pan` moves the crop window laterally.
    Both only ever *shrink* the visible crop, so the picture's edge can never enter the frame.
    """

    z = 10

    def __init__(self, key, x, y, span, t_in, t_out=None, drift=0.06, pan=(0.0, 0.0),
                 seed=1, fade_in=1.1, z=None, sfx=True):
        super().__init__(t_in, t_out, z, sfx)
        self.fade_in = fade_in
        self.key, self.x, self.y, self.span = key, x, y, span
        self.h = span / PHOTO_ASPECT
        self.drift, self.pan = drift, pan
        rng = np.random.default_rng(seed)
        self.specks = [(float(rng.uniform(0, 1)), float(rng.uniform(0, 1)),
                        float(rng.uniform(1.2, 3.2)), float(rng.uniform(0.04, 0.13)))
                       for _ in range(40)]

    def bounds(self, res):
        r = max(self.span, self.h) * 0.75
        return skia.Rect.MakeLTRB(self.x - r, self.y - r, self.x + r, self.y + r)

    def draw(self, c, res, t):
        # dissolve in and out: pictures are full-bleed and share the frame, so the change from one
        # to the next is a cross-fade in place, never a pan across the background between them
        a = ramp(t, self.t_in, self.fade_in) * self.fade(t)
        if a <= 0:
            return
        img = res.photo(f"art/{self.key}.jpg")

        life = max(0.001, (self.t_out or (t + 8.0)) - self.t_in)
        u = ease_in_out(ramp(t, self.t_in, life))
        s = 1.0 + self.drift * u
        cx = self.x + self.pan[0] * self.span * (u - 0.5)
        cy = self.y + self.pan[1] * self.span * (u - 0.5)

        W, H = self.span * s, self.h * s
        # src rect must be given explicitly, or Skia draws the bitmap at its own pixel size
        src = skia.Rect.MakeLTRB(0, 0, float(img.width()), float(img.height()))
        c.drawImageRect(img, src,
                        skia.Rect.MakeLTRB(cx - W / 2, cy - H / 2, cx + W / 2, cy + H / 2),
                        skia.SamplingOptions(skia.FilterMode.kLinear, skia.MipmapMode.kLinear),
                        paint((255, 255, 255), a))

        # lens dust, fixed to the frame rather than to the picture, so it reads as a camera
        if a > 0.02:
            for fx, fy, r, al in self.specks:
                c.drawCircle(cx + (fx - 0.5) * W, cy + (fy - 0.5) * H, r,
                             paint((255, 250, 240), al * a))


def wrap(text, max_chars):
    """Greedy wrap on words — good enough for a verse, and it never breaks a word."""
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


class Scripture(Item):
    """A verse, typeset over the held picture.

    Nothing is drawn behind the words but a wide soft darkening of the picture itself, so the
    illustration stays visible underneath and the verse sits *in* the image rather than on a panel.
    """

    z = 40

    def __init__(self, reference, text, x, y, size, t_in, t_out=None, max_chars=44,
                 rgb=(246, 241, 232), rule=(214, 196, 140), veil=0.50, z=None, sfx=False):
        super().__init__(t_in, t_out, z, sfx)
        self.reference, self.text = reference, text
        self.x, self.y, self.size = x, y, size
        self.lines = wrap(text, max_chars)
        self.rgb, self.rule, self.veil = rgb, rule, veil

    def bounds(self, res):
        r = self.size * 26
        return skia.Rect.MakeLTRB(self.x - r, self.y - r, self.x + r, self.y + r)

    def draw(self, c, res, t):
        a = ramp(t, self.t_in, 1.2) * self.fade(t)
        if a <= 0:
            return
        n = len(self.lines)
        lead = self.size * 1.26
        block_h = lead * n
        rise = (1 - ease_out_cubic(ramp(t, self.t_in, 1.5))) * self.size * 0.30

        # an ellipse of shadow, not a rectangle: a hard-edged panel is the thing being avoided
        hw = self.size * max(len(l) for l in self.lines) * 0.36 + self.size * 4
        hh = block_h * 0.85 + self.size * 3.0
        cy = self.y + rise + block_h / 2 - lead * 0.35
        c.drawOval(skia.Rect.MakeLTRB(self.x - hw, cy - hh, self.x + hw, cy + hh),
                   paint((8, 7, 6), self.veil * a, blur=self.size * 2.0))

        y = self.y + rise
        for i, ln in enumerate(self.lines):
            la = a * ramp(t, self.t_in + 0.18 + 0.22 * i, 0.55)
            draw_text(c, res, ln, self.x, y, self.size, "serif", self.rgb, la, 0.004, "center")
            y += lead

        # hairline rule and reference, only after the verse itself has landed
        ra = a * ramp(t, self.t_in + 0.3 + 0.22 * n, 0.8)
        if ra > 0:
            ry = y + self.size * 0.30
            rw = self.size * 2.1
            c.drawRect(skia.Rect.MakeLTRB(self.x - rw, ry, self.x + rw, ry + self.size * 0.030),
                       paint(self.rule, 0.95 * ra))
            draw_text(c, res, self.reference.upper(), self.x, ry + self.size * 0.46,
                      self.size * 0.28, "label", self.rgb, 0.80 * ra, 0.32, "center")


class Chapter(Item):
    """A quiet section marker, low in the frame, over the picture."""

    z = 42

    def __init__(self, text, x, y, size, t_in, t_out, z=None):
        super().__init__(t_in, t_out, z, sfx=False)
        self.text, self.x, self.y, self.size = text, x, y, size

    def bounds(self, res):
        r = len(self.text) * self.size + self.size * 8
        return skia.Rect.MakeLTRB(self.x - r, self.y - self.size * 3, self.x + r, self.y + self.size * 3)

    def draw(self, c, res, t):
        a = ramp(t, self.t_in, 1.1) * self.fade(t)
        if a <= 0:
            return
        draw_text(c, res, self.text.upper(), self.x, self.y, self.size, "label",
                  (238, 230, 218), 0.66 * a, 0.50, "center")
        c.drawRect(skia.Rect.MakeLTRB(self.x - self.size * 1.5, self.y + self.size * 0.72,
                                      self.x + self.size * 1.5, self.y + self.size * 0.80),
                   paint((214, 196, 140), 0.45 * a))


class TitleCart(Item):
    """The opening title: the words of the story, over the water, in the film's serif."""

    z = 50

    def __init__(self, title, subtitle, x, y, size, t_in, t_out, z=None):
        super().__init__(t_in, t_out, z, sfx=False)
        self.title, self.subtitle = title, subtitle
        self.x, self.y, self.size = x, y, size

    def bounds(self, res):
        r = (len(self.title) * self.size + len(self.subtitle) * self.size * 0.3) + self.size * 10
        return skia.Rect.MakeLTRB(self.x - r, self.y - self.size * 4, self.x + r, self.y + self.size * 4)

    def draw(self, c, res, t):
        a = ramp(t, self.t_in, 1.6) * self.fade(t)
        if a <= 0:
            return
        rise = (1 - ease_out_cubic(ramp(t, self.t_in, 2.0))) * self.size * 0.35
        c.drawOval(skia.Rect.MakeLTRB(self.x - self.size * 11, self.y + rise - self.size * 2.6,
                                      self.x + self.size * 11, self.y + rise + self.size * 2.6),
                   paint((8, 7, 6), 0.40 * a, blur=self.size * 2.4))
        draw_text(c, res, self.title, self.x, self.y + rise, self.size, "serif",
                  (246, 241, 232), a, 0.055, "center")
        sa = a * ramp(t, self.t_in + 1.0, 1.2)
        if sa > 0:
            ry = self.y + rise + self.size * 0.80
            c.drawRect(skia.Rect.MakeLTRB(self.x - self.size * 1.9, ry - self.size * 0.055,
                                          self.x + self.size * 1.9, ry + self.size * 0.015),
                       paint((214, 196, 140), 0.80 * sa))
            draw_text(c, res, self.subtitle.upper(), self.x, ry + self.size * 0.42,
                      self.size * 0.24, "label", (232, 224, 210), 0.85 * sa, 0.34, "center")


def install_full_res_loader():
    """Let Res.image() load a still at its real size.

    The shared engine caps every image at 1100 px on the long side, which is fine for a photo pinned
    to a board and wrong for a picture that fills the frame: at 1080p the visible crop is about
    1430 px wide, so a 1100 px source is visibly soft. Monkey-patched here rather than in the
    engine so the rest of the studio's films keep their cheaper behaviour.
    """
    import skia as _skia
    from engine import Res as _Res

    def photo(self, key, max_side=2400.0):
        slot = ("hi", key)
        if slot not in self.imgs:
            path = self.prep / key
            if not path.exists():
                raise SystemExit(f"image {key!r} not found at {path}: run prep_assets.py")
            im = Image.open(path).convert("RGBA")
            lim = int(max_side * max(self.scale, 1.0))
            if max(im.size) > lim:
                im = im.resize((round(im.width * lim / max(im.size)),
                                round(im.height * lim / max(im.size))), Image.LANCZOS)
            arr = np.ascontiguousarray(np.asarray(im))
            self.imgs[slot] = _skia.Image.fromarray(
                arr, colorType=_skia.ColorType.kRGBA_8888_ColorType).withDefaultMipmaps()
        return self.imgs[slot]

    _Res.photo = photo
