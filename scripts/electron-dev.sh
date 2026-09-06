#!/usr/bin/env bash
# Wait for Next.js (or any HTTP server) then launch Electron.
set -euo pipefail
cd "$(dirname "$0")/.."

URL="${ELECTRON_START_URL:-http://127.0.0.1:4173}"
echo "Waiting for $URL ..."

for i in $(seq 1 60); do
  if curl -sf "$URL" >/dev/null 2>&1; then
    echo "Ready."
    exec npx electron .
  fi
  sleep 0.5
done

echo "Timed out waiting for $URL" >&2
exit 1
