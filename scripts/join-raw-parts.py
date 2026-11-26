#!/usr/bin/env python3
"""Reassemble byte-split Google Drive source chunks and verify their MD5 sums."""

from __future__ import annotations

import argparse
import hashlib
from pathlib import Path

EXPECTED_MD5 = {
    "short1": "0241e46dfbaba2c5c85648957297b5c8",
    "short2": "0e70c4f806baf4ecc8a8ae0012e74df0",
}


def md5(path: Path) -> str:
    digest = hashlib.md5()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def join(prefix: str, parts_dir: Path, output: Path, expected: str | None) -> None:
    parts = sorted(
        path
        for path in parts_dir.iterdir()
        if path.is_file() and path.name.startswith(prefix) and not path.name.endswith(".mp4")
    )
    if not parts:
        raise SystemExit(f"No parts found for prefix {prefix!r} in {parts_dir}")
    print(f"Joining {len(parts)} parts for {prefix}:")
    for part in parts:
        print(f"  {part.name} ({part.stat().st_size:,} bytes)")
    output.parent.mkdir(parents=True, exist_ok=True)
    with output.open("wb") as target:
        for part in parts:
            with part.open("rb") as source:
                while True:
                    chunk = source.read(4 * 1024 * 1024)
                    if not chunk:
                        break
                    target.write(chunk)
    actual = md5(output)
    print(f"Wrote {output} ({output.stat().st_size:,} bytes), MD5 {actual}")
    if expected and actual.lower() != expected.lower():
        raise SystemExit(f"MD5 mismatch for {prefix}: expected {expected}, got {actual}")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--parts-dir", type=Path, default=Path(".cache/parts"))
    parser.add_argument("--output-dir", type=Path, default=Path(".cache/raw"))
    parser.add_argument("--only", choices=sorted(EXPECTED_MD5), default=None)
    args = parser.parse_args()
    keys = [args.only] if args.only else sorted(EXPECTED_MD5)
    for key in keys:
        join(
            prefix=f"{key}.part_",
            parts_dir=args.parts_dir,
            output=args.output_dir / f"{key}.mp4",
            expected=EXPECTED_MD5[key],
        )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
