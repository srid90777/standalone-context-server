#!/usr/bin/env node

/**
 * Cross-Platform Native Modules Preparation Script
 * 
 * Copies native binaries from node_modules to a platform-specific natives directory
 * for inclusion with pkg binaries.
 * 
 * Usage: node scripts/download-natives.js --platform=<linux|windows|macos>
 */

const fs = require('fs');
const path = require('path');

// Parse arguments
const args = process.argv.slice(2);
const platformArg = args.find(arg => arg.startsWith('--platform='));

if (!platformArg) {
  console.error('[ERROR] Usage: node scripts/download-natives.js --platform=<linux|windows|macos>');
  process.exit(1);
}

const targetPlatform = platformArg.split('=')[1];
const validPlatforms = ['linux', 'windows', 'macos'];

if (!validPlatforms.includes(targetPlatform)) {
  console.error(`[ERROR] Invalid platform: ${targetPlatform}. Must be one of: ${validPlatforms.join(', ')}`);
  process.exit(1);
}

// Setup directories
const ROOT_DIR = path.dirname(__dirname);
const NATIVES_DIR = path.join(ROOT_DIR, 'natives', targetPlatform);
const NODE_MODULES_DIR = path.join(ROOT_DIR, 'node_modules');

// Ensure directory exists
if (!fs.existsSync(NATIVES_DIR)) {
  fs.mkdirSync(NATIVES_DIR, { recursive: true });
}

// Logger
const logger = {
  info: (msg) => console.log(`[INFO] ${msg}`),
  success: (msg) => console.log(`[SUCCESS] ${msg}`),
  error: (msg) => console.error(`[ERROR] ${msg}`),
  warn: (msg) => console.warn(`[WARN] ${msg}`),
};

// Platform-specific source paths in node_modules
const PLATFORM_SOURCES = {
  linux: {
    onnx: {
      source: 'onnxruntime-node/bin/napi-v6/linux/x64',
      outputDir: path.join(NATIVES_DIR, 'onnx'),
    },
    lancedb: {
      source: '@lancedb/lancedb-linux-x64-gnu',
      outputDir: path.join(NATIVES_DIR, 'lancedb'),
    },
    sqlite: {
      source: 'sqlite3/build/Release',
      outputDir: path.join(NATIVES_DIR, 'sqlite'),
    },
  },
  windows: {
    onnx: {
      source: 'onnxruntime-node/bin/napi-v6/win32/x64',
      outputDir: path.join(NATIVES_DIR, 'onnx'),
    },
    lancedb: {
      source: '@lancedb/lancedb-win32-x64-msvc',
      outputDir: path.join(NATIVES_DIR, 'lancedb'),
    },
    sqlite: {
      source: 'sqlite3/build/Release',
      outputDir: path.join(NATIVES_DIR, 'sqlite'),
    },
  },
  macos: {
    onnx: {
      source: 'onnxruntime-node/bin/napi-v6/darwin/x64',
      outputDir: path.join(NATIVES_DIR, 'onnx'),
    },
    lancedb: {
      source: '@lancedb/lancedb-darwin-x64',
      outputDir: path.join(NATIVES_DIR, 'lancedb'),
    },
    sqlite: {
      source: 'sqlite3/build/Release',
      outputDir: path.join(NATIVES_DIR, 'sqlite'),
    },
  },
};

/**
 * Recursively copy directory contents
 */
function copyDir(src, dest) {
  if (!fs.existsSync(src)) {
    return 0;
  }

  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  let count = 0;
  const files = fs.readdirSync(src);

  files.forEach(file => {
    const srcPath = path.join(src, file);
    const destPath = path.join(dest, file);
    const stat = fs.statSync(srcPath);

    if (stat.isDirectory()) {
      count += copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
      logger.info(`  ✓ ${file}`);
      count++;
    }
  });

  return count;
}

/**
 * Prepare natives for target platform
 */
function prepare() {
  const sources = PLATFORM_SOURCES[targetPlatform];

  logger.info(`\nPreparing native modules for ${targetPlatform}...`);
  logger.info(`Target directory: ${NATIVES_DIR}\n`);

  let successCount = 0;

  // ONNX Runtime
  logger.info('--- ONNX Runtime ---');
  const onnxSource = path.join(NODE_MODULES_DIR, sources.onnx.source);
  const onnxCount = copyDir(onnxSource, sources.onnx.outputDir);
  if (onnxCount > 0) {
    logger.success(`ONNX Runtime: copied ${onnxCount} files`);
    successCount++;
  } else {
    logger.warn('ONNX Runtime: no files found in node_modules');
    logger.info('  (This is expected if building from a different platform)');
  }

  // LanceDB
  logger.info('\n--- LanceDB ---');
  const lancedbSource = path.join(NODE_MODULES_DIR, sources.lancedb.source);
  const lancedbCount = copyDir(lancedbSource, sources.lancedb.outputDir);
  if (lancedbCount > 0) {
    logger.success(`LanceDB: copied ${lancedbCount} files`);
    successCount++;
  } else {
    logger.warn('LanceDB: no files found in node_modules');
    logger.info('  (This is expected if building from a different platform)');
  }

  // SQLite3
  logger.info('\n--- SQLite3 ---');
  const sqliteSource = path.join(NODE_MODULES_DIR, sources.sqlite.source);
  const sqliteCount = copyDir(sqliteSource, sources.sqlite.outputDir);
  if (sqliteCount > 0) {
    logger.success(`SQLite3: copied ${sqliteCount} files`);
    successCount++;
  } else {
    logger.warn('SQLite3: no files found in node_modules');
    logger.info('  (This is expected if building from a different platform)');
  }

  // Summary
  logger.info(`\n✓ Native modules preparation completed for ${targetPlatform}`);
  logger.info(`Output directory: ${NATIVES_DIR}`);
  logger.info(`Successfully prepared: ${successCount}/3 module types\n`);
  
  // Show warning if building cross-platform without source binaries
  if (successCount === 0) {
    logger.warn('No source binaries found locally (cross-platform build detected)');
    logger.warn('Ensure you have pkg configured to handle missing binaries gracefully');
  } else if (successCount < 3) {
    logger.warn('Some modules missing - ensure dependencies are available at runtime');
  }
  
  process.exit(0);
}

prepare();
