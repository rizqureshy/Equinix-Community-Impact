#!/usr/bin/env bash
# High-resolution portraits for the People line: 2:3, GPT Image 2.5 at 2k, high quality, run in parallel.
set -uo pipefail
export HIGGSFIELD_DISABLE_TELEMETRY=1
cd "$(dirname "$0")/.."
one() {
  k=$1; d=media-src/people/hi
  [ -s "$d/$k.png" ] && { echo "skip $k"; return; }
  echo "== $k $(date -u +%T)"
  higgsfield generate create gpt_image_2_5 --prompt "$(cat "$d/$k.txt")" --aspect-ratio 2:3 --resolution 2k --quality high \
    --wait --wait-timeout 15m --wait-interval 10s --json > "$d/$k.json" 2> "$d/$k.err"
  url=$(python3 - "$d/$k.json" <<'PY'
import sys, json
raw = open(sys.argv[1]).read(); end = max(raw.rfind(']'), raw.rfind('}'))
try: d = json.loads(raw[:end + 1])
except Exception: print(''); sys.exit()
d = d[0] if isinstance(d, list) else d
print(d.get('result_url') or '')
PY
)
  if [ -n "$url" ]; then curl -sS -L -o "$d/$k.png" "$url" && echo "$k ok $(date -u +%T)"; else echo "$k FAILED"; tail -2 "$d/$k.err"; fi
}
for f in media-src/people/hi/*.txt; do one "$(basename "$f" .txt)" & done
wait
echo DONE
