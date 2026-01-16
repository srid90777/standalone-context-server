#!/bin/bash

echo "Building Optimized Cross-Platform Binaries"
echo "==========================================="
echo ""

# Clean old builds (keep only new naming convention)
rm -f bin/index bin/index-linux bin/index-win.exe bin/index-macos bin/test-paths* 2>/dev/null

# Build targets with architecture
TARGETS="node20-linux-x64,node20-linux-arm64,node20-win-x64,node20-macos-x64,node20-macos-arm64"

echo "Building for: $TARGETS"
echo ""

# Build with pkg
pkg src/index.js \
  -t "$TARGETS" \
  --compress GZip \
  --options no-warnings \
  --assets "natives/**/*,node_modules/@cs/**/*.wasm,src/transformers.js/dist/*.wasm" \
  --output bin/standalone-context

echo ""
echo "✅ Build complete!"
echo ""
echo "Built binaries:"
ls -lh bin/standalone-context* 2>/dev/null | awk '{print $9, $5}'
echo ""
echo "Total size:"
du -sh bin/standalone-context* 2>/dev/null | awk '{sum+=$1} END {print sum "MB total"}'
