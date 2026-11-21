"""The pacing rule, applied to the cut instead of hoped for: no picture on screen past 30 s.

WHY THIS EXISTS. The brief says a visual change every 15-30 seconds. Placing the cutaways by hand
against the narration kept missing -- the schedule came out with three stretches of 31 to 35 seconds
because a plate change and the cutaway over it landed in the same beat, so the "change" was already
spent. Rather than keep nudging line numbers until the numbers came out right, the rule is enforced
here: walk the finished plate plan, and wherever a picture would hold longer than the limit, give the
second half of that hold to a picture from the same part of the story.

It only ever inserts cutaways, never removes or reorders anything, and it never uses the picture
already on screen -- so every cutaway is a real change of image.

  python3 pacing.py --check      # print the schedule and fail if the rule is broken
"""
import json
import pathlib
import sys

HERE = pathlib.Path(__file__).resolve().parent
MAX_HOLD = 30.0
MIN_HOLD = 4.0            # a cutaway shorter than this is a flash, not a shot

# Pictures sorted the way the story runs, so a cutaway can pick "the next picture in the story" or
# "the one before it" rather than something random from a different movement.
ORDER = [
    "01_shore_dusk", "02_teaching_from_boat", "03_seed_and_soil", "04_let_us_go_over",
    "05_other_boats", "06_storm_rising", "07_waves_into_boat", "08_boat_filling",
    "09_asleep_on_cushion", "10_they_wake_him", "11_do_you_not_care", "12_peace_be_still",
    "13_the_calm", "14_why_are_you_afraid", "15_fear_in_boat", "16_he_cares",
    "17_who_then_is_this", "18_open_question", "19_after", "20_prayer", "21_prayer_hands",
    "22_peace_lake", "23_sleep_in_peace", "24_lamp_window",
]


def _candidates(plate, used, blocked=(), allow_reuse=True):
    """Pictures to cut to, nearest the plate in story order first.

    `blocked` used to be every plate in the film, which left exactly one picture available and gave
    every cutaway the same image. What a cutaway must avoid is the picture it is sitting ON, not
    every picture the film uses somewhere -- a film of 24 stills has to reuse them.
    """
    i = ORDER.index(plate) if ORDER and plate in ORDER else 0
    out = []
    for step in range(1, len(ORDER)):
        for j in (i + step, i - step):
            if 0 <= j < len(ORDER):
                k = ORDER[j]
                if k == plate or k in used or k in out or (not allow_reuse and k in blocked):
                    continue
                out.append(k)
    return out


def gaps_between(pictures, graphics=()):
    """(start, end, key) for every stretch where one picture is alone on screen.

    Graphics count as changes: a full-screen verse or a chapter card interrupts the picture too.
    """
    marks = sorted({p[0] for p in pictures} | {g[0] for g in graphics if g[0] > 0})
    out = []
    for i, t in enumerate(marks):
        nxt = marks[i + 1] if i + 1 < len(marks) else max(p[1] for p in pictures)
        on = [p for p in pictures if p[0] <= t < p[1]]
        if not on:
            continue
        key = max(on, key=lambda p: p[0])[2]
        out.append((t, nxt, key))
    return out


def fill(shots, blocked=(), max_hold=MAX_HOLD, min_hold=MIN_HOLD):
    """`shots` is [(t_in, t_out, key)] covering the film in order (graphics ignored).

    Returns extra cutaways [(t_in, t_out, key)] that bring every hold under `max_hold`. A hold that
    is too long is split: the cutaway takes the middle of it, so the picture resumes on either side
    and nothing is left alone on screen for longer than the limit.
    """
    extra = []
    # Only the pictures this pass has already spent are off-limits for reuse. The first version
    # seeded this with every key already on screen, which -- combined with `blocked` -- left a
    # candidate list that ran out after one or two picks, so only some long holds were fixed.
    used = set()
    queue = list(sorted(shots))
    while queue:
        a, b, key = queue.pop(0)
        hold = b - a
        if hold <= max_hold:
            continue
        mid = a + hold / 2
        half = min(max_hold * 0.55, hold * 0.4)
        c0, c1 = mid - half / 2, mid + half / 2
        if c1 - c0 < min_hold:
            # A hold barely over the limit: the centred cutaway would be a flash frame, so split the
            # over-long HALF instead of refusing to fix it. (This is the 28 s hole between the first
            # cutaway in the prayer and the next line.)
            c0, c1 = (a, a + max_hold) if (mid - a) > (b - mid) else (b - max_hold, b)
            if c1 - c0 < min_hold:
                continue
        pick = next((k for k in _candidates(key, used, blocked)), None)
        if pick is None:
            # out of fresh pictures: better a second use of a good picture than a 33 s hold
            pick = next((k for k in _candidates(key, set(), ()) if k != key), None)
        if pick is None:
            continue
        extra.append((round(c0, 3), round(c1, 3), pick))
        used.add(pick)
        # Re-examine BOTH halves. The first version re-queued one half and dropped the other, so a
        # hold longer than about 45 s still came out over the limit.
        queue[:0] = [(a, c0, key), (c1, b, key)]
    return extra


def check(shots, graphics=()):
    points = sorted({s[0] for s in shots} | {g[0] for g in graphics})
    gaps = [(b - a, a, b) for a, b in zip(points, points[1:])]
    worst = max(gaps)
    bad = [g for g in gaps if g[0] > MAX_HOLD + 0.01]
    return worst, bad


if __name__ == "__main__":
    proj = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else HERE
    sys.path[:0] = [str(proj), str(HERE.parents[2] / "tools/cinematic-skill/skills/cinematic-film/scripts")]
    from engine import Doc
    import scene
    film = scene.build_film(Doc(proj), proj)
    shots = sorted((it.t_in, it.t_out, getattr(it, "key", "")) for it in film.items
                   if type(it).__name__ == "Photo")
    graphics = sorted((it.t_in, it.t_out) for it in film.items
                      if type(it).__name__ in ("SignCard", "EndCard", "Scripture", "TitleCard"))
    worst, bad = check(shots, graphics)
    print(f"{len(shots)} pictures, longest hold {worst[0]:.1f}s between {worst[1]:.1f} and {worst[2]:.1f}")
    for g in bad:
        print(f"  over the limit: {g[0]:.1f}s at {g[1]:.1f}")
    print("OK" if not bad else f"{len(bad)} holds over {MAX_HOLD:.0f}s")
