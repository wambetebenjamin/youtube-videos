# Working with big video files

Short version: **don't put your footage in Git.** Keep the edit in Git — it's a few KB of
JSON — and keep the pixels on disk. This repo is already set up that way.

If you hit a 25 MB limit, that's GitHub's *web uploader*. It's the most restrictive path
there is, and nothing here needs it.

### The limits you'd be fighting

| | Limit |
|---|---|
| GitHub web uploader (drag onto github.com) | **25 MB** per file |
| `git push` over HTTPS | 100 MB per file — hard rejection, and it blocks the push |
| GitHub warning threshold | 50 MB |
| Git LFS free tier | 1 GB storage, 1 GB/month bandwidth |
| This repo's own uploader | 4 GB per file |

A repo also never forgets: commit a 600 MB file and delete it next week, and every clone
still downloads 600 MB forever. That's the real reason to keep footage out, not the limits.

---

## Pick your situation

| Your footage is… | Do this |
|---|---|
| On the same machine as the repo | `npm run import -- <files> --link` — a symlink, 0 bytes copied |
| On an external SSD or NAS | Same, `--link` keeps it there and the repo just points at it |
| 4K / long / slow to scrub | `npm run proxy` — edit against a 540p stand-in |
| Needs to be shared with someone else | Cloud storage + a short sync script, not Git |
| Genuinely needs versioning | Git LFS, eyes open about the quota |

---

## 1. The default: just put them in `media/`

```bash
cp ~/Movies/*.mp4 media/source/
npm run dev
```

`media/` is gitignored. Files of any size are fine — they're invisible to Git, so there's
no 25 MB, no 100 MB, no push to fail. They're just files on your disk that the studio reads.

Or drag them into the studio's **Media** tab, which streams them to disk with a progress bar
(4 GB cap) and probes them as they land.

## 2. Don't copy at all — link

Copying 200 GB of rushes into a project folder is a waste of a disk.

```bash
npm run import -- ~/Movies/interview.mov --link
npm run import -- /Volumes/RushesSSD/day-1 --link     # a whole folder
```

The repo gets a symlink. Everything downstream — preview, ffprobe, render — follows it and
behaves exactly as if the file were local:

```
media/source/4k-interview.mp4 -> /Volumes/RushesSSD/day-1/4k-interview.mp4
          29 bytes in the repo,  88 MB on the drive
```

The studio marks linked clips with a `link` badge. The only rule: don't unplug the drive
mid-edit. A dangling link is skipped from the library rather than crashing it.

Other modes: plain `npm run import -- <files>` copies, `--move` relocates the original.

## 3. Proxies — the one that actually fixes editing

A 4K clip in a `<video>` tag is painful: slow first frame, laggy scrubbing, re-buffering on
every seek. Every professional NLE solves this the same way — edit against a small stand-in,
conform back to the original at export.

```bash
npm run proxy              # every clip that needs one
npm run proxy -- --status  # what exists and what it saves
npm run proxy -- --clean   # drop stale ones
```

Measured on an 8-second 3840×2160 clip:

```
  ✓ 4k-interview.mp4     88.0 MB → 440.9 KB   (99.5% smaller)    built in 3s
```

The studio automatically plays the proxy and shows a **proxy preview** badge so you always
know what you're watching. **Renders always read the original file** — the proxy is never
part of an export. Proxies live in `media/proxies/`, are gitignored, and carry a fingerprint
of the source in their filename, so re-editing a source invalidates its proxy instead of
silently previewing stale footage.

You can also build one per clip from the Media tab: large clips get a `heavy` badge and a ⚡
button, with live progress.

A proxy is only built when it's worth it — over 40 MB and meaningfully larger than 540p.
If the result isn't at least 10% smaller than the source, it's thrown away.

## 4. If you really need the footage versioned

Git LFS stores a pointer in Git and the bytes on a separate server:

```bash
git lfs install
git lfs track "media/source/**"     # then uncomment the rules in .gitattributes
# and delete the matching lines from .gitignore, or Git will keep ignoring them
git add .gitattributes
```

Be realistic about the free tier: 1 GB of storage and 1 GB/month of bandwidth. Three 4K
clips will exhaust it. It's a reasonable choice for a handful of hero assets — a logo sting,
a recurring intro — and a bad one for rushes.

Halfway house, for one file:

```bash
git add -f media/source/intro-sting.mp4
```

## 5. Sharing footage with other people

Git is the wrong tool. Put the files in object storage and keep a list in the repo:

```bash
rclone sync media/source remote:channel/rushes     # Backblaze, S3, Drive, Dropbox
rclone sync remote:channel/rushes media/source     # on the other machine
```

The projects, fonts, quote packs and Canva presets travel through Git; the pixels travel
through storage built for pixels. Anyone who clones the repo gets a complete, reviewable
description of every edit and can pull only the clips they actually need.

---

## Where disk goes

```
media/source/    your footage (or links to it)   ignored by Git
media/music/     your audio                      ignored
media/proxies/   derived, rebuildable            ignored
media/exports/   renders + posters + sidecars    ignored
projects/*.json  the actual edits, a few KB      TRACKED
```

Clear out space at any time:

```bash
npm run proxy -- --clean           # stale proxies
rm media/exports/*-draft.mp4       # draft renders
npm run exports                    # see what's accumulated first
```

Everything in the ignored folders is either yours (and backed up elsewhere) or rebuildable
from a project file in one command.
