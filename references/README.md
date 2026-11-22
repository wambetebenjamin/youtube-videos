# references/

Vendored or inspected reference implementations for free image → video.

- Do **not** commit large weights/videos here.
- For quick study without cloning the full repos, see `../REFERENCE.md`.

## How to fetch the reference repos (optional, on-demand)

```bash
# Only when you need to read the actual code:
mkdir -p references
curl -L -o /tmp/free-video-generator.zip https://codeload.github.com/uglylee/free-video-generator/zip/refs/heads/main
unzip -q /tmp/free-video-generator.zip -d references/
mv references/free-video-generator-main references/free-video-generator

curl -L -o /tmp/agnes-video-generator.zip https://codeload.github.com/lcy362/agnes-video-generator/zip/refs/heads/main
unzip -q /tmp/agnes-video-generator.zip -d references/
mv references/agnes-video-generator-main references/agnes-video-generator
```

Then inspect:
- `references/free-video-generator/src/` — API handlers + upload component to copy pattern from
- `references/agnes-video-generator/` — how it structures image upload → render polling

The JS Gradio path (Wan2.2 / LTX) needs no vendoring — just `npm i @gradio/client` (already added) and `scripts/image-to-video.mjs`.
