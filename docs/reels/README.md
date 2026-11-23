# Reels — Git Organization (not Drive)

**Everything lives in the git repo; Drive is only an optional upload target, never the source.**

```
public/youtube/raw/          → YouTube horizontal 1920x1080 (Peace Be Still etc)
public/raw-footage/          → legacy YouTube masters

public/reels/
  raw/                       → new vertical footage (no people-mids) — not TikTok mids
  slides/                    → AI-generated slides (Blender MCP or Midjourney) with push/pull transitions
    hdri/                    → (gitignored) Poly Haven 8K HDRIs — fetched live, not committed
  music/                     → TikTok audio *extracted* to .mp3 here (this folder IS committed)
    1000853322.mp3  (18s)    ← from reels-reference/1000853322.mp4
    1000853358.mp3  (14s)
    1000853359.mp3  (24s)
    1000853360.mp4  (48s)
    ... etc — all 10 TikTok audios extracted
content/reels/
  reels-config.json          → one entry per reel: variant (wisdom/motivation), hook, headline, bodyLines, musicSrc, slides[]

out/
  youtube/                   → YouTube renders (gitignored)
  reels/                     → Reels renders (gitignored) — e.g. wisdom-01-storm.mp4

src/compositions/
  YouTubeVideo.tsx           → 1920x1080
  AbbasStories.tsx / PeaceBeStillV6.tsx → 1920x1080
  SocialReel.tsx             → 1080x1920, SocialReelWisdom + SocialReelMotivation in Root.tsx

reels-reference/             → original TikTok uploads from GitHub main (10 mp4s, 58MB) — reference only, NOT used as video source (only audio reused)
```

**Music rule you asked for:** use the music *from the TikTok videos you uploaded* — already extracted to `public/reels/music/*.mp3`. Each reel in `reels-config.json` points to one of those tracks and depicts its current length (e.g. 48s, 24s). For short tracks, we render to track length now; when you license the full song, drop the longer MP3 to the same path and re-render — picture auto-extends.

**No people mids:** we never cut the middles of `reels-reference/` that have other people — new slides/stock only, replicating the *design* (hook badge → captions → CTA) with distinct Reels styling (top progress bar, large type, AI slides).

**Blender MCP (optional):** `references/blender-mcp/` + `docs/BLENDER_MCP_SETUP.md` — AI writes `scripts/blender/*.py`, fetches Poly Haven assets live, saves PNGs to `public/reels/slides/`.
