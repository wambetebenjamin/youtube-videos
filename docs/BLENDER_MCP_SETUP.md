# Blender MCP Workflow — AI Slides & 3D without Heavy Commits

This repo follows the plan you sent: generate Blender scenes via Python, fetch Poly Haven assets live, never commit heavy `.blend` or 8K textures.

## Repos registered (in `references/blender-mcp/`)

- **ahujasid/mcp-for-blender** — MCP server that lets Claude/Cursor/Windsurf write Python to animate, build geometry, import Poly Haven HDRIs/textures/models via live API.
- **dorialn68/blender-mcp-enhanced** — Fork focused on animation/rigging (walk/bounce/rotate keyframes, auto-rig, render).
- **Poly-Haven/polyhavenassets** — Official Blender add-on for drag-drop Asset Browser.
- **Poly-Haven/Public-API** — REST API docs if you write `scripts/fetch-polyhaven.py` from scratch.

They are already cloned to `references/blender-mcp/{mcp-for-blender,blender-mcp-enhanced,polyhavenassets,Public-API}` for the agent to read — **not** installed into Blender yet.

## Setup (once, on your machine with Blender installed)

1. **Fork (optional)**
   ```bash
   gh repo fork ahujasid/mcp-for-blender --clone  # or just use references/blender-mcp/mcp-for-blender
   ```
2. **Connect locally**
   ```bash
   uvx mcp-for-blender setup
   # or: pipx run mcp-for-blender setup
   # — installs the add-on into Blender and writes MCP config for Claude Desktop / Cursor
   ```
3. **Verify in Blender:** Edit → Preferences → Add-ons → search "MCP" should show enabled.

## How this repo uses it (so you never commit heavy files)

- `.gitignore` already blocks `*.blend`, `*.blend1`, `out/`, `public/reels/slides/hdri/*.hdr` (8K HDRIs).
- **Save scripts, not blends:** All Blender work goes to `scripts/blender/*.py` (e.g. `scripts/blender/reel-wisdom-01.py`). The script re-downloads the exact Poly Haven IDs on each run.
- **Agent workflow:** When you say "make a wisdom slide with moody warehouse HDRI", the agent:
  1. Reads `references/blender-mcp/mcp-for-blender/addon.py` tool definitions
  2. Writes a new `scripts/blender/reel-*.py` that calls `bpy` + `polyhaven_api.get_hdri("warehouse_...")`
  3. You run `blender --background --python scripts/blender/reel-*.py -- --out public/reels/slides/slide-01.png` locally
  4. The PNG (small) is committed; the HDRI (large) is re-fetched, never stored.

## Quick test (no Blender install needed here)

```bash
# List available Poly Haven HDRIs from API docs
cat references/blender-mcp/Public-API/README.md | head -n 40
# Inspect MCP tool definitions
cat references/blender-mcp/mcp-for-blender/addon.py | head -n 80
```

## For the AI-generated slides path (no Blender needed)

If you prefer pure AI images, just drop them in `public/reels/slides/` and reference in `content/reels/reels-config.json` — `SocialReel` will use them with push/pull transitions. Blender path is there when you want 3D.
