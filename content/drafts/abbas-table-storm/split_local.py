#!/usr/bin/env python3
"""split_takes.py, with the silence threshold this voice actually needs.

The shared tool looks for pauses at -40 dB. That is right for a close-mic'd studio read; this
generative voice has a noise floor, and at -40 dB nothing in the take counts as silence, so the
splitter gives up with "only 11 pauses for 15 lines". Measured on T03: -40 dB finds 0 pauses,
-25 dB finds every one of them. So the threshold is set per project here instead of being changed
in the shared engine, and `tools/` is untracked so this is where it has to live to survive a clone.

  python3 content/drafts/abbas-table-storm/split_local.py
"""
import pathlib
import sys

HERE = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent.parent.parent / "tools" / "cinematic-skill" / "skills"
                       / "cinematic-film" / "scripts"))

import split_takes  # noqa: E402

split_takes.NOISE_DB = -18
split_takes.MIN_SIL = 0.16

if __name__ == "__main__":
    sys.argv = ["split_takes", "--project", str(HERE)]
    split_takes.main()
