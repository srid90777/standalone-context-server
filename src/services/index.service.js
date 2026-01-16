/**
 * Service for handling indexing operations
 */
const {
  localContextProvider,
} = require("../providers/local-context.provider.js");
const BaseController = require("../controllers/base.controller.js");
const {
  MESSAGES,
  DEFAULT_MULTI_THREAD,
  ERROR_CODES,
  OPERATION_TYPES,
} = require("../constants/common.js");
const BaseService = require("./base.service.js");
const RetrievalUtils = require("../utils/retrieval-utils.js");

class IndexService extends BaseService {
  /**
   * Initialize the local context provider with the given configuration
   * @param {string} workspaceDirectory - Workspace directory path
   * @param {Object} additionalConfig - Additional configuration options
   * @returns {Object} Indexer instance
   */
  async initializeProvider(workspaceDirectory, additionalConfig = {}) {
    return await BaseService.initializeProvider(
      localContextProvider,
      RetrievalUtils,
      workspaceDirectory,
      DEFAULT_MULTI_THREAD,
      additionalConfig,
    );
  }

  /**
   * Resolve and validate file paths
   * @param {string} workspaceDir - Workspace directory
   * @param {Array<string>} filesToIndex - Array of file paths to resolve
   * @returns {Array<string>} Array of resolved absolute file paths
   */
  _resolveFilePaths(workspaceDir, filesToIndex) {
    const resolvedWorkspaceDir = BaseService.resolvePath(workspaceDir);

    return filesToIndex.map((filePath) => {
      const { abs: absFile } = BaseController.resolveAndValidatePath(
        resolvedWorkspaceDir,
        filePath,
      );
      return absFile;
    });
  }

  /**
   * Get operation method from indexer
   * @param {Object} indexer - Indexer instance
   * @param {string} operation - Operation type
   * @returns {Function} Operation method
   */
  _getOperationMethod(indexer, operation) {
    return BaseService.getOperationMethod(indexer, operation);
  }

  /**
   * Get operation messages
   * @param {string} operation - Operation type
   * @returns {Object} Success and error messages
   */
  _getOperationMessages(operation) {
    return BaseService.getOperationMessages(operation);
  }

  /**
   * Process a single file with the given indexer operation
   * @param {string} filePath - File path to process
   * @param {Object} indexer - Indexer instance
   * @param {string} folderName - Folder name
   * @param {string} branchName - Branch name
   * @param {string} operation - Operation type (OPERATION_TYPES.INDEX or OPERATION_TYPES.REFRESH)
   * @returns {Object} Processing result
   */
  async _processSingleFile(
    filePath,
    indexer,
    folderName,
    branchName,
    operation,
  ) {
    try {
      const operationMethod = this._getOperationMethod(indexer, operation);
      const messages = this._getOperationMessages(operation);

      for await (const _ of operationMethod.call(
        indexer,
        folderName,
        [filePath],
        branchName,
      )) {
        // The iterator provides internal progress updates
      }

      return BaseService.createSuccessResponse({
        file: filePath,
      });
    } catch (fileError) {
      const messages = this._getOperationMessages(operation);

      return BaseService.createErrorResponse(
        `${messages.error} ${require("path").basename(filePath)}: ${fileError.message}`,
        ERROR_CODES.FILE_PROCESSING_ERROR,
        { file: filePath, operation },
      );
    }
  }

  /**
   * Process multiple files with the given operation
   * @param {Array<string>} resolvedFiles - Array of resolved file paths
   * @param {Object} indexer - Indexer instance
   * @param {string} folderName - Folder name
   * @param {string} branchName - Branch name
   * @param {string} operation - Operation type (OPERATION_TYPES.INDEX or OPERATION_TYPES.REFRESH)
   * @returns {Object} Processing results with success and error arrays
   */
  async _processFiles(
    resolvedFiles,
    indexer,
    folderName,
    branchName,
    operation,
  ) {
    try {
      const operationMethod = this._getOperationMethod(indexer, operation);

      for await (const _ of operationMethod.call(
        indexer,
        folderName,
        resolvedFiles,
        branchName,
      )) {
        // The iterator provides internal progress updates
      }

      return {
        processedFiles: resolvedFiles.map((file) => ({
          file,
        })),
        errors: [],
      };
    } catch (error) {
      const messages = this._getOperationMessages(operation);

      // If the batch operation fails, we'll mark all files as failed with the same error
      const errors = resolvedFiles.map((filePath) =>
        BaseService.createErrorResponse(
          `${messages.error} ${require("path").basename(filePath)}: ${
            error.message
          }`,
          ERROR_CODES.FILE_PROCESSING_ERROR,
          { file: filePath, operation },
        ),
      );

      return { processedFiles: [], errors };
    }
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
  _createOperationResult(
    processedFiles,
    errors,
    operation,
    folderName,
    branchName,
    workspaceDir,
  ) {
    return BaseService.createOperationResult(
      processedFiles,
      errors,
      operation,
      folderName,
      branchName,
      workspaceDir,
    );
  }

  /**
   * Execute file operation (index or refresh)
   * @param {Object} params - Operation parameters
   * @param {string} operation - Operation type
   * @returns {Object} Operation result
   */
  async _executeFileOperation(params, operation) {
    const { workspaceDir, filesToIndex, folderName, branchName } = params;

    // Validate file array
    if (!BaseService.isValidArray(filesToIndex)) {
      throw new Error("filesToIndex must be a non-empty array");
    }

    const resolvedWorkspaceDir = BaseService.resolvePath(workspaceDir);
    const resolvedFiles = this._resolveFilePaths(workspaceDir, filesToIndex);
    const indexer = await this.initializeProvider(resolvedWorkspaceDir);

    const { processedFiles, errors } = await this._processFiles(
      resolvedFiles,
      indexer,
      folderName,
      branchName,
      operation,
    );

    return this._createOperationResult(
      processedFiles,
      errors,
      operation,
      folderName,
      branchName,
      workspaceDir,
    );
  }

  /**
   * Index files for a specific folder and branch
   * @param {Object} params - Index parameters (already validated by middleware)
   * @returns {Object} Index operation result
   */
  async indexFiles(params) {
    return await BaseService.handleAsync(
      () => this._executeFileOperation(params, OPERATION_TYPES.INDEX),
      "file indexing",
    );
  }

  /**
   * Refresh index for specific files
   * @param {Object} params - Refresh parameters (already validated by middleware)
   * @returns {Object} Refresh operation result
   */
  async refreshIndex(params) {
    return await BaseService.handleAsync(
      () => this._executeFileOperation(params, OPERATION_TYPES.REFRESH),
      "index refresh",
    );
  }

  /**
   * Get index status information
   * @param {string} workspaceDir - Workspace directory
   * @param {string} folderName - Folder name
   * @param {string} branchName - Branch name
   * @returns {Object} Index status information
   */
  async _getIndexStatusInfo(workspaceDir, folderName, branchName) {
    const resolvedWorkspaceDir = BaseService.resolvePath(workspaceDir);
    const indexer = await this.initializeProvider(resolvedWorkspaceDir);

    const [isIndexed, indexInfo] = await Promise.all([
      localContextProvider.isIndexed(folderName, branchName),
      indexer.isIndexed(folderName, branchName),
    ]);

    return {
      isIndexed,
      indexInfo,
      workspaceDir: resolvedWorkspaceDir,
    };
  }

  /**
   * Check if a folder and branch are indexed
   * @param {Object} params - Status check parameters (already validated by middleware)
   * @returns {Object} Index status result
   */
  async checkIndexStatus(params) {
    const { workspaceDir, folderName, branchName } = params;

    return await BaseService.handleAsync(async () => {
      const statusInfo = await this._getIndexStatusInfo(
        workspaceDir,
        folderName,
        branchName,
      );

      return {
        ...statusInfo,
        folderName,
        branchName,
      };
    }, "index status check");
  }

  /**
   * Get detailed index status information
   * @param {Object} params - Status parameters (already validated by middleware)
   * @returns {Object} Detailed index status result
   */
  async getDetailedIndexStatus(params) {
    const { workspaceDir, folderName, branchName } = params;

    return await BaseService.handleAsync(async () => {
      const statusInfo = await this._getIndexStatusInfo(
        workspaceDir,
        folderName,
        branchName,
      );

      return BaseService.createSuccessResponse(
        {
          ...statusInfo,
          folderName,
          branchName,
          timestamp: new Date().toISOString(),
        },
        "Index status retrieved successfully",
      );
    }, "detailed index status check");
  }

  /**
   * Clear old indexed data
   * @param {Object} params - Clear parameters (already validated by middleware)
   * @returns {Object} Clear operation result
   */
  async clearOldIndexedData(params) {
    const { days } = params;

    // Validate days parameter
    if (typeof days !== "number" || days < 0) {
      throw new Error("days must be a non-negative number");
    }

    return await BaseService.handleAsync(async () => {
      await localContextProvider.clearOldIndexedData(days);

      return BaseService.createSuccessResponse(
        { daysCleared: days },
        `${MESSAGES.SUCCESSFULLY_CLEARED_DATA} ${days} day(s)`,
      );
    }, "old data clearing");
  }
}

module.exports = new IndexService();
