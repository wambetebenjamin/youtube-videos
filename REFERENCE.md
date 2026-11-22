# Video Enhancement References — Free Image-to-Video

This file registers free, no-GPU, no-credit-card repositories for when we have **no raw footage** and need to turn **generated images → video**.

> Agent: when the user says "we have no raw footage" or "create image then make it video", read this file and use section 3.

## 1. Free Cloud-Backed Video Repositories (Zero API Cost)

### uglylee/free-video-generator
- **URL:** https://github.com/uglylee/free-video-generator
- **What it is:** Fully open-source AI video generator on Agnes AI free cloud — no sub, no CC, no local GPU. Supports `image-to-video`, `keyframe animation`, `multi-scene`.
- **Use in this repo:** Copy its API request handler + frontend upload component logic into `src/` or `scripts/`. Reference for building a `/references/free-video-generator/` local stub.
- **License:** check upstream LICENSE before vendoring.

### lcy362/agnes-video-generator
- **URL:** https://github.com/lcy362/agnes-video-generator (also listed under https://github.com/topics/video-generator)
- **What it is:** Self-hosted Web UI for the same Agnes cloud pipeline — handles image upload → video render without paid keys.
- **Use in this repo:** Inspect how it structures `upload -> poll -> download` and replicate in `scripts/agnes-client.mjs`.

## 2. Free Hugging Face Spaces via Gradio Client

### Hugging Face Image-to-Video Models Directory
- **URL:** https://huggingface.co/models?pipeline_tag=image-to-video
- **Key models:** `Wan-Video/Wan2.2-I2V`, `Lightricks/LTX-Video`
- **How to call (zero-cost):** Any public Space that hosts Wan2.2 or LTX exposes a Gradio API. Use `@gradio/client` (JS) or `gradio_client` (Python) to connect to the free community GPU quota.
- **Example Spaces to inspect:** search HF for `Wan2.2-I2V Space` or `LTX-Video Space` — pick one with active status, copy its `spaceId`.
- **JS usage:**
  ```js
  import { Client } from "@gradio/client";
  const app = await Client.connect("Wan-Video/Wan2.2-I2V");
  const result = await app.predict("/predict", { image: blob, prompt: "...", duration: 5 });
  ```

## 3. How This Repo Uses Them

| When | What agent does |
|------|-----------------|
| No raw footage available | Generate stills via `scripts/generate-peace-stills.mjs` → then call `scripts/image-to-video.mjs` to animate each still into 5s clip |
| User says "picture to video" | Run `node scripts/image-to-video.mjs --image public/pics/abbas/xxx.jpg --prompt "slow Ken Burns, cinematic"` |
| Needs multi-scene | Use `uglylee` multi-scene pattern: `scenes=[{image, prompt, duration}]` → concat with `scripts/build-full-hd.mjs` |

No installs needed by user — `references/` and `scripts/image-to-video.mjs` are the bridge. Keep Remotion as primary renderer; these are **optional cloud helpers** for B-roll only.

