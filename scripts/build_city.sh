#!/usr/bin/env bash
# Compress the generated building models for the web.
# Source: media-src/city/<name>.glb (raw image-to-3D output, kept out of git)
# Output: impact/public/media/city/<name>.glb (meshopt geometry, WebP textures)
# Usage: scripts/build_city.sh [name ...]   (defaults to every b*.glb)
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p impact/public/media/city
names=("$@")
if [ ${#names[@]} -eq 0 ]; then
  for f in media-src/city/b*.glb; do names+=("$(basename "${f%.glb}")"); done
fi
for n in "${names[@]}"; do
  in="media-src/city/$n.glb"
  out="impact/public/media/city/$n.glb"
  npx gltf-transform optimize "$in" "$out" \
    --compress meshopt --meshopt-level high \
    --texture-compress webp --texture-size 1024 \
    --simplify true --simplify-ratio 0.03 --simplify-error 0.001 \
    --palette false
  printf '%s: %s -> %s bytes\n' "$n" "$(stat -c %s "$in")" "$(stat -c %s "$out")"
done
