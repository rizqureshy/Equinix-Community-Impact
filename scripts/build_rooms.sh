#!/usr/bin/env bash
# Encode the dive films for the web: in, and out.
# Source: media-src/rooms/<place>.dive.mp4 (Kling output, kept out of git), and
#         media-src/rooms/<place>.exit.mp4 when a forward exit film exists (rooms
#         with people in them; played forwards, nobody walks backwards). Without
#         one the dive is played in reverse to leave.
# Output: impact/public/media/rooms/<place>-dive.{mp4,webm} and <place>-dive-out.{mp4,webm}
# Usage: scripts/build_rooms.sh [place ...]
set -euo pipefail
cd "$(dirname "$0")/.."
out=impact/public/media/rooms
mkdir -p "$out"
places=("$@")
if [ ${#places[@]} -eq 0 ]; then
  for f in media-src/rooms/*.dive.mp4; do places+=("$(basename "${f%.dive.mp4}")"); done
fi
for p in "${places[@]}"; do
  for dir in in out; do
    src="media-src/rooms/$p.dive.mp4"
    if [ "$dir" = in ]; then vf="scale=1280:-2"; name="$p-dive"
    elif [ -f "media-src/rooms/$p.exit.mp4" ]; then src="media-src/rooms/$p.exit.mp4"; vf="scale=1280:-2"; name="$p-dive-out"
    else vf="reverse,scale=1280:-2"; name="$p-dive-out"; fi
    ffmpeg -v error -y -i "$src" -an -vf "$vf" -c:v libx264 -crf 24 -preset slow -pix_fmt yuv420p -movflags +faststart "$out/$name.mp4"
    ffmpeg -v error -y -i "$src" -an -vf "$vf" -c:v libvpx-vp9 -crf 34 -b:v 0 -row-mt 1 "$out/$name.webm"
  done
  printf '%s: %s\n' "$p" "$(du -ch "$out/$p-dive"*.{mp4,webm} | tail -1 | cut -f1)"
done
