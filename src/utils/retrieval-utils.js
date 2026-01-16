/**
 * Utility functions for retrieval operations
 */
const {
  EMBEDDING_NAME,
  ARTIFACT_ID,
  DELEGATE_LLM,
  STATUS_COMPLETE,
} = require("../constants/common.js");

class RetrievalUtils {
  /**
   * Create standardized LLM configuration
   * @param {Function} customInvokeFn - Custom invoke function (optional)
   * @returns {Object} LLM configuration
   */
  static createLLMConfig(customInvokeFn) {
    const defaultInvokeFn = async (input) => {
      return JSON.stringify(input.code_chunks.map((chunk) => chunk.id));
    };

    return {
      name: DELEGATE_LLM,
      options: {
        invokeFn: customInvokeFn || defaultInvokeFn,
      },
    };
  }

  /**
   * Create standardized tags for retrieval
   * @param {string} folderName - Folder name
   * @param {string} branchName - Branch name
   * @param {string} artifactId - Artifact ID (optional)
   * @returns {Array} Tags array
   */
  static createTags(folderName, branchName, artifactId = ARTIFACT_ID) {
    return [{ dir: folderName, branch: branchName, artifactId }];
  }

  /**
   * Build standardized retrieval parameters
   * @param {Object} config - Configuration object
   * @param {string} config.query - Search query
   * @param {string} config.folderName - Folder name
   * @param {string} config.branchName - Branch name
   * @param {Array} config.recentlyEditedFiles - Recently edited files
   * @param {string} config.embeddingName - Embedding name (optional)
   * @param {Function} config.customInvokeFn - Custom invoke function (optional)
   * @returns {Object} Retrieval parameters
   */
  static buildRetrievalParams(
    {
      query,
      folderName,
      branchName,
      recentlyEditedFiles,
      embeddingName = EMBEDDING_NAME,
    },
    customInvokeFn,
  ) {
    return {
      input: query,
      embeddingName,
      llm: this.createLLMConfig(customInvokeFn),
      tags: this.createTags(folderName, branchName),
      recentlyEditedFiles,
    };
  }

  /**
   * Process retrieval results from async generator as a stream
   * @param {AsyncGenerator} resultGenerator - Async generator from provider
   * @param {Function} onProgress - Callback function for progress updates
   * @param {Function} filterFn - Optional filter function for results
   * @returns {AsyncGenerator} Stream of processed results
   */
  static async* processRetrievalResults(resultGenerator, onProgress, filterFn) {
    for await (const result of resultGenerator) {
      const isComplete = result.status === STATUS_COMPLETE;
      const hasIterableData = isComplete && result.data && Array.isArray(result.data);

      if (hasIterableData) {
        let dataToStream = result.data;

        if (filterFn && typeof filterFn === "function") {
          dataToStream = result.data.filter(filterFn);
        }

        for (const dataItem of dataToStream) {
          yield {
            ...result,
            data: dataItem,
            type: 'item'
          };
        }

        yield {
          ...result,
          data: null,
          type: 'complete',
          totalItems: dataToStream.length
        };
      } else {
        if (onProgress && typeof onProgress === "function") {
          onProgress(result);
        }

        if (isComplete) {
          yield result;
        }
      }
    }
  }

  /**
   * Validate required parameters for retrieval
   * @param {Object} params - Parameters to validate
   * @param {Array} requiredFields - Required field names
   * @throws {Error} If required fields are missing
   */
  static validateParams(
    params,
    requiredFields = ["query", "folderName", "branchName"],
  ) {
    const missing = requiredFields.filter((field) => !params[field]);

    if (missing.length > 0) {
      throw new Error(`Missing required parameters: ${missing.join(", ")}`);
    }
  }

  /**
   * Create provider initialization configuration
   * @param {string} workspaceDirectory - Workspace directory path
   * @param {boolean} multiThread - Multi-threading flag
   * @param {Object} additionalConfig - Additional configuration options
   * @returns {Object} Provider configuration
   */
  static createProviderConfig(
    workspaceDirectory,
    multiThread = true,
    additionalConfig = {},
  ) {
    return {
      workspaceDirectory,
      multiThread,
      ...additionalConfig,
    };
  }
}

module.exports = RetrievalUtils;
