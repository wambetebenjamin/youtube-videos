# Upgrade 1080p master to true 8K for YouTube 8K badge — run on GitHub Actions (16GB RAM)
PYFF=$(python3 -c "import imageio_ffmpeg; print(imageio_ffmpeg.get_ffmpeg_exe())")
$PYFF -y -i out/youtube/abbas-table-psalm42-1080p-15min.mp4 -vf "scale=7680:4320:flags=lanczos:force_original_aspect_ratio=decrease,pad=7680:4320:(ow-iw)/2:(oh-ih)/2" -c:v libx264 -preset medium -crf 18 -c:a copy out/youtube/abbas-table-psalm42-15min-8K.mp4
echo "8K ready: out/youtube/abbas-table-psalm42-15min-8K.mp4 (YouTube will show 8K)"
