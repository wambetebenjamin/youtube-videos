"""Write script.json (the format split_takes.py reads) from script2.py, and report the estimated length.

split_takes.py wants, per take, the lines with their expected text and the gap to leave after each.
The gap is what gives this edition its breathing room: a full film at the old 0.45 s between lines
read as one long breathless sentence. Here a line gets 0.55 s, a paragraph break gets nearly a
second, and the prayer is slower still — so the story unfolds at the pace it is being told, not at
the pace a machine can read it.
"""
import json
import pathlib

from script2 import TAKES

# The pause budget, measured rather than guessed.
#
# At the voice's natural rate this script takes 539 s to speak and needs about 270 s of silence to
# land near the reference's 118 wpm overall. That is a third of the film spent not speaking, and it
# is the number the "still too fast" complaint is asking for: the first edition had 79 s of pause,
# the 12:34 cut had 118, and this edition has 269.
#
# Where a movement ends, the next one starts on a held beat.
TAKE_GAP = 3.4
# A line that ends a thought (a full stop before a new subject) is given more room than a comma.
LINE_GAP = 1.85
STANZA_GAP = 2.90
PRAYER_GAP = 2.10

# lines that begin a new paragraph of the story, and so want the longer pause before them
STANZA_OPENERS = {
    "He told them about a farmer", "The afternoon went slowly", "So they left the crowd",
    "Other small boats had put out", "It came down on them all at once", "The waves beat into",
    "They bailed with whatever", "This was not weather", "They knew the weight",
    "The water was over their ankles", "Their nets were a sodden heap",
    "And in the middle of all of it", "He himself was in the stern",
    "They woke Him", "Their words come to us still wet", "And a question like that",
    "They had left their boats", "And now the water was coming in",
    "He got up", "And He rebuked the wind", "The wind dropped", "Great is the word",
    "The waves did not subside", "Imagine the next thirty seconds",
    "Now the sea is flat", "He does not say, why did you wake me",
    "Because the fear was never", "They had been in a boat", "That He might sleep",
    "Anyone who has sat up", "So now the question turns",
    "They were greatly afraid", "The first fear was", "Mark does not tell us",
    "Who then is this", "Not a lesson about storms", "And the men who were there",
    "Let us pray", "Forgive us for the ways", "Lord Jesus, You spoke",
    "And when the water is flat", "And then to ask", "The psalm says",
}  # fmt: skip


def build():
    out = {"title": "Peace, Be Still", "takes": []}
    nid = 0
    for take in TAKES:
        ls = take["lines"]
        # the pause is stored on the line *before* the gap it causes
        if "prayer" in take["take"].lower():
            stanza = PRAYER_GAP
        else:
            stanza = STANZA_GAP
        entries = []
        for i, (text, art) in enumerate(ls):
            last = i == len(ls) - 1
            if last:
                gap = TAKE_GAP
            elif any(text.startswith(o) for o in STANZA_OPENERS):
                gap = stanza
            else:
                gap = LINE_GAP
            nid += 1
            entries.append({"id": nid, "text": text, "spoken": text, "hero": art,
                            "typed": "", "gap_after": gap})
        out["takes"].append({"take": take["take"], "lines": entries})
    return out


def main():
    proj = pathlib.Path(__file__).parent
    data = build()
    (proj / "script.json").write_text(json.dumps(data, indent=1) + "\n")
    n = sum(len(t["lines"]) for t in data["takes"])
    chars = sum(len(l["text"]) for t in data["takes"] for l in t["lines"])
    gaps = sum(l["gap_after"] for t in data["takes"] for l in t["lines"])
    print(f"script.json: {len(data['takes'])} takes, {n} lines, {chars} characters")
    print(f"  pauses {gaps:.1f}s | natural read ~{(chars / 13.2 + gaps) / 60:.1f} min")


if __name__ == "__main__":
    main()
