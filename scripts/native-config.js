/**
 * Native Module Runtime Configuration
 * 
 * This module configures the runtime environment to use manually downloaded native modules
 * instead of npm-resolved dependencies. It should be loaded before any other modules
 * that depend on native binaries.
 */

const path = require('path');
const fs = require('fs');
const os = require('os');

// Determine if we're running in a PKG bundle
const isPKG = typeof process.pkg !== 'undefined';
const isStandalone = isPKG || process.env.STANDALONE_CONTEXT === 'true';

// Get platform-specific natives directory
function getPlatformNativesDir() {
  // Determine base directory
  let baseDir;
  if (isPKG) {
    baseDir = path.dirname(process.execPath);
  } else {
    baseDir = __dirname;
  }

  // Map platform to directory name
  const platformMap = {
    'linux': 'linux',
    'win32': 'windows',
    'darwin': 'macos'
  };

  const platformDir = platformMap[process.platform] || process.platform;
  return path.join(baseDir, 'natives', platformDir);
}

const nativesDir = getPlatformNativesDir();

console.log(`[Native Config] Platform: ${process.platform}-${process.arch}`);
console.log(`[Native Config] Standalone mode: ${isStandalone}`);
console.log(`[Native Config] Base directory: ${isPKG ? path.dirname(process.execPath) : 'project'}`);
console.log(`[Native Config] Natives directory: ${nativesDir}`);

/**
 * Find all .node files in a directory
 */
function findNodeFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  
  try {
    const files = fs.readdirSync(dir);
    return files.filter(f => f.endsWith('.node'));
  } catch (error) {
    return [];
  }
}

/**
 * Find all shared library files (.so, .dll, .dylib)
 */
function findLibraryFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  
  try {
    const files = fs.readdirSync(dir);
    const extensions = ['.so', '.so.1', '.dll', '.dylib'];
    return files.filter(f => extensions.some(ext => f.endsWith(ext)));
  } catch (error) {
    return [];
  }
}

/**
 * Configure ONNX Runtime native module resolution
 */
function configureONNXRuntime() {
  const onnxDir = path.join(nativesDir, 'onnx');
  
  if (!fs.existsSync(onnxDir)) {
    console.log(`[ONNX] Directory not found: ${onnxDir}`);
    return false;
  }

  const nodeFiles = findNodeFiles(onnxDir);
  const libFiles = findLibraryFiles(onnxDir);

  if (nodeFiles.length === 0) {
    console.log(`[ONNX] No .node files found in: ${onnxDir}`);
    return false;
  }

  // Set environment variables for ONNX Runtime
  process.env.ONNXRUNTIME_BINARY_PATH = onnxDir;
  process.env.ORT_BINARY_PATH = onnxDir;
  
  // For pkg bundles, add to LD_LIBRARY_PATH (Linux), DYLD_LIBRARY_PATH (macOS)
  if (isPKG) {
    if (process.platform === 'linux') {
      process.env.LD_LIBRARY_PATH = (process.env.LD_LIBRARY_PATH || '') + ':' + onnxDir;
    } else if (process.platform === 'darwin') {
      process.env.DYLD_LIBRARY_PATH = (process.env.DYLD_LIBRARY_PATH || '') + ':' + onnxDir;
    }
  }

  console.log(`[ONNX] Configured: ${onnxDir}`);
  console.log(`[ONNX] Found ${nodeFiles.length} .node files and ${libFiles.length} library files`);
  
  return true;
}

/**
 * Configure LanceDB native module resolution
 */
function configureLanceDB() {
  const lancedbDir = path.join(nativesDir, 'lancedb');
  
  if (!fs.existsSync(lancedbDir)) {
    console.log(`[LanceDB] Directory not found: ${lancedbDir}`);
    return false;
  }

  const nodeFiles = findNodeFiles(lancedbDir);
  const libFiles = findLibraryFiles(lancedbDir);

  if (nodeFiles.length === 0) {
    console.log(`[LanceDB] No .node files found in: ${lancedbDir}`);
    return false;
  }

  // Set environment variables for LanceDB
  process.env.LANCEDB_BINARY_PATH = lancedbDir;
  process.env.LANCEDB_NATIVE_BINARY = path.join(lancedbDir, nodeFiles[0]);

  // For pkg bundles, add to library path
  if (isPKG) {
    if (process.platform === 'linux') {
      process.env.LD_LIBRARY_PATH = (process.env.LD_LIBRARY_PATH || '') + ':' + lancedbDir;
    } else if (process.platform === 'darwin') {
      process.env.DYLD_LIBRARY_PATH = (process.env.DYLD_LIBRARY_PATH || '') + ':' + lancedbDir;
    }
  }

  console.log(`[LanceDB] Configured: ${lancedbDir}`);
  console.log(`[LanceDB] Found ${nodeFiles.length} .node files and ${libFiles.length} library files`);
  
  return true;
}

/**
 * Configure SQLite3 native module resolution
 */
function configureSQLite3() {
  const sqliteDir = path.join(nativesDir, 'sqlite');
  
  if (!fs.existsSync(sqliteDir)) {
    console.log(`[SQLite] Directory not found: ${sqliteDir}`);
    return false;
  }

  const nodeFiles = findNodeFiles(sqliteDir);

  if (nodeFiles.length === 0) {
    console.log(`[SQLite] No .node files found in: ${sqliteDir}`);
    return false;
  }

  // Set environment variables for SQLite3
  process.env.SQLITE3_BINARY_PATH = sqliteDir;
  process.env.NODE_SQLITE3_BINARY_PATH = sqliteDir;

  console.log(`[SQLite] Configured: ${sqliteDir}`);
  console.log(`[SQLite] Found ${nodeFiles.length} .node files`);
  
  return true;
}

/**
 * Hook into Node.js module resolution for LanceDB
 */
function hookLanceDBModuleResolution() {
  const Module = require('module');
  const originalResolveFilename = Module._resolveFilename;

  Module._resolveFilename = function(request, parent, isMain, options) {
    // Intercept LanceDB module requests
    if (isStandalone && request.includes('@lancedb')) {
      const lancedbDir = path.join(nativesDir, 'lancedb');
      if (fs.existsSync(lancedbDir)) {
        // Try to return the lancedb binding
        try {
          return path.join(lancedbDir, 'lancedb.node');
        } catch (e) {
          // Fallback to original resolution
        }
      }
    }

    return originalResolveFilename.apply(this, arguments);
  };
}

/**
 * Initialize all native module configurations
 */
function initializeNativeModules() {
  console.log(`\n[Native Config] Initializing native modules...`);
  
  const results = {
    onnx: configureONNXRuntime(),
    lancedb: configureLanceDB(),
    sqlite: configureSQLite3()
  };

  if (isStandalone) {
    hookLanceDBModuleResolution();
    console.log(`[Native Config] Module resolution hooks installed`);
  }

  console.log(`[Native Config] Initialization complete\n`);
  
  return results;
}

// Export initialization function and configuration
module.exports = {
  initializeNativeModules,
  isPKG,
  isStandalone,
  nativesDir,
  configureONNXRuntime,
  configureLanceDB,
  configureSQLite3
};

// Auto-initialize when this module is required
if (isStandalone) {
  initializeNativeModules();
}
