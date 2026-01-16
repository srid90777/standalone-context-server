/**
 * Service for handling context retrieval operations
 */
const {
  localContextProvider,
} = require("../providers/local-context.provider.js");
const { DEFAULT_MULTI_THREAD } = require("../constants/common.js");
const { NotFoundError } = require("../utils/errors.js");
const RetrievalUtils = require("../utils/retrieval-utils.js");
const BaseService = require("./base.service.js");
const { AI_HUB_API_URL } = require("../constants/common.js");
const https = require("https");
const { URL } = require("url");
const { platform } = require("process");

const EXTERNAL_API_TIMEOUT_MS = 15_000;
const PLATFORM = platform;

class RetrieveService extends BaseService {
  /**
   * Initialize the local context provider with the given configuration
   * @param {string} workspaceDirectory - Workspace directory path
   * @param {boolean} multiThread - Whether to use multi-threading
   * @param {Object} additionalConfig - Additional configuration options
   */
  async initializeProvider(
    workspaceDirectory,
    multiThread = DEFAULT_MULTI_THREAD,
    additionalConfig = {},
  ) {
    return await BaseService.initializeProvider(
      localContextProvider,
      RetrievalUtils,
      workspaceDirectory,
      multiThread,
      additionalConfig,
    );
  }

  /**
   * Validate that the folder/branch is indexed
   * @param {string} folderName - Folder name
   * @param {string} branchName - Branch name
   * @throws {NotFoundError} If folder/branch is not indexed
   */
  async _validateIndexed(folderName, branchName) {
    const isIndexed = await localContextProvider.isIndexed(
      folderName,
      branchName,
    );
    if (!isIndexed) {
      throw new NotFoundError(
        `Requested folder/branch is not indexed: ${folderName}/${branchName}`,
      );
    }
  }

  /**
   * Execute retrieval operation and process results as a stream
   * @param {Object} retrievalParams - Parameters for retrieval
   * @param {Function} onProgress - Progress callback function
   * @param {Function} filterFn - Optional filter function for results
   * @returns {AsyncGenerator} Stream of retrieval results
   */
  async* _executeRetrieval(retrievalParams, onProgress, filterFn) {
    const resultGenerator = localContextProvider.retrieve(retrievalParams);

    for await (const result of RetrievalUtils.processRetrievalResults(
      resultGenerator,
      onProgress,
      filterFn
    )) {
      yield result;
    }
  }

  /**
   * Retrieve context based on query as a stream
   * @param {Object} params - Retrieve parameters (already validated by middleware)
   * @param {Function} onProgress - Progress callback function
   * @param {Function} filterFn - Optional filter function for results
   * @returns {AsyncGenerator} Stream of retrieved context data
   */
  async* retrieveContext(params, onProgress, filterFn) {
    const { workspaceDir, folderName, branchName, authorization } = params;

    const resolvedWorkspaceDir = BaseService.resolvePath(workspaceDir);

    await this.initializeProvider(resolvedWorkspaceDir);

    await this._validateIndexed(folderName, branchName);

    const retrievalParams = RetrievalUtils.buildRetrievalParams(
      { ...params },
      (input) => this.invoke(input, authorization),
    );

    for await (const result of this._executeRetrieval(
      retrievalParams,
      onProgress,
      filterFn,
    )) {
      yield result;
    }
  }

  /**
   * Retrieve context with custom LLM configuration as a stream
   * @param {Object} params - Retrieve parameters
   * @param {Function} customInvokeFn - Custom invoke function for LLM
   * @param {Function} onProgress - Progress callback function
   * @param {Function} filterFn - Optional filter function for results
   * @returns {AsyncGenerator} Stream of retrieved context data
   */
  async* retrieveContextWithCustomLLM(params, customInvokeFn, onProgress, filterFn) {
    const enhancedParams = { ...params, customInvokeFn };
    for await (const result of this.retrieveContext(enhancedParams, onProgress, filterFn)) {
      yield result;
    }
  }

  /**
   * Check if a folder/branch combination is indexed
   * @param {string} folderName - Folder name
   * @param {string} branchName - Branch name
   * @returns {boolean} True if indexed
   */
  async isIndexed(folderName, branchName) {
    return await BaseService.handleAsync(
      () => localContextProvider.isIndexed(folderName, branchName),
      "index validation",
    );
  }

  /**
   * Sends a request to retrieve context data based on the provided input.
   * @param {any} input - The input data to be sent in the POST request.
   * @param {string} authorization - The authorization header.
   * @returns {Promise<any>} A promise that resolves to the retrieved content if successful, or undefined if an error occurs.
   */
  async invoke(input, authorization) {
    const url = new URL(AI_HUB_API_URL);
    // Prefer non-streaming responses so we can reliably parse JSON and complete.
    // If the upstream ignores this, we still enforce a hard timeout below.
    const postData = JSON.stringify({ input, history: [], stream: false });

    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "Content-Length": Buffer.byteLength(postData),
        Authorization: authorization,
      },
    };

    console.info(
      `RetrieveService: invoking external API (${AI_HUB_API_URL}) on ${PLATFORM}`,
    );

    console.log("External API Request Payload:", JSON.stringify({ input, history: [], stream: false }, null, 2));

    try {
      const content = await this._invokeExternalApi(options, postData);
      if (content == null) {
        throw new Error("External API returned empty content");
      }

      return content;
    } catch (error) {
      console.error("RetrieveService: external API invocation failed", {
        message: error.message,
        statusCode: error.statusCode,
        response: error.responseData,
        platform: PLATFORM,
      });
      throw error;
    }
  }

  _invokeExternalApi(options, postData) {
    return new Promise((resolve, reject) => {
      let settled = false;
      let hardTimeout;
      let req;
      const settle = (err, value) => {
        if (settled) return;
        settled = true;
        if (hardTimeout) clearTimeout(hardTimeout);
        if (err) return reject(err);
        resolve(value);
      };

      req = https.request(options, (res) => {
        let data = "";
        let ended = false;

        res.setEncoding("utf8");

        const contentType = String(res.headers?.["content-type"] || "");
        if (contentType.includes("text/event-stream")) {
          const error = new Error(
            "External API returned a streaming (text/event-stream) response; configure a non-streaming endpoint or ensure stream=false is supported",
          );
          error.statusCode = res.statusCode;
          error.responseHeaders = res.headers;
          // Avoid waiting forever on an event stream.
          res.resume();
          req.destroy(error);
          return settle(error);
        }

        res.on("data", (chunk) => {
          data += chunk;
        });

        res.on("end", () => {
          ended = true;
          if (res.statusCode < 200 || res.statusCode >= 300) {
            const error = new Error(`External API request failed with status ${res.statusCode}`);
            error.statusCode = res.statusCode;
            error.responseData = data;
            return settle(error);
          }

          try {
            const responseData = data ? JSON.parse(data) : {};
            console.info("RetrieveService: external API response received", {
              platform: PLATFORM,
              responseSummary: responseData?.data?.["content"] ? `${responseData.data.content.substring(0, 100)}...` : "no content",
            });
            settle(null, responseData?.data?.["content"] ?? null);
          } catch (parseError) {
            const error = new Error(`Error parsing external API response: ${parseError.message}`);
            error.responseData = data;
            settle(error);
          }
        });
        res.on("error", (responseError) => {
          settle(responseError);
        });

        // Some failure modes (esp. mid-stream disconnects) emit 'close' without 'end'.
        res.on("aborted", () => {
          if (ended) return;
          const error = new Error("External API response was aborted");
          error.statusCode = res.statusCode;
          error.responseData = data;
          settle(error);
        });

        res.on("close", () => {
          if (ended) return;
          const error = new Error("External API connection closed before completing response");
          error.statusCode = res.statusCode;
          error.responseData = data;
          settle(error);
        });
      });

      hardTimeout = setTimeout(() => {
        const timeoutError = new Error(
          `External API request timed out after ${EXTERNAL_API_TIMEOUT_MS}ms`,
        );
        timeoutError.code = "ETIMEDOUT_EXTERNAL_API";
        // Destroying the request ensures we don't hang on DNS/connect/TLS stalls.
        req.destroy(timeoutError);
        settle(timeoutError);
      }, EXTERNAL_API_TIMEOUT_MS);

      // Keep the socket from idling forever once connected.
      req.setTimeout(EXTERNAL_API_TIMEOUT_MS, () => {
        const timeoutError = new Error(
          `External API socket timed out after ${EXTERNAL_API_TIMEOUT_MS}ms`,
        );
        timeoutError.code = "ETIMEDOUT_EXTERNAL_API_SOCKET";
        req.destroy(timeoutError);
        settle(timeoutError);
      });

      req.on("error", (error) => {
        settle(error);
      });

      req.write(postData);
      req.end();
    });
  }
}

module.exports = new RetrieveService();
