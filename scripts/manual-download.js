#!/usr/bin/env node

/**
 * Manual Download Script for Native Module Dependencies
 * 
 * This script downloads native modules manually as an alternative to npm-based dependency resolution
 * for packaging with PKG. Based on research of LanceDB, SQLite3, and ONNX Runtime sources.
 * 
 * Usage: node scripts/manual-download.js [--clean] [--verify]
 */

import https from 'https';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

// Configuration
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DOWNLOADS_DIR = path.join(__dirname, '../downloads');
const NATIVES_DIR = path.join(__dirname, '../natives');
const PLATFORM = process.platform; // win32, linux, darwin
const ARCH = process.arch; // x64, arm64, ia32

console.log(`Manual Download Script for ${PLATFORM}-${ARCH}`);
console.log(`Downloads: ${DOWNLOADS_DIR}`);
console.log(`Natives: ${NATIVES_DIR}`);

// Download configurations based on research
const DOWNLOADS = {
  lancedb: {
    enabled: PLATFORM === 'win32' && ARCH === 'x64',
    version: '0.22.0',
    package: '@lancedb/lancedb-win32-x64-msvc',
    url: 'https://registry.npmjs.org/@lancedb/lancedb-win32-x64-msvc/-/lancedb-win32-x64-msvc-0.22.0.tgz',
    expectedSize: 113 * 1024 * 1024, // ~113MB from research
    extractTo: 'lancedb',
    files: ['*.node', '*.dll', 'package.json', 'binding.js'],
    description: 'LanceDB Windows x64 MSVC native binding'
  },
  
  sqlite3_tghost: {
    enabled: true,
    version: '5.1.7',
    package: '@journeyapps/sqlcipher',
    url: 'https://registry.npmjs.org/@journeyapps/sqlcipher/-/sqlcipher-5.1.7.tgz',
    fallbackUrl: 'https://registry.npmjs.org/sqlite3/-/sqlite3-5.1.7.tgz',
    prebuiltUrl: getPrebuildUrl('sqlite3', '5.1.7'),
    extractTo: 'sqlite3-tghost',
    files: ['*.node', 'package.json', 'lib/**'],
    description: 'TryGhost SQLite3 v5.1.7 with prebuild-install support'
  },

  onnxruntime_node: {
    enabled: true,
    version: '1.22.0-rev',
    package: 'onnxruntime-node',
    url: 'https://registry.npmjs.org/onnxruntime-node/-/onnxruntime-node-1.22.0-rev.tgz',
    extractTo: 'onnxruntime-node',
    files: ['bin/**', 'lib/**', '*.node', '*.dll', 'package.json'],
    description: 'ONNX Runtime Node.js binding with native binaries'
  },

  onnxruntime_binaries: {
    enabled: PLATFORM === 'win32',
    version: '1.22.2',
    url: getOnnxRuntimeBinaryUrl('1.22.2'),
    extractTo: 'onnxruntime-binaries',
    files: ['*.dll', '*.exe', 'lib/**', 'include/**'],
    description: 'ONNX Runtime prebuilt binaries from GitHub releases'
  }
};

/**
 * Generate prebuild download URL based on package and platform
 */
function getPrebuildUrl(packageName, version) {
  const platformMap = {
    win32: 'win32',
    linux: 'linux',
    darwin: 'darwin'
  };
  
  const archMap = {
    x64: 'x64',
    ia32: 'ia32',
    arm64: 'arm64'
  };

  const platform = platformMap[PLATFORM] || PLATFORM;
  const arch = archMap[ARCH] || ARCH;
  
  // Different packages use different prebuild URL patterns
  if (packageName === 'sqlite3') {
    return `https://github.com/TryGhost/node-sqlite3/releases/download/v${version}/napi-v6-${platform}-${arch}.tar.gz`;
  }
  
  if (packageName === 'better-sqlite3') {
    return `https://github.com/WiseLibs/better-sqlite3/releases/download/v${version}/better-sqlite3-v${version}-napi-v3-${platform}-${arch}.tar.gz`;
  }
  
  return null;
}

/**
 * Get ONNX Runtime binary download URL from GitHub releases
 */
function getOnnxRuntimeBinaryUrl(version) {
  if (PLATFORM === 'win32') {
    return `https://github.com/microsoft/onnxruntime/releases/download/v${version}/onnxruntime-win-x64-${version}.zip`;
  }
  
  if (PLATFORM === 'linux') {
    return `https://github.com/microsoft/onnxruntime/releases/download/v${version}/onnxruntime-linux-x64-${version}.tgz`;
  }
  
  if (PLATFORM === 'darwin') {
    const archSuffix = ARCH === 'arm64' ? 'arm64' : 'x86_64';
    return `https://github.com/microsoft/onnxruntime/releases/download/v${version}/onnxruntime-osx-${archSuffix}-${version}.tgz`;
  }
  
  return null;
}

/**
 * Create directory structure
 */
function ensureDirectories() {
  [DOWNLOADS_DIR, NATIVES_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`Created directory: ${dir}`);
    }
  });
}

/**
 * Download file with progress
 */
function downloadFile(url, outputPath, expectedSize = null) {
  return new Promise((resolve, reject) => {
    console.log(`Downloading: ${path.basename(outputPath)}`);
    console.log(`URL: ${url}`);
    
    const client = url.startsWith('https:') ? https : http;
    const file = fs.createWriteStream(outputPath);
    
    const request = client.get(url, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        // Handle redirects
        file.close();
        fs.unlinkSync(outputPath);
        return downloadFile(response.headers.location, outputPath, expectedSize)
          .then(resolve)
          .catch(reject);
      }
      
      if (response.statusCode !== 200) {
        file.close();
        fs.unlinkSync(outputPath);
        return reject(new Error(`Download failed: ${response.statusCode} ${response.statusMessage}`));
      }
      
      const totalSize = parseInt(response.headers['content-length']) || expectedSize;
      let downloadedSize = 0;
      
      response.on('data', (chunk) => {
        downloadedSize += chunk.length;
        if (totalSize) {
          const progress = ((downloadedSize / totalSize) * 100).toFixed(1);
          process.stdout.write(`\rProgress: ${progress}% (${formatBytes(downloadedSize)}/${formatBytes(totalSize)})`);
        }
      });
      
      response.on('end', () => {
        // Only resolve when the file has actually been fully written
        file.end();
      });

      file.on('finish', () => {
        file.close();
        
        // Verify that we got all the data we expected
        const stats = fs.statSync(outputPath);
        if (totalSize && stats.size !== totalSize) {
          console.error(`\nDownload incomplete: Expected ${formatBytes(totalSize)}, got ${formatBytes(stats.size)}`);
          fs.unlinkSync(outputPath);
          reject(new Error(`Download incomplete: Expected ${formatBytes(totalSize)}, got ${formatBytes(stats.size)}`));
          return;
        }
        
        console.log(`\nDownloaded: ${path.basename(outputPath)} (${formatBytes(stats.size)})`);
        resolve();
      });

      file.on('error', (err) => {
        file.close();
        if (fs.existsSync(outputPath)) {
          fs.unlinkSync(outputPath);
        }
        reject(err);
      });
      
      response.pipe(file);
    });
    
    request.on('error', (error) => {
      file.close();
      if (fs.existsSync(outputPath)) {
        fs.unlinkSync(outputPath);
      }
      reject(error);
    });
  });
}

/**
 * Extract archive (tar.gz, tgz, zip)
 */
function extractArchive(archivePath, extractDir) {
  return new Promise((resolve, reject) => {
    try {
      console.log(`Extracting: ${path.basename(archivePath)} -> ${extractDir}`);
      
      // First verify the archive integrity
      const ext = path.extname(archivePath).toLowerCase();
      const baseName = path.basename(archivePath, ext);
      let verifyCommand;
      
      if (ext === '.zip') {
        if (PLATFORM === 'win32') {
          // On Windows, there's no easy command to just verify zip file
          // We'll rely on the extraction itself to verify
          verifyCommand = null;
        } else {
          verifyCommand = `unzip -t "${archivePath}"`;
        }
      } else if (ext === '.tgz' || baseName.endsWith('.tar')) {
        verifyCommand = `gzip -t "${archivePath}"`;
      } else {
        throw new Error(`Unsupported archive format: ${ext}`);
      }
      
      if (verifyCommand) {
        console.log(`Verifying archive integrity: ${verifyCommand}`);
        try {
          execSync(verifyCommand, { stdio: 'pipe' });
          console.log(`Archive verified: ${path.basename(archivePath)}`);
        } catch (verifyError) {
          throw new Error(`Archive integrity check failed: ${verifyError.message}`);
        }
      }
      
      if (!fs.existsSync(extractDir)) {
        fs.mkdirSync(extractDir, { recursive: true });
      }
      
      let command;
      if (ext === '.zip') {
        // Use PowerShell on Windows, unzip on Unix
        if (PLATFORM === 'win32') {
          command = `powershell -command "Expand-Archive -Path '${archivePath}' -DestinationPath '${extractDir}' -Force"`;
        } else {
          command = `unzip -o "${archivePath}" -d "${extractDir}"`;
        }
      } else if (ext === '.tgz' || baseName.endsWith('.tar')) {
        command = `tar -xzf "${archivePath}" -C "${extractDir}" --strip-components=1`;
      }
      
      console.log(`Running: ${command}`);
      execSync(command, { stdio: 'pipe' });
      console.log(`Extracted: ${path.basename(archivePath)}`);
      resolve();
    } catch (error) {
      console.error(`Extraction failed: ${error.message}`);
      reject(error);
    }
  });
}

/**
 * Verify downloaded files
 */
function verifyDownload(filePath, config) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }
  
  const stats = fs.statSync(filePath);
  console.log(`File size: ${formatBytes(stats.size)}`);
  
  if (config.expectedSize && Math.abs(stats.size - config.expectedSize) > (config.expectedSize * 0.1)) {
    console.warn(`File size differs from expected: ${formatBytes(config.expectedSize)}`);
  }
  
  // Calculate SHA256 hash for integrity
  const hash = crypto.createHash('sha256');
  const data = fs.readFileSync(filePath);
  hash.update(data);
  const checksum = hash.digest('hex');
  console.log(`SHA256: ${checksum.substring(0, 16)}...`);
  
  return true;
}

/**
 * Copy relevant files to natives directory
 */
function installNatives(sourceDir, config) {
  const targetDir = path.join(NATIVES_DIR, config.extractTo);
  
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }
  
  console.log(`Installing natives: ${sourceDir} -> ${targetDir}`);
  
  // Copy package.json for metadata
  const packageJson = path.join(sourceDir, 'package.json');
  if (fs.existsSync(packageJson)) {
    fs.copyFileSync(packageJson, path.join(targetDir, 'package.json'));
  }
  
  // Special handling for SQLite3
  if (config.extractTo.includes('sqlite3')) {
    // Check common SQLite3 binary locations
    const commonLocations = [
      'build/Release',
      'lib/binding/napi-v6/linux-x64',
      'lib/binding/node-v120-linux-x64',
      'lib/binding',
      'prebuilds/linux-x64'
    ];
    
    let sqliteNativeFound = false;
    
    for (const location of commonLocations) {
      const binDir = path.join(sourceDir, location);
      if (fs.existsSync(binDir)) {
        const binFiles = findFiles(binDir, ['.node', '.dll', '.so', '.dylib']);
        if (binFiles.length > 0) {
          console.log(`  Found SQLite binaries in ${location}`);
          
          for (const file of binFiles) {
            // Keep directory structure from the binary location
            const relativePath = path.relative(binDir, file);
            const targetFile = path.join(targetDir, location, relativePath);
            const targetFileDir = path.dirname(targetFile);
            
            if (!fs.existsSync(targetFileDir)) {
              fs.mkdirSync(targetFileDir, { recursive: true });
            }
            
            fs.copyFileSync(file, targetFile);
            console.log(`  ${location}/${relativePath}`);
            sqliteNativeFound = true;
          }
        }
      }
    }
    
    if (!sqliteNativeFound) {
      console.log('  No SQLite3 native binaries found in common locations');
      
      // Try to find any *.node files in the entire directory
      const allNodeFiles = findFiles(sourceDir, ['.node']);
      if (allNodeFiles.length > 0) {
        console.log('  Found .node files in other locations:');
        allNodeFiles.forEach(file => {
          const relativePath = path.relative(sourceDir, file);
          console.log(`  ${relativePath}`);
          
          const targetFile = path.join(targetDir, relativePath);
          const targetFileDir = path.dirname(targetFile);
          
          if (!fs.existsSync(targetFileDir)) {
            fs.mkdirSync(targetFileDir, { recursive: true });
          }
          
          fs.copyFileSync(file, targetFile);
          console.log(`  ${relativePath}`);
        });
      } else {
        console.log('  No .node files found in the entire package');
      }
    }
    
    // Copy lib directory regardless (contains important JS files for sqlite3)
    const libDir = path.join(sourceDir, 'lib');
    if (fs.existsSync(libDir)) {
      copyDirectory(libDir, path.join(targetDir, 'lib'));
      console.log('lib directory (JS files)');
    }
    
    return; // Skip regular native files processing for SQLite
  }
  
  // Find and copy native files (for non-SQLite packages)
  const nativeFiles = findFiles(sourceDir, ['.node', '.dll', '.so', '.dylib']);
  let copiedCount = 0;
  
  nativeFiles.forEach(file => {
    const relativePath = path.relative(sourceDir, file);
    const targetFile = path.join(targetDir, relativePath);
    const targetFileDir = path.dirname(targetFile);
    
    if (!fs.existsSync(targetFileDir)) {
      fs.mkdirSync(targetFileDir, { recursive: true });
    }
    
    fs.copyFileSync(file, targetFile);
    console.log(`${relativePath}`);
    copiedCount++;
  });
  
  console.log(`Installed ${copiedCount} native files`);
  return copiedCount;
}

/**
 * Find files with specific extensions
 */
function findFiles(dir, extensions) {
  const files = [];
  
  function scanDir(currentDir) {
    const items = fs.readdirSync(currentDir);
    
    items.forEach(item => {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        scanDir(fullPath);
      } else {
        const ext = path.extname(item);
        if (extensions.includes(ext)) {
          files.push(fullPath);
        }
      }
    });
  }
  
  if (fs.existsSync(dir)) {
    scanDir(dir);
  }
  
  return files;
}

/**
 * Recursively copy a directory
 */
function copyDirectory(sourceDir, targetDir) {
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }
  
  const items = fs.readdirSync(sourceDir);
  
  for (const item of items) {
    const sourcePath = path.join(sourceDir, item);
    const targetPath = path.join(targetDir, item);
    
    if (fs.statSync(sourcePath).isDirectory()) {
      copyDirectory(sourcePath, targetPath);
    } else {
      fs.copyFileSync(sourcePath, targetPath);
    }
  }
}

/**
 * Format bytes for display
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

/**
 * Clean up downloads and natives directories
 */
function cleanup() {
  console.log('Cleaning up...');
  
  [DOWNLOADS_DIR, NATIVES_DIR].forEach(dir => {
    if (fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true, force: true });
      console.log(`Removed: ${dir}`);
    }
  });
}

/**
 * Main download process
 */

/**
 * Download prebuilt SQLite3 binaries directly from GitHub releases
 */
async function downloadSqlitePrebuilts(config) {
  try {
    const platform = PLATFORM === 'win32' ? 'win32' : (PLATFORM === 'darwin' ? 'darwin' : 'linux');
    const arch = ARCH;
    
    // Try multiple potential URLs for prebuilt SQLite binaries
    const urls = [
      // TryGhost node-sqlite3 (original)
      `https://github.com/TryGhost/node-sqlite3/releases/download/v${config.version}/napi-v6-${platform}-${arch}.tar.gz`,
      
      // WiseLibs better-sqlite3
      `https://github.com/WiseLibs/better-sqlite3/releases/download/v7.6.0/better-sqlite3-v7.6.0-napi-v6-${platform}-${arch}.tar.gz`,
      
      // Standard node-sqlite3
      `https://github.com/mapbox/node-sqlite3/releases/download/v${config.version}/node-v93-${platform}-${arch}.tar.gz`,
      `https://github.com/mapbox/node-sqlite3/releases/download/v${config.version}/napi-v6-${platform}-${arch}.tar.gz`,
      
      // Try prebuildify format
      `https://github.com/sqlite3/sqlite3/releases/download/v${config.version}/sqlite3-v${config.version}-node-v93-${platform}-${arch}.tar.gz`
    ];
    
    let succeeded = false;
    
    for (const url of urls) {
      try {
        console.log(`\nTrying SQLite3 prebuilt URL: ${url}`);
        const outputPath = path.join(DOWNLOADS_DIR, `sqlite3_prebuilt-${path.basename(url)}`);
        
        await downloadFile(url, outputPath);
        
        const extractDir = path.join(DOWNLOADS_DIR, 'sqlite3_prebuilt-extracted');
        if (!fs.existsSync(extractDir)) {
          fs.mkdirSync(extractDir, { recursive: true });
        } else {
          // Clean up existing extracted files
          fs.rmSync(extractDir, { recursive: true, force: true });
          fs.mkdirSync(extractDir, { recursive: true });
        }
        
        await extractArchive(outputPath, extractDir);
        
        // Copy to natives directory
        const targetDir = path.join(NATIVES_DIR, config.extractTo);
        if (!fs.existsSync(targetDir)) {
          fs.mkdirSync(targetDir, { recursive: true });
        }
        
        // Copy node file
        const nodeFiles = findFiles(extractDir, ['.node']);
        if (nodeFiles.length > 0) {
          for (const file of nodeFiles) {
            const filename = path.basename(file);
            const targetFile = path.join(targetDir, 'build', 'Release', filename);
            const targetFileDir = path.dirname(targetFile);
            
            if (!fs.existsSync(targetFileDir)) {
              fs.mkdirSync(targetFileDir, { recursive: true });
            }
            
            fs.copyFileSync(file, targetFile);
            console.log(`build/Release/${filename} (prebuilt)`);
          }
          console.log(`Installed SQLite3 prebuilt binary for ${platform}-${arch}`);
          succeeded = true;
          break; // Exit the loop on success
        } else {
          console.error(`No .node files found in prebuilt package`);
        }
      } catch (urlError) {
        console.error(`Failed with this URL: ${urlError.message}`);
        // Continue to the next URL
      }
    }
    
    return succeeded;
  } catch (error) {
    console.error(`Failed to download prebuilt SQLite3 binaries: ${error.message}`);
    return false;
  }
}

async function downloadDependencies() {
  ensureDirectories();
  
  const enabledDownloads = Object.entries(DOWNLOADS).filter(([, config]) => config.enabled);
  
  if (enabledDownloads.length === 0) {
    console.log(`No downloads enabled for ${PLATFORM}-${ARCH}`);
    return;
  }

  console.log(`Found ${enabledDownloads.length} downloads for this platform`);

  for (const [key, config] of enabledDownloads) {
    console.log(`\nProcessing: ${config.description}`);

    try {
      // Download
      const filename = path.basename(config.url);
      const downloadPath = path.join(DOWNLOADS_DIR, `${key}-${filename}`);
      
      if (!fs.existsSync(downloadPath)) {
        await downloadFile(config.url, downloadPath, config.expectedSize);
      } else {
        console.log(`Already downloaded: ${filename}`);
      }
      
      // Verify
      verifyDownload(downloadPath, config);
      
      // Extract
      const extractDir = path.join(DOWNLOADS_DIR, `${key}-extracted`);
      if (!fs.existsSync(extractDir) || fs.readdirSync(extractDir).length === 0) {
        await extractArchive(downloadPath, extractDir);
      } else {
        console.log(`Already extracted: ${key}`);
      }
      
      // Install natives
      installNatives(extractDir, config);
      
      // Special handling for SQLite3 - get prebuilt binaries directly from GitHub
      if (key === 'sqlite3_tghost') {
        await downloadSqlitePrebuilts(config);
      }
      
      console.log(`Completed: ${config.description}\n`);
      
    } catch (error) {
      console.error(`Failed to process ${key}: ${error.message}`);
      
      // Try fallback URL if available
      if (config.fallbackUrl || config.prebuiltUrl) {
        const fallbackUrl = config.fallbackUrl || config.prebuiltUrl;
        console.log(`Trying fallback URL: ${fallbackUrl}`);

        try {
          const fallbackFilename = path.basename(fallbackUrl);
          const fallbackPath = path.join(DOWNLOADS_DIR, `${key}-fallback-${fallbackFilename}`);
          
          await downloadFile(fallbackUrl, fallbackPath);
          
          const fallbackExtractDir = path.join(DOWNLOADS_DIR, `${key}-fallback-extracted`);
          await extractArchive(fallbackPath, fallbackExtractDir);
          installNatives(fallbackExtractDir, config);
          
          // Special handling for SQLite3 after fallback
          if (key === 'sqlite3_tghost') {
            await downloadSqlitePrebuilts(config);
          }
          
          console.log(`Fallback successful: ${config.description}\n`);
        } catch (fallbackError) {
          console.error(`Fallback also failed: ${fallbackError.message}\n`);
          
          // As a last resort for SQLite3, try direct prebuilt download
          if (key === 'sqlite3_tghost') {
            await downloadSqlitePrebuilts(config);
          }
        }
      }
    }
  }
}

/**
 * Generate setup instructions
 */
function generateSetupInstructions() {
  const instructionsPath = path.join(NATIVES_DIR, 'SETUP.md');
  
  const instructions = `# Manual Native Dependencies Setup

This directory contains manually downloaded native dependencies for standalone context provider packaging.

## Generated on
- Platform: ${PLATFORM}
- Architecture: ${ARCH}
- Date: ${new Date().toISOString()}

## Components

### LanceDB (@lancedb/lancedb-win32-x64-msvc)
- Version: 0.22.0
- Platform: Windows x64 MSVC
- Files: lancedb.win32-x64-msvc.node, supporting DLLs
- Purpose: Vector database native binding

### SQLite3 (TryGhost/node-sqlite3)
- Version: 5.1.7
- Uses: prebuild-install for binary distribution
- Platform support: win32-x64, linux-x64, darwin-x64/arm64
- Alternative: better-sqlite3 v12.2.0

### ONNX Runtime (onnxruntime-node)
- Version: 1.22.0-rev
- Platform support: Multi-platform with WebGPU, DirectML, CUDA
- Files: Native binaries, shared libraries
- Weekly downloads: ~389k (very stable)

## PKG Configuration

Update your config.json assets section:

\`\`\`json
{
  "assets": [
    "natives/lancedb/**/*",
    "natives/sqlite3-*/**/*",
    "natives/onnxruntime-*/**/*",
    "natives/better-sqlite3/**/*"
  ]
}
\`\`\`

## Usage in Code

\`\`\`javascript
// Prefer manual natives over npm modules
const nativesDir = path.join(__dirname, 'natives');

// LanceDB
process.env.LANCEDB_BINARY_PATH = path.join(nativesDir, 'lancedb');

// SQLite3
process.env.SQLITE3_BINARY_PATH = path.join(nativesDir, 'sqlite3-tghost');

// ONNX Runtime
process.env.ONNXRUNTIME_BINARY_PATH = path.join(nativesDir, 'onnxruntime-node');
\`\`\`

## Research Sources

- LanceDB: npm registry @lancedb/lancedb-win32-x64-msvc v0.22.0
- SQLite3: TryGhost/node-sqlite3 GitHub releases, prebuild-install system
- ONNX Runtime: Microsoft/onnxruntime GitHub releases, npm onnxruntime-node

Generated by manual-download.js script.
`;

  fs.writeFileSync(instructionsPath, instructions);
  console.log(`Generated setup instructions: ${instructionsPath}`);
}

/**
 * Main execution
 */
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--clean')) {
    cleanup();
    return;
  }
  
  try {
    await downloadDependencies();
    generateSetupInstructions();
    
    console.log(`\nManual download completed successfully!`);
    console.log(`Native files available in: ${NATIVES_DIR}`);
    console.log(`See SETUP.md for integration instructions`);
    
    if (args.includes('--verify')) {
      console.log(`\nVerification mode - listing downloaded files:`);
      const nativeFiles = findFiles(NATIVES_DIR, ['.node', '.dll', '.so', '.dylib']);
      nativeFiles.forEach(file => {
        const stats = fs.statSync(file);
        console.log(`  ${path.relative(NATIVES_DIR, file)} (${formatBytes(stats.size)})`);
      });
    }
    
  } catch (error) {
    console.error(`Fatal error: ${error.message}`);
    process.exit(1);
  }
}

// Handle interruption gracefully
process.on('SIGINT', () => {
  console.log('\nDownload interrupted by user');
  process.exit(1);
});

process.on('SIGTERM', () => {
  console.log('\nDownload terminated');
  process.exit(1);
});

// Check if this is the main module being run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

// Export functions and variables for potential import from other modules
export {
  downloadDependencies,
  cleanup,
  DOWNLOADS_DIR,
  NATIVES_DIR,
  DOWNLOADS
};
