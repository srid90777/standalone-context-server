#!/usr/bin/env node
/**
 * Script to patch transformers.js for compatibility with PKG
 */

"use strict";

const fs = require("fs");
const path = require("path");

/**
 * Checks if a file or directory exists
 * @param {string} filePath - Path to check
 * @param {string} description - Description for logging
 * @returns {boolean} - Whether the path exists
 */
function checkPathExists(filePath, description) {
  if (!fs.existsSync(filePath)) {
    console.error(`${description} not found:`, filePath);
    return false;
  }
  return true;
}

/**
 * Patches package.json files for ONNX runtime packages
 * @param {string} basePath - Base path to node_modules directory
 */
function patchOnnxRuntimePackages(basePath) {
  const packagesToPatch = [
    "onnxruntime-common",
    "onnxruntime-node",
    "onnxruntime-web",
  ];

  for (const packageName of packagesToPatch) {
    const packageJsonPath = path.join(basePath, packageName, "package.json");
    if (fs.existsSync(packageJsonPath)) {
      try {
        let packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));

        // Change from ES module to CommonJS to fix the require() error
        delete packageJson.type;
        fs.writeFileSync(
          packageJsonPath,
          JSON.stringify(packageJson, null, 2),
          "utf8",
        );
        console.log(`Successfully patched ${packageName} package.json`);
      } catch (error) {
        console.log(
          `Could not patch ${packageName} package.json:`,
          error.message,
        );
      }
    }
  }
}

/**
 * Patch node modules in a specific path
 * @param {string} modulesPath - Path to node_modules directory
 * @param {string} description - Description for logging
 */
function patchNodeModules(modulesPath, description) {
  if (fs.existsSync(modulesPath)) {
    patchOnnxRuntimePackages(modulesPath);
  } else {
    console.log(`${description} not found, skipping patch`);
  }
}

/**
 * Patches the import statement in the embedding index file
 * @param {string} filePath - Path to the embedding index file
 * @returns {boolean} - Whether the patch was successful
 */
function patchEmbeddingImport(filePath) {
  let content = fs.readFileSync(filePath, "utf8");

  const originalImport = `const module = await import('@xenova/transformers');`;
  const newImport = `const module = require('../../../../../transformers-pkg-compat.js');`;

  if (content.includes(originalImport)) {
    content = content.replace(originalImport, newImport);
    fs.writeFileSync(filePath, content, "utf8");
    console.log(
      "Successfully patched import statement in embedding index file",
    );
    return true;
  } else if (content.includes(newImport)) {
    console.log("Embedding index file already patched, skipping");
    return true;
  } else {
    console.warn(
      "Could not find expected import statement in embedding index file",
    );
    logFoundImportLines(content);
    return false;
  }
}

/**
 * Logs found import lines for debugging
 * @param {string} content - File content to search
 */
function logFoundImportLines(content) {
  const importLines = content
    .split("\n")
    .filter(
      (line) =>
        line.includes("@xenova/transformers") ||
        line.includes("transformers-pkg-compat"),
    );
  if (importLines.length > 0) {
    console.log("Found these import lines instead:");
    importLines.forEach((line) => console.log("  ", line.trim()));
  }
}

/**
 * Main function to patch the embedding module to use our custom transformers.js implementation
 */
function main() {
  const embeddingIndexPath = path.join(
    __dirname,
    "../node_modules/@cs/embedding/dist/lib/index.js",
  );

  if (!checkPathExists(embeddingIndexPath, "Embedding index file")) {
    process.exit(0);
  }

  // Patch transformers node modules if they exist
  const transformersNodeModulesPath = path.join(
    __dirname,
    "../src/transformers.js/node_modules",
  );
  patchNodeModules(transformersNodeModulesPath, "Transformers node_modules");

  // Patch main node modules if they exist
  const mainNodeModulesPath = path.join(__dirname, "../node_modules");
  patchNodeModules(mainNodeModulesPath, "Main node_modules");

  // Replace the import statement in the embedding index file
  patchEmbeddingImport(embeddingIndexPath);

  console.log(
    "Patching complete for @cs/embedding to use PKG-compatible transformers.js",
  );
}

main();
