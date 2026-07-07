#!/usr/bin/env bash
set -e

ROOT=$(cd "$(dirname "$0")/.." && pwd)
DIST="$ROOT/dist"

# Use env_Lecture Node on local Windows if node is not already in PATH
if ! command -v node >/dev/null 2>&1; then
  NODE_DIR="/c/Users/Gengc/.conda/envs/env_Lecture/nodejs"
  export PATH="$NODE_DIR:$PATH"
fi

echo "Node version: $(node -v)"
echo "NPM version: $(npm -v)"

rm -rf "$DIST"
mkdir -p "$DIST"

# Build directory homepage
echo "=== Building index ==="
cd "$ROOT/index"
npm install
npm run build
cp -r dist/* "$DIST/"

# Build each chapter
for ch in ch1 ch3 ch4 ch5 ch6; do
  echo "=== Building $ch ==="
  cd "$ROOT/chapters/$ch"
  npm install
  npm run build
  mkdir -p "$DIST/$ch"
  cp -r dist/* "$DIST/$ch/"
done

# Copy pre-built chapter 2 artifacts
echo "=== Copying ch2 artifacts ==="
cp -r "$ROOT/chapters/ch2" "$DIST/ch2"

echo "=== Build complete: $DIST ==="
ls -la "$DIST"
