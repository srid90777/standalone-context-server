#!/bin/bash

echo "Preparing native modules for all platforms and architectures..."
echo "================================================================"

# Install ARM64 binaries
echo -e "\nInstalling ARM64 LanceDB packages..."
npm install --no-save --force --ignore-scripts \
  @lancedb/lancedb-linux-arm64-gnu \
  @lancedb/lancedb-darwin-arm64 \
  @lancedb/lancedb-win32-arm64-msvc 2>/dev/null || echo "Some ARM64 packages not available"

# Copy natives for each platform
echo -e "\nCopying native modules..."

for platform in linux windows macos; do
  echo -e "\n--- $platform ---"
  node scripts/download-natives.js --platform=$platform
done

echo -e "\n✅ Native preparation complete!"
echo -e "\nNative modules summary:"
find bin/natives -type f -name "*.node" -o -name "*.dll" -o -name "*.so*" -o -name "*.dylib" | \
  awk -F/ '{print $3"/"$4"/"$5}' | sort | uniq -c
