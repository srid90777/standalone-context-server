/**
 * Provides a workaround for module resolution in pkg environments
 */

"use strict";

// Directly import the constants file content
const constants = {
  // Error codes
  ERR_REQUIRE_ESM: "ERR_REQUIRE_ESM",

  // Retrieval constants
  EMBEDDING_NAME: "transformers",
  ARTIFACT_ID: "vectordb:transformers",

  // Cache directory constants
  CACHE_DIR_NAME: ".codespell",
  MODELS_DIR_NAME: "models",

  // Blocked libraries for transformers compatibility
  BLOCKED_LIBRARIES: ["sharp", "canvas", "jimp", "image-"],

  // Default LLM configuration
  DELEGATE_LLM: "DelegatedLlm",

  // Index skip days constant
  INDEX_SKIP_DAYS: 3,

  // Server configuration
  DEFAULT_PORT: 3000,
  DEFAULT_HOST: "localhost",
  APPLICATION_VERSION: "1.0.0",
  APPLICATION_NAME: "context-provider",
  APPLICATION_DESCRIPTION: "Standalone Context Provider CLI",

  // API paths
  AI_HUB_API_URL:
    process.env.AI_HUB_API_URL ||
    "https://dev-aspire.test.codespell.ai/api/web/v2/ai/chat/completion/context-retrieve",
  API_BASE_PATH: "/api/v1/ai",
  API_ENDPOINTS: {
    INDEX: "/index",
    INDEX_STATUS: "/index/status",
    RETRIEVE: "/retrieve",
  },

  // HTTP methods
  HTTP_METHODS: {
    GET: "GET",
    POST: "POST",
    PUT: "PUT",
    DELETE: "DELETE",
  },

  // HTTP status codes
  HTTP_STATUS_CODES: {
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    INTERNAL_SERVER_ERROR: 500,
    OK: 200,
  },

  // CORS configuration
  CORS_ORIGINS: ["*"],
  CORS_HEADERS: ["Accept", "Content-Type", "Authorization"],
  CORS_ADDITIONAL_HEADERS: ["X-Requested-With"],

  // Provider configuration
  DEFAULT_MULTI_THREAD: false,

  // Status values
  STATUS_COMPLETE: "complete",

  // Default validation values
  DEFAULT_CLEAR_DAYS: 3,
  MIN_CLEAR_DAYS: 0,

  // Operation types
  OPERATION_TYPES: {
    INDEX: "index",
    REFRESH: "refresh",
  },

  // Error codes
  ERROR_CODES: {
    FILE_PROCESSING_ERROR: "FILE_PROCESSING_ERROR",
    PROVIDER_INITIALIZATION_ERROR: "PROVIDER_INITIALIZATION_ERROR",
    INDEX_VALIDATION_ERROR: "INDEX_VALIDATION_ERROR",
  },

  // Console messages
  MESSAGES: {
    SERVER_STARTING: "Starting Context Provider Server on",
    SERVER_RUNNING: "Server running at http://",
    SERVER_STOP_INSTRUCTION: "Press Ctrl+C to stop the server.",
    SERVER_SHUTTING_DOWN: "Shutting down server...",
    SERVER_START_FAILED: "Failed to start server:",

    // Validation messages
    VALIDATION_FAILED: "Validation failed",
    REQUIRED_FIELDS_MISSING: "Required fields are missing or invalid",
    QUERY_VALIDATION_FAILED: "Query validation failed",
    REQUIRED_QUERY_PARAMS_MISSING:
      "Required query parameters are missing or invalid",

    // Error messages
    PATH_ESCAPES_BASE: "Path escapes base directory",
    NOT_INDEXED: "not indexed",
    INTERNAL_SERVER_ERROR: "Internal server error",
    REQUESTED_FOLDER_NOT_INDEXED: "Requested folder/branch is not indexed",
    VALIDATION_ERROR: "Validation error",
    NOT_FOUND_ERROR: "Not found error",
    BUSINESS_LOGIC_ERROR: "Business logic error",
    PATH_TRAVERSAL: "Path traversal error",

    // Success messages
    SUCCESSFULLY_INDEXED: "Successfully indexed",
    SUCCESSFULLY_REFRESHED: "Successfully refreshed",
    INDEXING_COMPLETED: "Indexing completed",
    REFRESH_COMPLETED: "Refresh completed",
    FILES_PROCESSED_SUCCESSFULLY: "files processed successfully",
    ERROR_INDEXING: "Error indexing",
    ERROR_REFRESHING: "Error refreshing",
    SUCCESSFULLY_CLEARED_DATA: "Successfully cleared indexed data older than",
    STATUS_SUCCESS: "success",
    STATUS_ERROR: "error",
  },
};

module.exports = constants;
