#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const utils = require("../src/utils/file-utils.js");

const rootDir = path.join(__dirname, "..");
const csTreeSitterRoot = path.join(
  rootDir,
  "node_modules",
  "@cs",
  "tree-sitter",
);
const deepContextUtilsRoot = path.join(
  csTreeSitterRoot,
  "node_modules",
  "@cs",
  "context-utils",
  "dist",
  "lib",
  "node_modules",
);

function log(msg) {
  console.log(msg);
}

function fail(msg, extraPath) {
  console.warn("[WARNING] " + msg + (extraPath ? `: ${extraPath}` : ""));
  // Do not fail the build, just warn
  // process.exit(1);
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function copyFile(src, dest) {
  ensureDir(path.dirname(dest));
  fs.copyFileSync(src, dest);
  log(`Copied ${path.basename(src)} -> ${dest}`);
}

function resolveTreeSitterWasmSource() {
  return path.join(
    rootDir,
    "node_modules",
    "web-tree-sitter",
    "tree-sitter.wasm",
  );
}

function getSingleWasmTargets() {
  return [
    path.join(deepContextUtilsRoot, "web-tree-sitter", "tree-sitter.wasm"),
    path.join(
      rootDir,
      "dist",
      "node_modules",
      "web-tree-sitter",
      "tree-sitter.wasm",
    ),
  ];
}

function copySingleWasm() {
  const src = resolveTreeSitterWasmSource();
  if (!fs.existsSync(src)) fail("Source tree-sitter.wasm not found", src);
  for (const target of getSingleWasmTargets()) copyFile(src, target);
}

function resolveGrammarSourceDir() {
  return path.join(csTreeSitterRoot, "tree-sitter-wasms");
}

function resolveGrammarDestDir() {
  return path.join(
    deepContextUtilsRoot,
    "@cs",
    "tree-sitter",
    "tree-sitter-wasms",
  );
}

function copyGrammarDirectory() {
  const srcDir = resolveGrammarSourceDir();
  if (!fs.existsSync(srcDir))
    fail("Tree-sitter WASMs directory not found", srcDir);
  const destDir = resolveGrammarDestDir();
  ensureDir(destDir);
  utils.copyDirectory(srcDir, destDir);
  log(`Copied grammar WASMs -> ${destDir}`);
}

function run() {
  copySingleWasm();
  copyGrammarDirectory();
  log("WASM setup completed successfully");
}

run();
