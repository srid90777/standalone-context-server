const ValidationService = require("../services/validation.service.js");
const { HTTP_STATUS_CODES, MESSAGES } = require("../constants/common.js");

/**
 * Create validation middleware for a given schema for Hapi.js
 * @param {Object} schema - Zod schema to validate against
 * @returns {Function} Hapi pre-handler function
 */
function validateRequest(schema) {
  return async (request, h) => {
    try {
      request.payload = ValidationService.validate(schema, request.payload);
      return h.continue;
    } catch (error) {
      if (error.name === MESSAGES.VALIDATION_ERROR || error.name === 'ZodError') {
        let errorMessage = MESSAGES.VALIDATION_FAILED;
        
        if (error.name === 'ZodError') {
          const details = (error.errors || error.issues || []).map(err => {
            const fieldName = err.path ? err.path.join('.') : 'field';
            return `${fieldName}: ${err.message || 'is required'}`;
          });
          errorMessage = details.join('; ');
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        return h
          .response({
            success: false,
            error: errorMessage
          })
          .code(HTTP_STATUS_CODES.BAD_REQUEST)
          .takeover();
      }

      return h
        .response({
          success: false,
          error: error.message || MESSAGES.VALIDATION_FAILED,
        })
        .code(HTTP_STATUS_CODES.BAD_REQUEST)
        .takeover();
    }
  };
}

/**
 * Create query validation middleware for a given schema for Hapi.js
 * @param {Object} schema - Zod schema to validate against
 * @returns {Function} Hapi pre-handler function
 */
function validateQuery(schema) {
  return async (request, h) => {
    try {
      request.query = ValidationService.validate(schema, request.query);
      return h.continue;
    } catch (error) {
      if (error.name === MESSAGES.VALIDATION_ERROR || error.name === 'ZodError') {
        let errorMessage = MESSAGES.QUERY_VALIDATION_FAILED;
        
        if (error.name === 'ZodError') {
          const details = (error.errors || error.issues || []).map(err => {
            const fieldName = err.path ? err.path.join('.') : 'field';
            return `${fieldName}: ${err.message || 'is required'}`;
          });
          errorMessage = details.join('; ');
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        return h
          .response({
            success: false,
            error: errorMessage
          })
          .code(HTTP_STATUS_CODES.BAD_REQUEST)
          .takeover();
      }

      return h
        .response({
          success: false,
          error: error.message || MESSAGES.QUERY_VALIDATION_FAILED,
        })
        .code(HTTP_STATUS_CODES.BAD_REQUEST)
        .takeover();
    }
  };
}

module.exports = {
  validateRequest,
  validateQuery,
};
