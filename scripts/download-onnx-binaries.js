#!/usr/bin/env node

// Download ONNX Runtime binaries for Windows and macOS from npm packages
const https = require('https');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const VERSION = '1.22.0-rev';

// ONNX Runtime has separate packages but we'll use a different approach
// Since onnxruntime-node uses a postinstall script to download binaries,
// we'll manually trigger downloads for other platforms

const platforms = [
  { name: 'windows', npmPlatform: 'win32', arch: 'x64', files: ['onnxruntime_binding.node'] },
  { name: 'macos', npmPlatform: 'darwin', arch: 'x64', files: ['onnxruntime_binding.node'] }
];

console.log('ONNX Runtime Cross-Platform Binary Download\n');
console.log('Note: ONNX Runtime Node.js binding uses platform-specific native modules.');
console.log('The package includes binaries for all platforms, but npm only extracts the current platform.\n');

// Alternative approach: copy from package tarball
console.log('Downloading onnxruntime-node tarball...');

const tarballUrl = `https://registry.npmjs.org/onnxruntime-node/-/onnxruntime-node-${VERSION}.tgz`;
const tarballPath = '/tmp/onnxruntime-node.tgz';

const download = (url, dest) => {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        // Follow redirect
        https.get(response.headers.location, (res) => {
          res.pipe(file);
          file.on('finish', () => {
            file.close();
            resolve();
          });
        }).on('error', reject);
      } else {
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve();
        });
      }
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
};

(async () => {
  try {
    console.log(`Downloading from: ${tarballUrl}`);
    await download(tarballUrl, tarballPath);
    console.log('✓ Tarball downloaded\n');

    // Extract tarball
    const extractDir = '/tmp/onnxruntime-extract';
    if (fs.existsSync(extractDir)) {
      fs.rmSync(extractDir, { recursive: true });
    }
    fs.mkdirSync(extractDir, { recursive: true });

    console.log('Extracting tarball...');
    execSync(`tar -xzf ${tarballPath} -C ${extractDir}`);
    console.log('✓ Extracted\n');

    // Check what's inside
    const packageDir = path.join(extractDir, 'package');
    const binDir = path.join(packageDir, 'bin');

    if (fs.existsSync(binDir)) {
      console.log('Checking bin directory structure:');
      execSync(`find ${binDir} -type f`, { stdio: 'inherit' });
      console.log('');
    }

    // List napi versions available
    const napiDirs = fs.readdirSync(binDir).filter(d => d.startsWith('napi-'));
    console.log(`Available NAPI versions: ${napiDirs.join(', ')}`);

    // Try to find platform-specific binaries
    for (const napi of napiDirs) {
      const napiPath = path.join(binDir, napi);
      if (fs.existsSync(napiPath)) {
        const platforms = fs.readdirSync(napiPath);
        console.log(`${napi}: ${platforms.join(', ')}`);
      }
    }

    console.log('\nNote: The npm package only includes binaries for supported platforms at publish time.');
    console.log('Platform-specific binaries may be downloaded during postinstall.\n');

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
})();
