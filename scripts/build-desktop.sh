#!/usr/bin/env bash
# Static export for the Electron desktop app (no basePath).
set -euo pipefail
cd "$(dirname "$0")/.."

if [ -d app/api ]; then
  mv app/api .api-backup
fi

cleanup() {
  if [ -d .api-backup ]; then
    mv .api-backup app/api
  fi
}
trap cleanup EXIT

export BUILD_DESKTOP=1
unset NEXT_PUBLIC_BASE_PATH || true
unset NEXT_PUBLIC_STREAM_PROXY_URL || true
export NEXT_PUBLIC_DESKTOP=1

echo "Building static site for desktop..."
npm run build

echo ""
echo "Done. Output: $(pwd)/out/"
echo "Run: npm run electron:pack"
