#!/usr/bin/env bash
# Fly-through film pipeline, following the scroll-world method
# (https://github.com/oso95/scroll-world, MIT):
#   frames   extract each dive clip's first and last frames
#   connect  render the connector clips with Kling 3.0, locked to those frames
#            (start = last frame of dive i, end = first frame of dive i+1)
#   encode   web versions: short-GOP MP4s for smooth scrubbing, posters, stills
#
# Usage: scripts/build_flight.sh frames|connect|encode
# Requires: ffmpeg, python3 with Pillow, and the Higgsfield CLI (signed in) for "connect".
set -euo pipefail
cd "$(dirname "$0")/../media-src/flight"
OUT=../../impact/public/media/flight
N=6

frames() {
  for n in $(seq 1 $N); do
    ffmpeg -v error -y -ss 0 -i "dive-$n.mp4" -frames:v 1 -q:v 2 "dive-$n-first.png"
    ffmpeg -v error -y -sseof -0.15 -i "dive-$n.mp4" -frames:v 1 -q:v 2 "dive-$n-last.png"
  done
}

connect() {
  export HIGGSFIELD_DISABLE_TELEMETRY=1
  local tail="Refined architectural miniature islands, golden-hour dusk light, warm glowing windows, tilt-shift look, deep charcoal background. Smooth, graceful, slow motion, subtle parallax. No text, no captions."
  for i in $(seq 1 $((N - 1))); do
    local p="Single continuous cinematic camera move, no cuts. The camera smoothly pulls up and back out of the miniature scene, rising into the dark sky, then glides forward across to the next floating miniature island and gently descends toward it, arriving at exactly the framing of the final image. A fine glowing red thread leads the way between the islands. $tail"
    echo "$p" > "conn-$i.prompt.txt"
    higgsfield generate create kling3_0 --prompt "$p" --start-image "dive-$i-last.png" --end-image "dive-$((i + 1))-first.png" \
      --duration 5 --mode pro --sound off --aspect_ratio 16:9 --wait --wait-timeout 25m --json > "conn-$i.json" 2>&1 &
  done
  wait
  for i in $(seq 1 $((N - 1))); do
    python3 - "conn-$i" <<'PY'
import json, sys, urllib.request
k = sys.argv[1]
raw = open(f'{k}.json').read()
d = json.loads(raw[:raw.rindex(']') + 1])[0]
print(k, d['id'], d['status'])
if d['result_url']:
    urllib.request.urlretrieve(d['result_url'], f'{k}.mp4')
PY
  done
}

encode() {
  mkdir -p "$OUT"
  # Short GOP: seek cost is dominated by frames from the last keyframe.
  enc() {
    ffmpeg -v error -y -i "$1" -an -vf "scale=1280:-2" -c:v libx264 -crf 27 -preset slow -g 8 -pix_fmt yuv420p -movflags +faststart "$2"
    # VP9 for browsers without H.264 (the page picks whichever the browser can play)
    ffmpeg -v error -y -i "$1" -an -vf "scale=1280:-2" -c:v libvpx-vp9 -crf 36 -b:v 0 -g 8 -row-mt 1 -deadline good -cpu-used 2 "${2%.mp4}.webm"
  }
  for n in $(seq 1 $N); do
    enc "dive-$n.mp4" "$OUT/dive-$n.mp4"
    ffmpeg -v error -y -i "dive-$n.mp4" -vf "scale=1280:-2" -frames:v 1 -q:v 4 "$OUT/dive-$n-poster.jpg"
    python3 -c "from PIL import Image; im=Image.open('scene-$n.png').convert('RGB'); im.thumbnail((1600,1600)); im.save('$OUT/scene-$n-1600.webp','WEBP',quality=78,method=6)"
  done
  for i in $(seq 1 $((N - 1))); do
    [ -f "conn-$i.mp4" ] || continue
    enc "conn-$i.mp4" "$OUT/conn-$i.mp4"
    ffmpeg -v error -y -i "conn-$i.mp4" -vf "scale=1280:-2" -frames:v 1 -q:v 4 "$OUT/conn-$i-poster.jpg"
  done
  du -sh "$OUT"
}

"$@"
