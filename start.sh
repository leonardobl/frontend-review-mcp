#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DIST="$SCRIPT_DIR/dist/index.js"

if [ ! -f "$DIST" ]; then
  echo "Building project..."
  cd "$SCRIPT_DIR"
  npm run build
fi

exec node "$DIST"
