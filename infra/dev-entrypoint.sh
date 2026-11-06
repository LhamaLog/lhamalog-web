#!/bin/sh
# Development server. Reinstalls dependencies only when package-lock.json changes.
set -eu
cd /home/node/app
stamp="node_modules/.lhamalog-lock-stamp"
lock_hash=$(sha256sum package-lock.json | awk '{print $1}')
current=""
if [ -f "$stamp" ]; then
  current=$(cat "$stamp")
fi
if [ "$current" != "$lock_hash" ]; then
  npm ci
  printf '%s\n' "$lock_hash" > "$stamp"
fi
exec npm run dev -- --host 0.0.0.0 --port 5173 --strictPort
