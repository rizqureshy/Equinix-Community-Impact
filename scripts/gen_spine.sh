#!/usr/bin/env bash
# Card images for the Spine prototype: one GPT Image 2.5 still per milestone (1.5 credits each).
set -uo pipefail
export HIGGSFIELD_DISABLE_TELEMETRY=1
cd "$(dirname "$0")/.."
for f in media-src/spine/*.txt; do
  k=$(basename "$f" .txt)
  [ -s "media-src/spine/$k.png" ] && { echo "skip $k"; continue; }
  echo "== $k $(date -u +%T)"
  higgsfield generate create gpt_image_2_5 --prompt "$(cat "$f")" --aspect-ratio 3:2 --resolution 1k --quality high \
    --wait --wait-timeout 10m --wait-interval 8s --json > "media-src/spine/$k.json" 2> "media-src/spine/$k.err"
  url=$(python3 - "media-src/spine/$k.json" <<'PY'
import sys, json
raw = open(sys.argv[1]).read(); end = max(raw.rfind(']'), raw.rfind('}'))
try: d = json.loads(raw[:end + 1])
except Exception: print(''); sys.exit()
d = d[0] if isinstance(d, list) else d
print(d.get('result_url') or '')
PY
)
  if [ -n "$url" ]; then curl -sS -L -o "media-src/spine/$k.png" "$url" && echo "$k ok"; else echo "$k FAILED"; tail -2 "media-src/spine/$k.err"; fi
done
echo DONE
