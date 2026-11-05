#!/usr/bin/env bash
# The promises drawn as plans: red hairline drawings, GPT Image 2.6, 1.5 credits each.
# Two routes per subject: `-svg` asks for vector output without a reference (the strokes can draw
# themselves on the page); `-ref` traces the promise photograph so plan and photograph register.
# Usage: scripts/gen_promises_drawn.sh [prompt stems...]   (default: every *.prompt not yet made)
set -uo pipefail
export HIGGSFIELD_DISABLE_TELEMETRY=1
cd "$(dirname "$0")/.."
d=media-src/promises/drawn
stems=("$@")
if [ ${#stems[@]} -eq 0 ]; then for f in "$d"/*.prompt; do stems+=("$(basename "$f" .prompt)"); done; fi
for k in "${stems[@]}"; do
  subj=${k%%-*}                      # k1
  route=${k##*-}                     # svg | ref
  ref="$d/../${subj/k1/k1-infrastructure}.png"
  case "$subj" in k1) ref="$d/../k1-infrastructure.png";; k2) ref="$d/../k2-power.png";; k3) ref="$d/../k3-jobs.png";; k4) ref="$d/../k4-nature.png";; k5) ref="$d/../k5-inclusion.png";; esac
  if [ "$route" = svg ]; then out="$d/$k.svg"; extra=(--output-format svg); else out="$d/$k.png"; extra=(--image-references "$ref"); fi
  [ -s "$out" ] && { echo "skip $k"; continue; }
  echo "== $k $(date -u +%T)"
  higgsfield generate create gpt_image_2_6 --prompt "$(cat "$d/$k.prompt")" --aspect-ratio 2:3 --resolution 1k --quality high "${extra[@]}" \
    --wait --wait-timeout 12m --wait-interval 8s --json > "$d/$k.json" 2> "$d/$k.err"
  url=$(python3 - "$d/$k.json" <<'PY'
import sys, json
raw = open(sys.argv[1]).read(); end = max(raw.rfind(']'), raw.rfind('}'))
try: d = json.loads(raw[:end + 1])
except Exception: print(''); sys.exit()
d = d[0] if isinstance(d, list) else d
print(d.get('result_url') or '')
PY
)
  if [ -n "$url" ]; then curl -sS -L -o "$out" "$url" && echo "$k ok -> $out"; else echo "$k FAILED"; tail -2 "$d/$k.err"; fi
done
echo DONE
