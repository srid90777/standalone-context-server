const { init, retrieve, CodebaseIndexer } = require("@cs/context-provider");
const path = require("path");
const os = require("os");
const fs = require("fs");
const {
  CACHE_DIR_NAME,
  MODELS_DIR_NAME,
  EMBEDDING_NAME,
  INDEX_SKIP_DAYS,
} = require("../constants/common.js");

/**
 * LocalContextProvider class that initializes the context provider
 */
class LocalContextProvider {
  constructor() {}

  /**
   * Initializes the local context provider with the given configuration.
   * @param {*} config - The configuration object.
   */
  async init(config) {
    const cacheDir = path.join(os.homedir(), CACHE_DIR_NAME, MODELS_DIR_NAME);

    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }

    try {
      const transformers = require("../../transformers-pkg-compat.js");
      if (transformers && transformers.env) {
        transformers.env.cacheDir = cacheDir;
      }
    } catch (error) {
      console.warn(
        `Could not configure ${EMBEDDING_NAME} environment:`,
        error.message,
      );
    }

    const csCfg = {
      ...config,
      multiThread: false,
      workspaceDir: config.workspaceDirectory || config.workspaceDir,
      cacheDir: cacheDir,
    };

    if (csCfg.workspaceDirectory) {
      delete csCfg.workspaceDirectory;
    }

    await init(csCfg);
  }

  /**
   * Checks if the specified folder and branch are indexed.
   * @param {*} folder - The folder to check.
   * @param {*} branch - The branch to check.
   * @returns {Promise<boolean>}
   */
  async isIndexed(folder, branch) {
    const result = await new CodebaseIndexer().isIndexed(folder, branch);
    return typeof result === "boolean" ? result : !!result;
  }

  /**
   * Gets the codebase indexer.
   * @returns {CodebaseIndexer}
   */
  getCodebaseIndexer() {
    return new CodebaseIndexer();
  }

  /**
   * Clears old indexed data.
   * @param {number} days
   */
  clearOldIndexedData(days) {
    new CodebaseIndexer().houseKeeping(days ? days : INDEX_SKIP_DAYS);
  }

  /**
   * Retrieves context based on the provided options.
   * @param {*} options
   * @returns {Promise<any>}
   */
  retrieve(options) {
    return retrieve(options);
  }

  /**
   * Always true (legacy compatibility).
   * @returns {boolean}
   */
  isInitialized() {
    return true;
  }
}

const localContextProvider = new LocalContextProvider();

module.exports = { localContextProvider, LocalContextProvider };
