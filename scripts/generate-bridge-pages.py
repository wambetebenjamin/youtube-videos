#!/usr/bin/env python3
"""Generate static Drive-to-GitHub blob bridge pages with hardcoded configs."""

from __future__ import annotations

import argparse
import json
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
TEMPLATE = ROOT / "bridge-template.html"
OUT = ROOT / "bridge-pages"

SOURCES = {
    "short1": {"id": "1wwjLigJhO5jD41AqFpvwIwGt4or39DjR", "size": 561923070},
    "short2": {"id": "1t4QC4eTs338axbvagfpRHDfpZOu9BKp5", "size": 311130185},
}


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--token-sha", required=True)
    ap.add_argument("--chunk-size", type=int, default=5 * 1024 * 1024)
    ap.add_argument("--per-page", type=int, default=10)
    ap.add_argument("--concurrency", type=int, default=4)
    ap.add_argument("--only", choices=[*SOURCES, "test-small"], default=None)
    args = ap.parse_args()

    template = TEMPLATE.read_text()
    OUT.mkdir(exist_ok=True)
    for old in OUT.glob("*.html"):
        old.unlink()

    if args.only == "test-small":
        configs = [{
            "tokenSha": args.token_sha,
            "source": SOURCES["short2"]["id"],
            "total": SOURCES["short2"]["size"],
            "chunkSize": 1024,
            "start": 0,
            "count": 2,
            "concurrency": 2,
            "label": "short2-test-small",
        }]
    elif args.only:
        name = args.only
        info = SOURCES[name]
        pages = math.ceil(info["size"] / (args.chunk_size * args.per_page))
        configs = [
            {
                "tokenSha": args.token_sha,
                "source": info["id"],
                "total": info["size"],
                "chunkSize": args.chunk_size,
                "start": p * args.per_page,
                "count": args.per_page,
                "concurrency": args.concurrency,
                "label": f"{name}-{p:03d}",
            }
            for p in range(pages)
        ]
    else:
        configs = []
        for name, info in SOURCES.items():
            pages = math.ceil(info["size"] / (args.chunk_size * args.per_page))
            for p in range(pages):
                configs.append({
                    "tokenSha": args.token_sha,
                    "source": info["id"],
                    "total": info["size"],
                    "chunkSize": args.chunk_size,
                    "start": p * args.per_page,
                    "count": args.per_page,
                    "concurrency": args.concurrency,
                    "label": f"{name}-{p:03d}",
                })

    for idx, cfg in enumerate(configs):
        content = template.replace("__CONFIG__", json.dumps(cfg, separators=(",", ":")))
        path = OUT / f"bridge-{idx:03d}-{cfg['label']}.html"
        path.write_text(content)
        print(path.relative_to(ROOT))


if __name__ == "__main__":
    main()
