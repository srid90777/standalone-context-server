"use strict";

const fs = require("fs");
const path = require("path");
const os = require("os");
const {
  CACHE_DIR_NAME,
  MODELS_DIR_NAME,
  BLOCKED_LIBRARIES,
} = require("../constants/common.js");

/**
 * Sets up the cache directory for model storage
 * @returns {string} Path to the cache directory
 */
function setupCacheDirectory() {
  const cacheDir = path.join(os.homedir(), CACHE_DIR_NAME, MODELS_DIR_NAME);

  if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true });
  }

  return cacheDir;
}

/**
 * Copies a directory recursively
 * @param {string} src - Source directory path
 * @param {string} dest - Destination directory path
 */
function copyDirectory(src, dest) {
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      if (!fs.existsSync(destPath)) {
        fs.mkdirSync(destPath, { recursive: true });
      }
      copyDirectory(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

/**
 * Determines if a module ID should be blocked
 * @param {string} id - Module identifier
 * @returns {boolean} True if module should be blocked
 */
function shouldBlockModule(id) {
  return BLOCKED_LIBRARIES.some((lib) => id === lib || id.includes(lib));
}

/**
 * Creates a mock ES module for blocked libraries
 * @returns {Object} A minimal ES module interface
 */
function createMockESModule() {
  return {
    default: null,
    __esModule: true,
  };
}

/**
 * Resolves module paths correctly in both development and pkg environments
 * @param {string} relativePath - Relative path from the src directory
 * @returns {string} The resolved absolute path
 */
function resolveModulePath(relativePath) {
  // Check if running in pkg environment
  const isPackaged = process.pkg !== undefined;

  if (isPackaged) {
    // In pkg environment, use the snapshot path
    const snapshotPath = path.join(
      process.cwd(),
      "snapshot",
      "standalone-context",
    );
    return path.join(snapshotPath, "src", relativePath);
  } else {
    // In development, resolve relative to __dirname
    return path.join(__dirname, "..", relativePath);
  }
}

module.exports = {
  setupCacheDirectory,
  copyDirectory,
  shouldBlockModule,
  createMockESModule,
  resolveModulePath,
};
