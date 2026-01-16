#!/usr/bin/env node

/**
 * Download ONNX Runtime binaries for all platforms
 * ONNX Runtime Node.js uses platform-specific native bindings
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const VERSION = '1.22.0';
const BASE_DIR = path.join(__dirname, '..');

// GitHub releases provide the core libraries
const GITHUB_RELEASES = {
  'windows-x64': {
    url: `https://github.com/microsoft/onnxruntime/releases/download/v${VERSION}/onnxruntime-win-x64-${VERSION}.zip`,
    files: ['lib/onnxruntime.dll', 'lib/onnxruntime_providers_shared.dll']
  },
  'darwin-x64': {
    url: `https://github.com/microsoft/onnxruntime/releases/download/v${VERSION}/onnxruntime-osx-x86_64-${VERSION}.tgz`,
    files: ['lib/libonnxruntime.dylib', 'lib/libonnxruntime_providers_shared.dylib']
  },
  'darwin-arm64': {
    url: `https://github.com/microsoft/onnxruntime/releases/download/v${VERSION}/onnxruntime-osx-arm64-${VERSION}.tgz`,
    files: ['lib/libonnxruntime.dylib', 'lib/libonnxruntime_providers_shared.dylib']
  }
};

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const file = fs.createWriteStream(dest);
    
    console.log(`Downloading: ${url}`);
    
    protocol.get(url, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        file.close();
        fs.unlinkSync(dest);
        download(response.headers.location, dest).then(resolve).catch(reject);
        return;
      }
      
      if (response.statusCode !== 200) {
        file.close();
        fs.unlinkSync(dest);
        reject(new Error(`Failed to download: ${response.statusCode}`));
        return;
      }
      
      const totalSize = parseInt(response.headers['content-length'], 10);
      let downloaded = 0;
      
      response.on('data', (chunk) => {
        downloaded += chunk.length;
        const percent = ((downloaded / totalSize) * 100).toFixed(1);
        process.stdout.write(`\r  Progress: ${percent}%`);
      });
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        console.log('\n  ✓ Download complete');
        resolve();
      });
      
      file.on('error', (err) => {
        file.close();
        fs.unlinkSync(dest);
        reject(err);
      });
    }).on('error', (err) => {
      file.close();
      fs.unlinkSync(dest);
      reject(err);
    });
  });
}

async function extractArchive(archivePath, extractDir) {
  console.log(`Extracting: ${path.basename(archivePath)}`);
  
  if (archivePath.endsWith('.zip')) {
    execSync(`unzip -q "${archivePath}" -d "${extractDir}"`);
  } else if (archivePath.endsWith('.tgz') || archivePath.endsWith('.tar.gz')) {
    execSync(`tar -xzf "${archivePath}" -C "${extractDir}"`);
  }
  
  console.log('  ✓ Extraction complete');
}

async function downloadONNXForPlatform(platform, config) {
  console.log(`\n=== Processing ${platform} ===`);
  
  const tempDir = path.join('/tmp', `onnx-${platform}`);
  const archivePath = path.join('/tmp', `onnx-${platform}${config.url.endsWith('.zip') ? '.zip' : '.tgz'}`);
  
  // Clean up
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true });
  }
  fs.mkdirSync(tempDir, { recursive: true });
  
  // Download
  await download(config.url, archivePath);
  
  // Extract
  await extractArchive(archivePath, tempDir);
  
  // Find extracted directory
  const extractedDirs = fs.readdirSync(tempDir);
  const extractedRoot = path.join(tempDir, extractedDirs[0]);
  
  // Copy files to natives directory
  const platformName = platform.startsWith('darwin') ? 'macos' : 'windows';
  const nativesDir = path.join(BASE_DIR, 'bin', 'natives', platformName, 'onnx');
  
  if (!fs.existsSync(nativesDir)) {
    fs.mkdirSync(nativesDir, { recursive: true });
  }
  
  console.log(`Copying binaries to: ${nativesDir}`);
  
  for (const file of config.files) {
    const srcPath = path.join(extractedRoot, file);
    const destPath = path.join(nativesDir, path.basename(file));
    
    if (fs.existsSync(srcPath)) {
      fs.copyFileSync(srcPath, destPath);
      console.log(`  ✓ ${path.basename(file)}`);
    } else {
      console.warn(`  ⚠ Not found: ${file}`);
    }
  }
  
  // Clean up
  fs.unlinkSync(archivePath);
  fs.rmSync(tempDir, { recursive: true });
}

async function main() {
  console.log('ONNX Runtime Cross-Platform Binary Downloader');
  console.log('==============================================\n');
  console.log(`Version: ${VERSION}`);
  console.log('Platforms: Windows x64, macOS x64, macOS ARM64\n');
  
  try {
    for (const [platform, config] of Object.entries(GITHUB_RELEASES)) {
      await downloadONNXForPlatform(platform, config);
    }
    
    console.log('\n✅ All ONNX Runtime binaries downloaded successfully!');
    console.log('\nNote: These are the core libraries. Node.js bindings (.node files)');
    console.log('are platform-specific and included in onnxruntime-node package.');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

main();
