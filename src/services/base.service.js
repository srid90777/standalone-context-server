/**
 * Base service class with common functionality
 */
const path = require("path");

class BaseService {
  /**
   * Resolve an absolute path from a given directory
   * @param {string} directory - Directory path to resolve
   * @returns {string} Resolved absolute path
   */
  static resolvePath(directory) {
    return path.resolve(directory);
  }

  /**
   * Initialize the local context provider with the given configuration
   * @param {Object} localContextProvider - Local context provider instance
   * @param {Object} RetrievalUtils - Retrieval utils instance
   * @param {string} workspaceDirectory - Workspace directory path
   * @param {boolean} multiThread - Whether to use multi-threading
   * @param {Object} additionalConfig - Additional configuration options
   * @returns {Promise<Object>} Provider or indexer instance
   */
  static async initializeProvider(
    localContextProvider,
    RetrievalUtils,
    workspaceDirectory,
    multiThread,
    additionalConfig = {},
  ) {
    const config = RetrievalUtils.createProviderConfig(
      workspaceDirectory,
      multiThread,
      additionalConfig,
    );

    return await BaseService.handleAsync(async () => {
      await localContextProvider.init(config);
      return localContextProvider.getCodebaseIndexer
        ? localContextProvider.getCodebaseIndexer()
        : localContextProvider;
    }, "provider initialization");
  }

  /**
   * Get operation method from indexer
   * @param {Object} indexer - Indexer instance
   * @param {string} operation - Operation type
   * @returns {Function} Operation method
   */
  static getOperationMethod(indexer, operation) {
    const { OPERATION_TYPES } = require("../constants/common.js");
    return operation === OPERATION_TYPES.INDEX
      ? indexer.index
      : indexer.refresh;
  }

  /**
   * Get operation messages for indexing operations
   * @param {string} operation - Operation type
   * @returns {Object} Success and error messages
   */
  static getOperationMessages(operation) {
    const { MESSAGES, OPERATION_TYPES } = require("../constants/common.js");

    if (operation === OPERATION_TYPES.INDEX) {
      return {
        success: MESSAGES.SUCCESSFULLY_INDEXED,
        error: MESSAGES.ERROR_INDEXING,
        completed: MESSAGES.INDEXING_COMPLETED,
      };
    }

    return {
      success: MESSAGES.SUCCESSFULLY_REFRESHED,
      error: MESSAGES.ERROR_REFRESHING,
      completed: MESSAGES.REFRESH_COMPLETED,
    };
  }

  /**
   * Create operation result summary
   * @param {Array} processedFiles - Successfully processed files
   * @param {Array} errors - Files that failed processing
   * @param {string} operation - Operation type
   * @param {string} folderName - Folder name
   * @param {string} branchName - Branch name
   * @param {string} workspaceDir - Workspace directory
   * @returns {Object} Operation result summary
   */
  static createOperationResult(
    processedFiles,
    errors,
    operation,
    folderName,
    branchName,
    workspaceDir,
  ) {
    const { MESSAGES } = require("../constants/common.js");
    const totalFiles = processedFiles.length + errors.length;
    const successCount = processedFiles.length;
    const errorCount = errors.length;
    const messages = BaseService.getOperationMessages(operation);

    const summary = {
      total: totalFiles,
      successful: successCount,
      failed: errorCount,
    };

    const result = {
      summary,
      processedFiles,
      folderName,
      branchName,
      workspaceDir: BaseService.resolvePath(workspaceDir),
    };

    if (errorCount > 0) {
      result.errors = errors;
    }

    return result;
  }

  /**
   * Merge default configuration with provided options
   * @param {Object} defaults - Default configuration
   * @param {Object} options - User-provided options
   * @returns {Object} Merged configuration
   */
  static mergeConfig(defaults, options = {}) {
    return { ...defaults, ...options };
  }

  /**
   * Create standard error response
   * @param {string} message - Error message
   * @param {string} code - Error code
   * @param {Object} details - Additional error details
   * @returns {Object} Error response object
   */
  static createErrorResponse(message, code = "UNKNOWN_ERROR", details = {}) {
    return {
      success: false,
      error: {
        message,
        code,
        details,
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * Create standard success response
   * @param {*} data - Response data
   * @param {string} message - Success message (unused but kept for backward compatibility)
   * @returns {*} Response data without wrapping
   */
  static createSuccessResponse(
    data,
    message = "Operation completed successfully",
  ) {
    return data;
  }

  /**
   * Handle async operations with error wrapping
   * @param {Function} operation - Async operation to execute
   * @param {string} context - Context for error messages
   * @returns {Promise} Result of the operation or wrapped error
   */
  static async handleAsync(operation, context = "operation") {
    try {
      return await operation();
    } catch (error) {
      throw new Error(`Failed to execute ${context}: ${error.message}`);
    }
  }

  /**
   * Check if a value is a valid non-empty string
   * @param {*} value - Value to check
   * @returns {boolean} True if valid string
   */
  static isValidString(value) {
    return typeof value === "string" && value.trim().length > 0;
  }

  /**
   * Check if a value is a valid array with items
   * @param {*} value - Value to check
   * @returns {boolean} True if valid non-empty array
   */
  static isValidArray(value) {
    return Array.isArray(value) && value.length > 0;
  }

  /**
   * Sanitize input by removing potentially harmful characters
   * @param {string} input - Input string to sanitize
   * @returns {string} Sanitized input
   */
  static sanitizeInput(input) {
    if (!this.isValidString(input)) {
      return "";
    }

    // Remove potential script tags and other harmful content
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      .replace(/[<>'"]/g, "")
      .trim();
  }
}

module.exports = BaseService;
