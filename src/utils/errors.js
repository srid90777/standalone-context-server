const { MESSAGES } = require("../constants/common.js");

class ValidationError extends Error {
  constructor(errors) {
    super(MESSAGES.VALIDATION_FAILED);
    this.name = MESSAGES.VALIDATION_ERROR;
    this.errors = Array.isArray(errors) ? errors : [errors];
  }
}

class NotFoundError extends Error {
  constructor(message) {
    super(message);
    this.name = MESSAGES.NOT_FOUND_ERROR;
  }
}

class BusinessLogicError extends Error {
  constructor(message) {
    super(message);
    this.name = MESSAGES.BUSINESS_LOGIC_ERROR;
  }
}

module.exports = {
  ValidationError,
  NotFoundError,
  BusinessLogicError,
};
