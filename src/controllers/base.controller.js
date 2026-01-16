/**
 * Base controller class with common functionality
 */
const path = require("path");
const { HTTP_STATUS_CODES, MESSAGES } = require("../constants/common.js");

class BaseController {
  /**
   * Ensure a relative path stays within a base directory (prevents path traversal)
   * @param {string} baseDir - Base directory path
   * @param {string} relativePath - Relative path to validate
   * @returns {Object} Object with resolvedBase and abs properties
   */
  static resolveAndValidatePath(baseDir, relativePath) {
    const resolvedBase = path.resolve(baseDir);
    const abs = path.resolve(resolvedBase, relativePath);

    if (abs !== resolvedBase && !abs.startsWith(resolvedBase + path.sep)) {
      const err = new Error(MESSAGES.PATH_ESCAPES_BASE);
      err.code = MESSAGES.PATH_TRAVERSAL;
      throw err;
    }

    return { resolvedBase, abs };
  }

  /**
   * Handle successful responses
   * @param {Object} h - Hapi response toolkit
   * @param {*} data - Data to send in response
   * @param {number} statusCode - HTTP status code (default: 200)
   */
  sendSuccess(h, data, statusCode = HTTP_STATUS_CODES.OK) {
    return h.response({
      success: true,
      data: data
    }).code(statusCode);
  }

  /**
   * Handle error responses
   * @param {Object} h - Hapi response toolkit
   * @param {string} message - Error message
   * @param {number} statusCode - HTTP status code (default: 500)
   * @param {Object} additionalData - Additional data to include in error response (unused for consistency)
   */
  sendError(
    h,
    message,
    statusCode = HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR,
    additionalData = {},
  ) {
    return h
      .response({
        success: false,
        error: message,
      })
      .code(statusCode);
  }

  /**
   * Handle validation errors
   * @param {Object} h - Hapi response toolkit
   * @param {string[]} errors - Array of validation error messages
   */
  sendValidationError(h, errors) {
    return this.sendError(
      h,
      `${MESSAGES.REQUIRED_FIELDS_MISSING}: ${errors.join(", ")}`,
      HTTP_STATUS_CODES.BAD_REQUEST,
    );
  }

  /**
   * Handle not found errors
   * @param {Object} h - Hapi response toolkit
   * @param {string} message - Not found message
   * @param {Object} additionalData - Additional data to include
   */
  sendNotFound(h, message, additionalData = {}) {
    return this.sendError(
      h,
      message,
      HTTP_STATUS_CODES.NOT_FOUND,
      additionalData,
    );
  }

  /**
   * Execute a service method and handle response
   * @param {Object} request - Hapi request object
   * @param {Object} h - Hapi response toolkit
   * @param {Function} serviceMethod - Service method to execute
   * @param {Object} errorContext - Additional context for error responses
   */
  async executeService(request, h, serviceMethod, errorContext = {}) {
    try {
      const result = await serviceMethod();
      return this.sendSuccess(h, result);
    } catch (error) {
      if (error.name === MESSAGES.NOT_FOUND_ERROR) {
        return this.sendNotFound(h, error.message, errorContext);
      }

      if (error.message && error.message.includes(MESSAGES.NOT_INDEXED)) {
        return this.sendNotFound(h, MESSAGES.REQUESTED_FOLDER_NOT_INDEXED, {
          folderName: request.payload.folderName,
          branchName: request.payload.branchName,
        });
      }

      return this.sendError(
        h,
        error.message || MESSAGES.INTERNAL_SERVER_ERROR,
        HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR,
        errorContext,
      );
    }
  }
}

module.exports = BaseController;
