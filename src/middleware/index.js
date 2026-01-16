/**
 * Index file for middleware
 */
const { validateRequest } = require("./validation.middleware.js");

module.exports = {
  validateRequest,
};
