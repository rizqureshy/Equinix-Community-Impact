#!/usr/bin/env bash
# The dive film for the promises section: Kling O3 first/last frame, 8 s, pro, from the far and near renders of the Spine.
set -uo pipefail
export HIGGSFIELD_DISABLE_TELEMETRY=1
cd "$(dirname "$0")/.."
d=media-src/spine/film
higgsfield generate create kling_o3_flf --prompt "$(cat $d/dive.txt)" --start-image "$d/far.png" --end-image "$d/near.png" \
  --duration 8 --mode pro --sound off --aspect-ratio 16:9 --wait --wait-timeout 25m --wait-interval 15s --json > "$d/dive.json" 2> "$d/dive.err"
url=$(python3 - "$d/dive.json" <<'PY'
import sys, json
raw = open(sys.argv[1]).read(); end = max(raw.rfind(']'), raw.rfind('}'))
try: d = json.loads(raw[:end + 1])
except Exception: print(''); sys.exit()
d = d[0] if isinstance(d, list) else d
print(d.get('result_url') or '')
PY
)
if [ -n "$url" ]; then curl -sS -L -o "$d/dive.mp4" "$url" && echo "dive ok"; else echo "dive FAILED"; tail -3 "$d/dive.err"; fi
