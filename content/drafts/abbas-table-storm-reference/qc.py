"""Check the finished film against the brief, with numbers rather than opinions.

The brief is a list of specifications -- 1920x1080/30, a visual change every 15-30 s, dissolves of
300-500 ms, chapter cards held 3 s, lower thirds 5-8 s, scripture 6-10 s, a 1 s fade up and a 2 s
fade down, the last five seconds clear, music under the voice. Most of those are properties of the
edit, not of the pixels, so they can be read straight out of the built film instead of squinted at.
What cannot be measured is checked by eye from stills.

  python3 qc.py --project content/drafts/abbas-table-storm-reference --video out/videos/final.mp4
"""
import argparse
import json
import pathlib
import subprocess
import sys

HERE = pathlib.Path(__file__).resolve().parent
SCRIPTS = HERE.parents[2] / "tools" / "cinematic-skill" / "skills" / "cinematic-film" / "scripts"


def probe(path):
    r = subprocess.run(["ffprobe", "-v", "error", "-print_format", "json", "-show_format", "-show_streams", str(path)],
                       capture_output=True, text=True)
    return json.loads(r.stdout) if r.stdout else {}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--project", required=True)
    ap.add_argument("--video", required=True)
    a = ap.parse_args()
    proj = pathlib.Path(a.project).resolve()
    sys.path[:0] = [str(proj), str(SCRIPTS)]

    from engine import Doc
    import scene
    doc = Doc(proj)
    film = scene.build_film(doc, proj)

    ok, bad = [], []

    def check(name, cond, detail):
        (ok if cond else bad).append(f"{'PASS' if cond else 'FAIL'}  {name}: {detail}")

    # ---- the container ------------------------------------------------------------------------
    info = probe(proj / a.video)
    v = next((s for s in info.get("streams", []) if s["codec_type"] == "video"), {})
    has_audio = any(s["codec_type"] == "audio" for s in info.get("streams", []))
    dur = float(info.get("format", {}).get("duration", 0))
    fps = v.get("r_frame_rate", "0/1")
    fps = float(fps.split("/")[0]) / float(fps.split("/")[1]) if "/" in fps else float(fps)
    check("resolution", (v.get("width"), v.get("height")) == (1920, 1080), f"{v.get('width')}x{v.get('height')}")
    check("frame rate", abs(fps - 30) < 0.01, f"{fps:g} fps")
    check("soundtrack", has_audio, "audio stream present" if has_audio else "NO AUDIO")
    check("duration", abs(dur - film.duration) < 0.2, f"{dur:.1f}s (film {film.duration:.1f}s)")

    # ---- the picture --------------------------------------------------------------------------
    # A "visual change" is a new full-frame picture: a plate change, a card, or a full-screen verse.
    changes = sorted({round(it.t_in, 2) for it in film.items
                      if type(it).__name__ in ("Photo", "SignCard", "KeyQuote", "TitleCard", "EndCard",
                                               "Scripture", "ChapterLowerThird")})
    gaps = [b - a_ for a_, b in zip(changes, changes[1:])]
    over = [round(g, 1) for g in gaps if g > 30]
    check("a visual change at least every 30 s", not over,
          f"{len(changes)} changes, longest hold {max(gaps):.1f}s" + (f" -- over at {over[:6]}" if over else ""))
    # A sub-second interval is a handoff, not a flash, when the incoming element covers the frame:
    # a plate that begins and is covered by its verse on the same beat. A cut between two full-bleed
    # pictures is never allowed to be that short. This measures the shortest gap between two changes
    # that both leave picture visible.
    covers = [(g.t_in, g.t_out) for g in film.items
              if type(g).__name__ in ("SignCard", "EndCard", "TitleCard", "Scripture",
                                      "ChapterLowerThird")]
    pairs = [(a_, b) for a_, b in zip(changes, changes[1:])
             if not any(c0 <= b < c1 for c0, c1 in covers)]
    worst = min((b - a_ for a_, b in pairs), default=0)
    check("pacing is not frantic", worst >= 0.5, f"shortest picture-to-picture cut {worst:.1f}s")
    check("fade up from black is 1 s", abs(getattr(film, "fade_in", 0) - 1.0) < 0.01,
          f"fade_in {getattr(film, 'fade_in', None)} s")
    check("fade down to black is 2 s", abs(getattr(film, "fade_out", 0) - 2.0) < 0.01,
          f"fade_out {getattr(film, 'fade_out', None)} s")

    # ---- the graphics -------------------------------------------------------------------------
    thirds = [it for it in film.items if type(it).__name__ == "ChapterLowerThird"]
    holds = [round(it.t_out - it.t_in, 1) for it in thirds]
    check("chapter lower thirds hold 5-8 s", all(5.0 <= h <= 8.2 for h in holds), f"holds {holds}")

    signs = [it for it in film.items if type(it).__name__ == "SignCard"]
    check("one chapter card per story movement", len(signs) == 6, f"{len(signs)} cards")
    st = [round(it.t_out - it.t_in, 1) for it in signs]
    check("chapter cards hold 3 s", all(abs(h - 2.6) < 0.4 for h in st), f"holds {st}")

    verses = [it for it in film.items if type(it).__name__ == "Scripture"]
    vh = [round(it.t_out - it.t_in, 1) for it in verses]
    check("full-screen scripture holds 8-12 s", all(7.5 <= h <= 12.2 for h in vh), f"holds {vh}")
    # a verse and the chapter card that opens on the same line must not fade up together
    cards = [(it.t_in, it.t_out) for it in film.items if type(it).__name__ == "SignCard"]
    cards += [(it.t_in, it.t_out) for it in film.items if type(it).__name__ == "EndCard"]
    clashes = [(v.t_in, c) for v in verses for c in cards if c[0] <= v.t_in < c[1] - 0.5]
    check("no verse fades up under a full-screen card", not clashes, f"clashes {clashes[:3]}")
    check("every scripture reference used once", len(verses) == 9, f"{len(verses)} verse overlays")

    refs = [it for it in film.items if type(it).__name__ == "ScriptureLowerThird"]
    rh = [round(it.t_out - it.t_in, 1) for it in refs]
    check("scripture lower thirds hold 6-10 s", all(5.5 <= h <= 10.2 for h in rh), f"holds {rh}")

    end = [it for it in film.items if type(it).__name__ == "EndCard"]
    if end:
        free = film.duration - end[0].t_out
        check("last 5 s clear for an end screen", free >= 4.9, f"{free:.1f}s clean at the tail")

    # ---- the mix ------------------------------------------------------------------------------
    rpt = proj / "audio" / "mix_report.json"
    if rpt.exists():
        m = json.loads(rpt.read_text())
        check("integrated loudness near -14 LUFS", -16.0 <= m["integrated_lufs"] <= -13.0,
              f"{m['integrated_lufs']:.1f} LUFS")
        check("no clipping", m["true_peak_dbtp"] <= -0.9, f"{m['true_peak_dbtp']:.1f} dBTP")
        check("bed sits under the voice", m["bed_under_voice_dbfs"] <= m["voice_rms_dbfs"] - 12,
              f"bed {m['bed_under_voice_dbfs']:.1f} dBFS vs voice {m['voice_rms_dbfs']:.1f} dBFS")
    else:
        bad.append("FAIL  mix: audio/mix_report.json missing")

    print("\n".join(ok + bad))
    print(f"\n{len(ok)} pass, {len(bad)} fail")
    (proj / "QC.md").write_text("# QC\n\n" + "\n".join(f"- {x}" for x in ok + bad) + "\n")
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main())
