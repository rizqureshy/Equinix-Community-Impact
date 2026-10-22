#!/usr/bin/env bash
# Ensure a vite preview of dist/ is serving on port 4181 (restarts it if gone).
cd "$(dirname "$0")/../.."
if ! curl -s -o /dev/null http://localhost:4181/; then
  (fuser -k 4181/tcp >/dev/null 2>&1 || true)
  (nohup npx vite preview --port 4181 --strictPort >/tmp/claude-0/preview.log 2>&1 &)
  for i in $(seq 1 60); do curl -s -o /dev/null http://localhost:4181/ && break; sleep 0.5; done
fi
curl -s -o /dev/null -w "preview %{http_code}\n" http://localhost:4181/
