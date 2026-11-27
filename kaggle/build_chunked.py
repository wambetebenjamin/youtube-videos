#!/usr/bin/env python3
"""
Resume-safe chunked builder for Kaggle (also works locally).
Same logic as /tmp/build-chunked.py but paths adjusted for kaggle/working.
If a segment already exists it is skipped → true resume.
"""
import pathlib, subprocess, os, sys
FF = subprocess.check_output(["python3","-c","import imageio_ffmpeg; print(imageio_ffmpeg.get_ffmpeg_exe())"]).decode().strip()
ROOT = pathlib.Path(__file__).resolve().parent.parent  # youtube-videos/
# when run from kaggle/working/youtube-videos/kaggle, ROOT is .../youtube-videos
if not (ROOT / "docs").exists():
    ROOT = pathlib.Path("/kaggle/working/youtube-videos")
    if not ROOT.exists():
        ROOT = pathlib.Path.cwd()
print(f"ROOT={ROOT} FF={FF}")
os.chdir(ROOT)

segments = [
    ("out/blueprint-sample/candle-closeup.jpg", 8, "fade:3"),
    ("docs/master-20min-ink-doodle/images/30-table-alone.jpg", 14, "dissolve:2.5"),
    ("out/blueprint-sample/bed-3am.jpg", 16, "dissolve:2"),
    ("out/blueprint-sample/deep-well.jpg", 14, "wipedown:1.5"),
    ("docs/master-20min-ink-doodle/images/33-pew-down.jpg", 23, "slideleft:2"),
    ("docs/master-20min-ink-doodle/images/06-open-bible-light.jpg", 45, "dissolve:2"),
    ("docs/master-20min-ink-doodle/images/41-title-circle-2.jpg", 12, "dissolve:2"),
    ("docs/master-20min-ink-doodle/images/04-heavy-boxes.jpg", 18, "dissolve:1.5"),
    ("docs/master-20min-ink-doodle/images/03-valley-hand.jpg", 20, "slideup:2"),
    ("docs/master-20min-ink-doodle/images/35-hand-shoulder.jpg", 25, "dissolve:1.5"),
    ("docs/master-20min-ink-doodle/images/28-awake-bed-thoughts.jpg", 30, "dissolve:1.5"),
    ("docs/master-20min-ink-doodle/images/13-scale-crown.jpg", 30, "slideleft:2"),
    ("docs/master-20min-ink-doodle/images/29-telescope-horizon.jpg", 15, "dissolve:1.5"),
    ("docs/master-20min-ink-doodle/images/41-title-circle-2.jpg", 12, "dissolve:2"),
    ("docs/master-20min-ink-doodle/images/09-valley-cliffs.jpg", 28, "dissolve:2"),
    ("docs/master-20min-ink-doodle/images/06-open-bible-light.jpg", 30, "slideup:2"),
    ("docs/master-20min-ink-doodle/images/11-trophies.jpg", 30, "slidedown:2.5"),
    ("docs/master-20min-ink-doodle/images/35-hand-shoulder.jpg", 35, "dissolve:2"),
    ("docs/master-20min-ink-doodle/images/36-quiet-rock.jpg", 15, "dissolve:1.5"),
    ("docs/master-20min-ink-doodle/images/41-title-circle-2.jpg", 12, "dissolve:2"),
    ("docs/master-20min-ink-doodle/images/08-boulder-alone.jpg", 28, "dissolve:1.5"),
    ("docs/master-20min-ink-doodle/images/06-open-bible-light.jpg", 35, "dissolve:2"),
    ("docs/master-20min-ink-doodle/images/13-scale-crown.jpg", 45, "slideleft:2"),
    ("docs/master-20min-ink-doodle/images/14-seed-sprout.jpg", 30, "dissolve:2"),
    ("docs/master-20min-ink-doodle/images/41-title-circle-2.jpg", 12, "dissolve:2"),
    ("docs/master-20min-ink-doodle/images/15-crumpled-papers.jpg", 33, "dissolve:1.5"),
    ("docs/master-20min-ink-doodle/images/17-sunrise-ruins.jpg", 35, "dissolve:2.5"),
    ("docs/master-20min-ink-doodle/images/06-open-bible-light.jpg", 40, "dissolve:2"),
    ("docs/master-20min-ink-doodle/images/24-walking-path.jpg", 30, "dissolve:2"),
    ("docs/master-20min-ink-doodle/images/41-title-circle-2.jpg", 12, "dissolve:2"),
    ("docs/master-20min-ink-doodle/images/18-bench-crowd.jpg", 33, "dissolve:1.5"),
    ("docs/master-20min-ink-doodle/images/20-jesus-bench-listening.jpg", 35, "dissolve:2"),
    ("docs/master-20min-ink-doodle/images/07-cracked-jar-light.jpg", 40, "dissolve:2"),
    ("docs/master-20min-ink-doodle/images/22-clouds-breaking.jpg", 30, "dissolve:2"),
    ("docs/master-20min-ink-doodle/images/41-title-circle-2.jpg", 12, "dissolve:2"),
    ("docs/master-20min-ink-doodle/images/25-worry-sack-hill.jpg", 38, "dissolve:1.5"),
    ("docs/master-20min-ink-doodle/images/06-open-bible-light.jpg", 40, "dissolve:2"),
    ("docs/master-20min-ink-doodle/images/38-locked-door.jpg", 45, "dissolve:2"),
    ("docs/master-20min-ink-doodle/images/39-free-hands.jpg", 15, "dissolve:2"),
    ("docs/master-20min-ink-doodle/images/41-title-circle-2.jpg", 12, "dissolve:2"),
    ("docs/master-20min-ink-doodle/images/38-locked-door.jpg", 33, "dissolve:1.5"),
    ("docs/master-20min-ink-doodle/images/05-praise-rain.jpg", 45, "dissolve:2"),
    ("docs/master-20min-ink-doodle/images/06-open-bible-light.jpg", 60, "dissolve:3.5"),
    ("out/blueprint-sample/candle-closeup.jpg", 15, "dissolve:3.5"),
    ("docs/master-20min-ink-doodle/images/24-walking-path.jpg", 15, "fade:5"),
]
trans_map = {"fade":"fade","dissolve":"dissolve","wipedown":"wipedown","wipeup":"wipeup","slideleft":"slideleft","slideright":"slideright","slideup":"slideup","slidedown":"slidedown"}

seg_dir = pathlib.Path("tmp_segments") if pathlib.Path("/kaggle").exists() else pathlib.Path("/tmp/segments-chunked")
seg_dir.mkdir(exist_ok=True)
print(f"Segments dir {seg_dir.resolve()} — resuming if exists")
for i,(path,dur,_) in enumerate(segments):
    out = seg_dir / f"seg{i:02d}.mp4"
    if out.exists() and out.stat().st_size > 50000:
        print(f" skip seg{i:02d} cached {out.stat().st_size}")
        continue
    vf = "scale=1920:1080:force_original_aspect_ratio=increase:flags=lanczos,crop=1920:1080,setsar=1,fps=30,zoompan=d=1:s=1920x1080:fps=30:z='min(zoom+0.0005,1.06)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)',scale=1920:1080:flags=lanczos,format=yuv420p"
    cmd=[FF,"-y","-loop","1","-t",str(dur),"-i",path,"-vf",vf,"-c:v","libx264","-pix_fmt","yuv420p","-r","30","-crf","23","-preset","ultrafast",str(out)]
    print(f" seg{i:02d} {path} {dur}s")
    subprocess.check_call(cmd)

print("All segments done — building 6 chunks")
chunk_size=8
def build_chunk(seg_indices, cid):
    n=len(seg_indices)
    inputs=[]
    for idx in seg_indices:
        inputs.extend(["-i", str(seg_dir / f"seg{idx:02d}.mp4")])
    durs=[segments[i][1] for i in seg_indices]
    trans=[float(segments[i][2].split(":")[1]) for i in seg_indices[:-1]]
    offsets=[]
    for j in range(1,n):
        offsets.append(sum(durs[:j]) - sum(trans[:j]))
    filter_parts=""
    for j in range(1,n):
        ttype,tdur=segments[seg_indices[j-1]][2].split(":")
        ttype=trans_map.get(ttype,"dissolve")
        off=offsets[j-1]
        if j==1:
            filter_parts+=f"[0:v][1:v]xfade=transition={ttype}:duration={tdur}:offset={off}[xf1];"
        else:
            filter_parts+=f"[xf{j-1}][{j}:v]xfade=transition={ttype}:duration={tdur}:offset={off}[xf{j}];"
    # replace last xf with vout
    filter_parts=filter_parts.replace(f"[xf{n-1}]", "[vout]") if n>1 else ""
    if n==1:
        # single seg chunk — just copy
        filter_parts="[0:v]copy[vout]"
        # but need format
        filter_parts="[0:v]format=yuv420p[vout]"
    else:
        # ensure last is vout
        if f"[xf{n-1}]" not in filter_parts and "[vout]" not in filter_parts:
            filter_parts=filter_parts.rstrip(";")+";"
        # fix: our loop left [xf{n-1}] -> should be [vout]; handle
        filter_parts=filter_parts.replace(f"[xf{n-1}]", "[vout]")
        # if still no vout, patch
        if "[vout]" not in filter_parts:
            filter_parts=filter_parts[:-1]+f"[xf{n-1}];[xf{n-1}]format=yuv420p[vout]" if n>2 else filter_parts
    out_chunk = pathlib.Path(f"chunk{cid:02d}.mp4") if pathlib.Path("/kaggle").exists() else pathlib.Path(f"/tmp/chunk{cid:02d}.mp4")
    # simplify: use earlier correct chunk logic from build-chunked.py — reuse that file's function but inline quick brute:
    # For now use python to generate correct filter like original script
    # Let's just shell out to original build-chunked.py chunk builder for correctness — fallback to simple concat if xfade fails
    cmd=[FF,"-y"]+inputs+["-filter_complex",filter_parts,"-map","[vout]","-c:v","libx264","-crf","23","-preset","ultrafast","-pix_fmt","yuv420p",str(out_chunk)]
    print(f" chunk{cid} {seg_indices} offsets {offsets}")
    try:
        subprocess.check_call(cmd)
    except subprocess.CalledProcessError as e:
        print(f" xfade failed for chunk {cid} ({e}), falling back to concat demuxer")
        # fallback concat without transitions (still resume-safe)
        listf=pathlib.Path(f"/tmp/list{cid}.txt")
        listf.write_text("\n".join([f"file '{seg_dir / f'seg{i:02d}.mp4'}'" for i in seg_indices]))
        cmd2=[FF,"-y","-f","concat","-safe","0","-i",str(listf),"-c","copy",str(out_chunk)]
        subprocess.check_call(cmd2)
    print(f" -> {out_chunk} {out_chunk.stat().st_size}")
    return out_chunk

chunks=[]
for cid in range(0, (len(segments)+chunk_size-1)//chunk_size):
    s=cid*chunk_size; e=min(s+chunk_size, len(segments))
    chunks.append(build_chunk(list(range(s,e)), cid))

print(f"Built {len(chunks)} chunks")
# final merge — also xfade boundaries
chunk_durs=[]
for cid,ch in enumerate(chunks):
    s=cid*chunk_size; e=min(s+chunk_size, len(segments))
    durs=[segments[i][1] for i in range(s,e)]
    trans=[float(segments[i][2].split(":")[1]) for i in range(s,e-1)]
    chunk_durs.append(sum(durs)-sum(trans))
print("chunk_durs",chunk_durs)
offsets_final=[]
cum=chunk_durs[0]
for i in range(1,len(chunks)):
    bidx=i*chunk_size-1
    _,tdur=segments[bidx][2].split(":")
    off=cum-float(tdur)
    offsets_final.append(off)
    cum=cum+chunk_durs[i]-float(tdur)
print("offsets_final",offsets_final)
if len(chunks)>1:
    inputs=[]
    for c in chunks: inputs.extend(["-i", str(c)])
    filt=""
    for i in range(1,len(chunks)):
        bidx=i*chunk_size-1
        ttype,tdur=segments[bidx][2].split(":")
        ttype=trans_map.get(ttype,"dissolve")
        off=offsets_final[i-1]
        if i==1:
            filt+=f"[0:v][1:v]xfade=transition={ttype}:duration={tdur}:offset={off}[fx1];"
        else:
            filt+=f"[fx{i-1}][{i}:v]xfade=transition={ttype}:duration={tdur}:offset={off}[fx{i}];"
    filt=filt.replace(f"[fx{len(chunks)-1}]","[vout]")
    final=pathlib.Path("/kaggle/working/FULL-20min-PSALM42-MasterSync.mp4") if pathlib.Path("/kaggle").exists() else pathlib.Path("/tmp/FULL-20min-PSALM42-MasterSync.mp4")
    cmd=[FF,"-y"]+inputs+["-filter_complex",filt,"-map","[vout]","-c:v","libx264","-crf","23","-preset","ultrafast","-pix_fmt","yuv420p",str(final)]
    print(f"Final merge -> {final}")
    print(" ".join(cmd))
    subprocess.check_call(cmd)
    print(f"Final video {final.stat().st_size}")
    # mux audio
    voice=pathlib.Path("full-voice-1200.m4a") if (pathlib.Path("full-voice-1200.m4a").exists()) else pathlib.Path("/tmp/full-voice-1200.m4a") if pathlib.Path("/tmp/full-voice-1200.m4a").exists() else ROOT / "full-voice-1200.m4a"
    if not voice.exists():
        voice=pathlib.Path("/kaggle/working/youtube-videos/full-voice-1200.m4a")
    if voice.exists():
        muxed=pathlib.Path(str(final).replace(".mp4","-VOICE.mp4"))
        cmd2=[FF,"-y","-i",str(final),"-i",str(voice),"-c:v","copy","-c:a","aac","-b:a","128k","-shortest",str(muxed)]
        subprocess.check_call(cmd2)
        print(f"Muxed {muxed} {muxed.stat().st_size}")
        # 720p fallback if >100M
        if muxed.stat().st_size > 100*1024*1024:
            comp=pathlib.Path(str(muxed).replace(".mp4","-720p.mp4"))
            subprocess.check_call([FF,"-y","-i",str(muxed),"-vf","scale=-2:720","-c:v","libx264","-crf","28","-preset","veryfast","-c:a","copy",str(comp)])
            print(f"Compressed {comp} {comp.stat().st_size}")
else:
    print("single chunk")
