#!/usr/bin/env bash
# Stills for the stories without a picture: Seedream 5.0 Pro, 3:2, 2k, 2.5 credits each,
# the same model and settings as the first set of story stills (media-src/higgsfield/*.prompt.txt).
# Usage: scripts/gen_stories.sh <stem>...   (e.g. harrison-ai technician-coalition)
set -uo pipefail
export HIGGSFIELD_DISABLE_TELEMETRY=1
cd "$(dirname "$0")/.."
d=media-src/higgsfield
for k in "$@"; do
  out="$d/$k.png"
  [ -s "$out" ] && { echo "skip $k"; continue; }
  echo "== $k $(date -u +%T)"
  higgsfield generate create seedream_v5_pro --prompt "$(cat "$d/$k.prompt.txt")" --aspect-ratio 3:2 --resolution 2k \
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
