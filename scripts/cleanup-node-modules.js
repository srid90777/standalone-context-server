#!/usr/bin/env node

/**
 * Cleanup Node Modules Script
 * Removes OS-specific binaries that are not needed for the target platform
 * This significantly reduces pkg build size
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// Logger utility
const logger = {
  info: (message) => console.log(`[CLEANUP] ${message}`),
  success: (message) => console.log(`[CLEANUP SUCCESS] ${message}`),
  error: (message) => console.error(`[CLEANUP ERROR] ${message}`),
  warn: (message) => console.warn(`[CLEANUP WARN] ${message}`),
};

/**
 * Platform mapping for different naming conventions
 */
const PLATFORM_MAPPINGS = {
  linux: {
    keep: ["linux", "x64", "gnu", "musl"],
    remove: ["win32", "darwin", "macos", "arm64", "ia32"],
    lancedb: "@lancedb/lancedb-linux-x64-gnu",
    sharp: ["@img/sharp-linux-x64", "@img/sharp-linuxmusl-x64", "@img/sharp-libvips-linux-x64", "@img/sharp-libvips-linuxmusl-x64"],
    onnx: ["linux/x64"],
  },
  windows: {
    keep: ["win32", "x64", "msvc"],
    remove: ["linux", "darwin", "macos", "gnu", "musl", "arm64", "ia32"],
    lancedb: "@lancedb/lancedb-win32-x64-msvc",
    sharp: ["@img/sharp-win32-x64"],
    onnx: ["win32/x64"],
  },
  macos: {
    keep: ["darwin", "macos", "x64"],
    remove: ["linux", "win32", "gnu", "musl", "msvc", "arm64", "ia32"],
    lancedb: null, // No specific LanceDB package for macOS in current config
    sharp: ["@img/sharp-darwin-x64"], // Assuming this exists
    onnx: ["darwin/x64"],
  },
};

/**
 * Get node_modules path
 */
function getNodeModulesPath() {
  return path.resolve(process.cwd(), "node_modules");
}

/**
 * Check if a directory exists
 */
function directoryExists(dirPath) {
  return fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory();
}

/**
 * Get directory size in MB
 */
function getDirectorySize(dirPath) {
  if (!directoryExists(dirPath)) return 0;
  
  try {
    const result = execSync(`du -sm "${dirPath}"`, { encoding: 'utf8' });
    return parseInt(result.split('\t')[0]);
  } catch (error) {
    return 0;
  }
}

/**
 * Remove directory safely
 */
function removeDirectory(dirPath) {
  if (directoryExists(dirPath)) {
    const sizeBefore = getDirectorySize(dirPath);
    try {
      execSync(`rm -rf "${dirPath}"`, { stdio: 'inherit' });
      logger.success(`Removed ${dirPath} (saved ${sizeBefore}MB)`);
      return sizeBefore;
    } catch (error) {
      logger.error(`Failed to remove ${dirPath}: ${error.message}`);
      return 0;
    }
  }
  return 0;
}

/**
 * Clean up LanceDB packages for other platforms
 */
function cleanupLanceDB(platform) {
  const nodeModulesPath = getNodeModulesPath();
  const lancedbPath = path.join(nodeModulesPath, "@lancedb");
  
  if (!directoryExists(lancedbPath)) {
    logger.warn("LanceDB packages not found");
    return 0;
  }

  const platformConfig = PLATFORM_MAPPINGS[platform];
  const keepPackage = platformConfig.lancedb;
  let savedSpace = 0;

  const lancedbPackages = fs.readdirSync(lancedbPath);
  
  for (const pkg of lancedbPackages) {
    const fullPkgName = `@lancedb/${pkg}`;
    if (fullPkgName !== keepPackage && pkg.includes("lancedb-")) {
      const pkgPath = path.join(lancedbPath, pkg);
      savedSpace += removeDirectory(pkgPath);
    }
  }

  return savedSpace;
}

/**
 * Clean up Sharp packages for other platforms
 */
function cleanupSharp(platform) {
  const nodeModulesPath = getNodeModulesPath();
  const imgPath = path.join(nodeModulesPath, "@img");
  
  if (!directoryExists(imgPath)) {
    logger.warn("Sharp (@img) packages not found");
    return 0;
  }

  const platformConfig = PLATFORM_MAPPINGS[platform];
  const keepPackages = platformConfig.sharp;
  let savedSpace = 0;

  const imgPackages = fs.readdirSync(imgPath);
  
  for (const pkg of imgPackages) {
    const fullPkgName = `@img/${pkg}`;
    if (!keepPackages.includes(fullPkgName) && pkg.includes("sharp-")) {
      const pkgPath = path.join(imgPath, pkg);
      savedSpace += removeDirectory(pkgPath);
    }
  }

  return savedSpace;
}

/**
 * Clean up ONNX Runtime binaries for other platforms
 */
function cleanupONNXRuntime(platform) {
  const nodeModulesPath = getNodeModulesPath();
  const onnxPath = path.join(nodeModulesPath, "onnxruntime-node", "bin");
  
  if (!directoryExists(onnxPath)) {
    logger.warn("ONNX Runtime binaries not found");
    return 0;
  }

  const platformConfig = PLATFORM_MAPPINGS[platform];
  const keepPaths = platformConfig.onnx;
  let savedSpace = 0;

  // Look for napi-v* directories
  const napiDirs = fs.readdirSync(onnxPath).filter(dir => dir.startsWith('napi-v'));
  
  for (const napiDir of napiDirs) {
    const napiPath = path.join(onnxPath, napiDir);
    if (directoryExists(napiPath)) {
      const platforms = fs.readdirSync(napiPath);
      
      for (const platDir of platforms) {
        const platPath = path.join(napiPath, platDir);
        if (directoryExists(platPath)) {
          const shouldKeep = keepPaths.some(keepPath => 
            platPath.includes(keepPath.replace('/', path.sep))
          );
          
          if (!shouldKeep) {
            savedSpace += removeDirectory(platPath);
          }
        }
      }
    }
  }

  return savedSpace;
}

/**
 * Clean up transformers nested packages
 */
function cleanupTransformersNestedPackages(platform) {
  const nodeModulesPath = getNodeModulesPath();
  const transformersPath = path.join(nodeModulesPath, "@xenova", "transformers", "node_modules");
  
  if (!directoryExists(transformersPath)) {
    logger.warn("Nested transformers packages not found");
    return 0;
  }

  let savedSpace = 0;

  // Clean up nested sharp packages
  const nestedImgPath = path.join(transformersPath, "@img");
  if (directoryExists(nestedImgPath)) {
    const platformConfig = PLATFORM_MAPPINGS[platform];
    const keepPackages = platformConfig.sharp;
    
    const imgPackages = fs.readdirSync(nestedImgPath);
    for (const pkg of imgPackages) {
      const fullPkgName = `@img/${pkg}`;
      if (!keepPackages.includes(fullPkgName) && pkg.includes("sharp-")) {
        const pkgPath = path.join(nestedImgPath, pkg);
        savedSpace += removeDirectory(pkgPath);
      }
    }
  }

  // Clean up nested ONNX packages
  const nestedOnnxPath = path.join(transformersPath, "onnxruntime-node", "bin");
  if (directoryExists(nestedOnnxPath)) {
    const platformConfig = PLATFORM_MAPPINGS[platform];
    const keepPaths = platformConfig.onnx;
    
    const napiDirs = fs.readdirSync(nestedOnnxPath).filter(dir => dir.startsWith('napi-v'));
    
    for (const napiDir of napiDirs) {
      const napiPath = path.join(nestedOnnxPath, napiDir);
      if (directoryExists(napiPath)) {
        const platforms = fs.readdirSync(napiPath);
        
        for (const platDir of platforms) {
          const platPath = path.join(napiPath, platDir);
          if (directoryExists(platPath)) {
            const shouldKeep = keepPaths.some(keepPath => 
              platPath.includes(keepPath.replace('/', path.sep))
            );
            
            if (!shouldKeep) {
              savedSpace += removeDirectory(platPath);
            }
          }
        }
      }
    }
  }

  return savedSpace;
}

/**
 * Clean up other large development packages
 */
function cleanupDevPackages() {
  const nodeModulesPath = getNodeModulesPath();
  let savedSpace = 0;

  // Packages that are often large and not needed in production builds
  const devPackagesToRemove = [
    // Remove .cache directories
    path.join(nodeModulesPath, ".cache"),
    // Remove typescript compiler if present
    path.join(nodeModulesPath, "typescript"),
    // Remove @types packages
    path.join(nodeModulesPath, "@types"),
    // Remove npm package if it exists (sometimes included)
    path.join(nodeModulesPath, "npm"),
  ];

  for (const pkgPath of devPackagesToRemove) {
    if (directoryExists(pkgPath)) {
      savedSpace += removeDirectory(pkgPath);
    }
  }

  return savedSpace;
}

/**
 * Main cleanup function
 */
function cleanupNodeModules(platform) {
  logger.info(`Starting cleanup for platform: ${platform}`);
  
  if (!PLATFORM_MAPPINGS[platform]) {
    logger.error(`Unknown platform: ${platform}`);
    logger.info(`Available platforms: ${Object.keys(PLATFORM_MAPPINGS).join(", ")}`);
    process.exit(1);
  }

  const nodeModulesPath = getNodeModulesPath();
  if (!directoryExists(nodeModulesPath)) {
    logger.error("node_modules directory not found");
    process.exit(1);
  }

  // Get initial size
  const initialSize = getDirectorySize(nodeModulesPath);
  logger.info(`Initial node_modules size: ${initialSize}MB`);

  let totalSaved = 0;

  // Clean up LanceDB packages
  logger.info("Cleaning up LanceDB packages...");
  totalSaved += cleanupLanceDB(platform);

  // Clean up Sharp packages
  logger.info("Cleaning up Sharp packages...");
  totalSaved += cleanupSharp(platform);

  // Clean up ONNX Runtime packages
  logger.info("Cleaning up ONNX Runtime packages...");
  totalSaved += cleanupONNXRuntime(platform);

  // Clean up nested packages in transformers
  logger.info("Cleaning up nested packages in transformers...");
  totalSaved += cleanupTransformersNestedPackages(platform);

  // Clean up development packages
  logger.info("Cleaning up development packages...");
  totalSaved += cleanupDevPackages();

  // Get final size
  const finalSize = getDirectorySize(nodeModulesPath);
  const actualSaved = initialSize - finalSize;

  logger.success(`Cleanup completed for ${platform}`);
  logger.success(`Initial size: ${initialSize}MB`);
  logger.success(`Final size: ${finalSize}MB`);
  logger.success(`Total saved: ${actualSaved}MB (${((actualSaved / initialSize) * 100).toFixed(1)}% reduction)`);
}

/**
 * Main execution
 */
function main() {
  const platform = process.argv[2];
  
  if (!platform) {
    logger.error("No platform specified");
    logger.info("Usage: node scripts/cleanup-node-modules.js <platform>");
    logger.info(`Available platforms: ${Object.keys(PLATFORM_MAPPINGS).join(", ")}`);
    process.exit(1);
  }

  cleanupNodeModules(platform);
}

if (require.main === module) {
  main();
}

module.exports = { cleanupNodeModules };
