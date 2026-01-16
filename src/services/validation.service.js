/**
 * Validation utilities using Zod
 */
const { ValidationError } = require("../utils/errors.js");

class ValidationService {
  /**
   * Validate data against a Zod schema
   * @param {Object} schema - Zod schema
   * @param {*} data - Data to validate
   * @returns {*} Validated and parsed data
   * @throws {ValidationError} If validation fails
   */
  static validate(schema, data) {
    try {
      return schema.parse(data);
    } catch (error) {
      if (error.errors) {
        const errorMessages = error.errors.map(err => {
          const fieldPath = err.path.length > 0 ? err.path.join('.') : 'root';
          return `${fieldPath}: ${err.message}`;
        });
        
        const validationError = new ValidationError(errorMessages);
        
        validationError.validationDetails = error.errors.map(err => ({
          field: err.path.join('.') || 'root',
          expected: err.expected,
          code: err.code,
          path: err.path,
          message: err.message
        }));
        
        throw validationError;
      }
      throw error;
    }
  }

  /**
   * Safely validate data and return result with success flag
   * @param {Object} schema - Zod schema
   * @param {*} data - Data to validate
   * @returns {Object} Result object with success flag and data or errors
   */
  static safeValidate(schema, data) {
    try {
      const validatedData = this.validate(schema, data);
      return {
        success: true,
        data: validatedData,
        errors: null,
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        errors: error.errors || [error.message],
      };
    }
  }
}

module.exports = ValidationService;
