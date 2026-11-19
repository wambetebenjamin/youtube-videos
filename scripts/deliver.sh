#!/usr/bin/env bash
# deliver.sh — master render -> delivery encode that YouTube will accept and Drive will take.
#
# YouTube wants 1080p at 8-12 Mbps, but this file also has to arrive by email, and the Drive upload
# tool refuses anything over 100 MB. 754 s at 12 Mbps is 1.1 GB; at 950 kbps video plus 112 kbps
# audio it is 95 MiB, which fits with margin. The bitrate is therefore derived from the file's own
# duration rather than hardcoded, so a longer cut cannot silently overshoot and fail at the last
# step -- the one failure mode that wastes a 75-minute render.
#
# Two-pass x264: the first pass measures where the picture needs bits. For a slow, dark film full of
# gradients this matters -- single-pass VBR spends them evenly and bands the skies.
#
# Usage: scripts/deliver.sh <master.mp4> <srt> <out.mp4> [max_mib]
set -euo pipefail

master="${1:?usage: deliver.sh <master.mp4> <srt> <out.mp4> [max_mib]}"
srt="${2:?srt}"
out="${3:?out}"
max_mib="${4:-96}"

dur=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$master")
# solve for video kbps given a fixed audio rate and the size ceiling
read -r vk ak < <(awk -v d="$dur" -v m="$max_mib" 'BEGIN{
  target = m * 1024 * 1024 * 8 / d / 1000;      # total kbps available
  ak = (target > 1400) ? 128 : 112;
  vk = int((target - ak) * 0.94);               # 6% headroom for container + keyframes
  printf "%d %d", vk, ak;
}')
echo "  duration ${dur}s -> video ${vk}k, audio ${ak}k, ceiling ${max_mib} MiB"

passlog=$(mktemp -u /tmp/x264-XXXXXX)
ffmpeg -v error -y -i "$master" \
  -c:v libx264 -preset slow -b:v "${vk}k" -pass 1 -passlogfile "$passlog" \
  -vf "scale=1920:1080:flags=lanczos,format=yuv420p" -an -f null -

ffmpeg -v error -y -i "$master" -i "$srt" \
  -map 0:v:0 -map 0:a:0 -map 1:0 \
  -c:v libx264 -preset slow -b:v "${vk}k" -maxrate "$((vk * 14 / 10))k" -bufsize "$((vk * 2))k" \
  -pass 2 -passlogfile "$passlog" \
  -vf "scale=1920:1080:flags=lanczos,format=yuv420p" \
  -profile:v high -level 4.1 -g 60 -keyint_min 30 -sc_threshold 0 \
  -c:a aac -b:a "${ak}k" -ac 2 -ar 48000 \
  -c:s mov_text -metadata:s:s:0 language=eng \
  -movflags +faststart -max_muxing_queue_size 4096 \
  "$out"

rm -f "${passlog}"*
mb=$(du -m "$out" | cut -f1)
echo "  wrote ${out} (${mb} MiB)"
"$(dirname "$0")/verify/probe-mp4.sh" "$out" 1920x1080 30
[ "$mb" -le "$max_mib" ] || { echo "  ✗ ${mb} MiB exceeds the ${max_mib} MiB ceiling"; exit 1; }
echo "  ✓ under the ${max_mib} MiB ceiling"
