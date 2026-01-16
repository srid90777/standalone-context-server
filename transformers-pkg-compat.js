/**
 * Compatibility layer for transformers.js
 *
 * This module provides:
 * 1. Custom cache directory configuration
 * 2. Module import compatibility for ESM/CJS conflicts
 * 3. Image processing library blocking
 */

const fs = require("fs");
const path = require("path");
const { ERR_REQUIRE_ESM } = require("./src/constants/common.js");
const utils = require("./src/utils/file-utils.js");

// Set up cache directory early to avoid permission issues
const cacheDir = utils.setupCacheDirectory();

// Patch module loading system
const Module = require("module");
const originalRequire = Module.prototype.require;

Module.prototype.require = function (id) {
  // Block image processing libraries
  if (utils.shouldBlockModule(id)) {
    return utils.createMockESModule();
  }

  // Handle onnxruntime-common ES module conflicts
  if (id === "onnxruntime-common") {
    try {
      return originalRequire.call(this, id);
    } catch (error) {
      if (error.code === ERR_REQUIRE_ESM) {
        const onnxCommonPath = require.resolve(
          "onnxruntime-common/dist/cjs/index.js",
        );
        return originalRequire.call(this, onnxCommonPath);
      }
      throw error;
    }
  }

  return originalRequire.call(this, id);
};

// Load transformers library
let transformers;
try {
  transformers = require("./src/transformers.js/dist/transformers.node.cjs");
} catch (error) {
  console.error("Failed to load transformers library:", error.message);
  transformers = {};
}

// Configure transformers environment if available
if (transformers && transformers.env && typeof transformers.env === "object") {
  transformers.env.cacheDir = cacheDir;
  transformers.env.allowImageProcessing = false;
}

module.exports = transformers;
