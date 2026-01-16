#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const TARGETS = [
  // Linux
  { platform: 'linux', arch: 'x64', target: 'node20-linux-x64', output: 'index-linux-x64' },
  { platform: 'linux', arch: 'arm64', target: 'node20-linux-arm64', output: 'index-linux-arm64' },
  
  // Windows
  { platform: 'windows', arch: 'x64', target: 'node20-win-x64', output: 'index-win-x64.exe' },
  { platform: 'windows', arch: 'arm64', target: 'node20-win-arm64', output: 'index-win-arm64.exe' },
  
  // macOS
  { platform: 'macos', arch: 'x64', target: 'node20-macos-x64', output: 'index-macos-x64' },
  { platform: 'macos', arch: 'arm64', target: 'node20-macos-arm64', output: 'index-macos-arm64' },
];

console.log('Building for all architectures...\n');

// Prepare natives for all platforms first
console.log('Preparing native modules...');
for (const platform of ['linux', 'windows', 'macos']) {
  try {
    execSync(`node scripts/download-natives.js --platform=${platform}`, { stdio: 'inherit' });
  } catch (err) {
    console.warn(`Warning: Failed to prepare ${platform} natives`);
  }
}

console.log('\nBuilding executables...');

// Build all targets
const targets = TARGETS.map(t => t.target).join(',');

try {
  execSync(`pkg src/index.js -t ${targets} --compress GZip --options no-warnings --assets "natives/**/*,node_modules/@cs/**/*.wasm,src/transformers.js/dist/*.wasm" --out-path bin`, {
    stdio: 'inherit'
  });
  
  console.log('\n✅ Build complete!');
  
  // Show results
  console.log('\nBuilt binaries:');
  execSync('ls -lh bin/index-* bin/*.exe 2>/dev/null | grep -v test-paths || true', { stdio: 'inherit' });
  
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}
