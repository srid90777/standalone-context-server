#!/usr/bin/env node

/**
 * Build Scripts for PKG - Platform-specific builds
 * This script uses config.json for centralized build configuration
 * Based on yao-pkg/pkg: https://github.com/yao-pkg/pkg
 */

const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");

// Load configuration from config.json
const CONFIG_PATH = path.resolve(__dirname, "../config.json");
let config;

try {
  config = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8"));
} catch (error) {
  console.error("[ERROR] Failed to load config.json:", error.message);
  process.exit(1);
}

// Logger utility for consistent output
const logger = {
  info: (message) => console.log(`[INFO] ${message}`),
  success: (message) => console.log(`[SUCCESS] ${message}`),
  error: (message) => console.error(`[ERROR] ${message}`),
  command: (command) => console.log(`[COMMAND] ${command}`),
};

/**
 * Ensures the output directory exists
 */
function ensureOutputDirectory() {
  if (!fs.existsSync(config.outputPath)) {
    logger.info(`Creating ${config.outputPath} directory`);
    fs.mkdirSync(config.outputPath, { recursive: true });
  }
}

/**
 * Executes the transformers patch script
 */
function patchTransformers() {
  logger.info("Patching transformers");
  execSync("node scripts/patch-transformers.js", { stdio: "inherit" });
}

/**
 * Cleans up node_modules for specific platform to reduce build size
 * @param {string} platform - Target platform
 */
function cleanupNodeModules(platform) {
  logger.info(`Cleaning up node_modules for ${platform}`);
  execSync(`node scripts/cleanup-node-modules.js ${platform}`, { stdio: "inherit" });
}

/**
 * Gets all assets for a platform (common + platform-specific)
 * @param {string} platform - The target platform
 * @returns {string[]} Array of asset paths
 */
function getAssetsForPlatform(platform) {
  const platformConfig = config.platforms[platform];
  if (!platformConfig) {
    throw new Error(`Unknown platform: ${platform}`);
  }
  return [...config.commonAssets, ...platformConfig.assets];
}

/**
 * Creates a temporary pkg config file for a specific platform
 * @param {string} platform - Target platform
 * @returns {string} Path to temporary config file
 */
function createTempConfig(platform) {
  const platformConfig = config.platforms[platform];
  const assets = getAssetsForPlatform(platform);

  const tempConfig = {
    main: config.main,
    targets: [platformConfig.target],
    assets: assets,
    outputPath: config.outputPath,
    options: config.options || [],
    output: path.join(config.outputPath, platformConfig.outputName),
  };

  const tempConfigPath = path.resolve(
    __dirname,
    `../temp-config-${platform}.json`,
  );
  fs.writeFileSync(tempConfigPath, JSON.stringify(tempConfig, null, 2));

  return tempConfigPath;
}

/**
 * Builds the PKG command string using config file approach
 * @param {string} tempConfigPath - Path to temporary config file
 * @param {boolean} debug - Whether to enable debug mode
 * @returns {string} The complete PKG command
 */
function buildPkgCommand(tempConfigPath, debug = false) {
  const baseCommand = ["pkg", "--config", tempConfigPath, "src/index.js"];

  if (debug) {
    baseCommand.push("--debug");
  }

  return baseCommand.join(" ");
}

/**
 * Validates if a platform is supported
 * @param {string} platform - Platform to validate
 * @returns {boolean} True if platform is supported
 */
function isValidPlatform(platform) {
  return Object.prototype.hasOwnProperty.call(config.platforms, platform);
}

/**
 * Gets list of available platforms
 * @returns {string[]} Array of platform names
 */
function getAvailablePlatforms() {
  return Object.keys(config.platforms);
}

/**
 * Builds executable for a specific platform
 * @param {string} platform - Target platform (linux, windows, macos)
 * @param {boolean} debug - Whether to enable debug mode
 */
function buildForPlatform(platform, debug = false) {
  logger.info(`Starting build for ${platform}${debug ? " (debug mode)" : ""}`);

  const platformConfig = config.platforms[platform];
  if (!platformConfig) {
    throw new Error(`Unknown platform: ${platform}`);
  }

  ensureOutputDirectory();
  
  // Download native modules for the target platform
  logger.info(`Downloading native modules for ${platform}...`);
  execSync(`node scripts/download-natives.js --platform=${platform} --clean`, { stdio: "inherit" });
  
  patchTransformers();
  cleanupNodeModules(platform);

  // Create temporary config file for this platform
  const tempConfigPath = createTempConfig(platform);

  try {
    const pkgCommand = buildPkgCommand(tempConfigPath, debug);
    logger.command(pkgCommand);
    execSync(pkgCommand, { stdio: "inherit" });

    logger.success(
      `Built ${platform} executable: ${platformConfig.outputName}`,
    );
  } finally {
    // Clean up temporary config file
    if (fs.existsSync(tempConfigPath)) {
      fs.unlinkSync(tempConfigPath);
    }
  }
}

/**
 * Builds executables for all supported platforms
 * @param {boolean} debug - Whether to enable debug mode
 */
function buildAll(debug = false) {
  logger.info("Cleaning previous builds");
  execSync(`rm -rf ${config.outputPath} && mkdir -p ${config.outputPath}`, {
    stdio: "inherit",
  });

  logger.info("Creating backup of node_modules for multi-platform builds");
  execSync("node scripts/backup-node-modules.js create", { stdio: "inherit" });

  const platforms = getAvailablePlatforms();
  for (let i = 0; i < platforms.length; i++) {
    const platform = platforms[i];
    try {
      // Restore backup before each build (except the first one)
      if (i > 0) {
        logger.info(`Restoring node_modules for ${platform} build`);
        execSync("node scripts/backup-node-modules.js restore", { stdio: "inherit" });
      }
      
      buildForPlatform(platform, debug);
    } catch (error) {
      logger.error(`Failed to build ${platform}: ${error.message}`);
      // Clean up backup on failure
      execSync("node scripts/backup-node-modules.js cleanup", { stdio: "inherit" });
      throw error;
    }
  }

  // Clean up backup after successful builds
  logger.info("Cleaning up node_modules backup");
  execSync("node scripts/backup-node-modules.js cleanup", { stdio: "inherit" });

  logger.success("All platforms built successfully");
}

/**
 * Displays usage information
 */
function showUsage() {
  const platforms = getAvailablePlatforms().join(", ");
  logger.info("Usage: node scripts/build-scripts.js <platform|all>");
  logger.info(`Available platforms: ${platforms}, all`);
}

/**
 * Main execution logic
 */
function main() {
  const args = process.argv.slice(2);
  const platform = args[0];
  const debugFlag = args.includes("--debug") || args.includes("-d");

  if (!platform) {
    logger.error("No platform specified");
    showUsage();
    process.exit(1);
  }

  try {
    if (platform === "all") {
      buildAll(debugFlag);
    } else if (isValidPlatform(platform)) {
      buildForPlatform(platform, debugFlag);
    } else {
      logger.error(`Unknown platform: ${platform}`);
      showUsage();
      process.exit(1);
    }
  } catch (error) {
    logger.error(`Build failed: ${error.message}`);
    process.exit(1);
  }
}

main();
