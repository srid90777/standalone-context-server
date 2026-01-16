/**
 * Hapi routes for handling context retrieval
 */
const retrieveController = require("../controllers/retrieve.controller.js");
const { validateRequest } = require("../middleware/validation.middleware.js");
const { retrieveRequestSchema } = require("../schemas/retrieve.schemas.js");
const {
  API_BASE_PATH,
  API_ENDPOINTS,
  HTTP_METHODS,
} = require("../constants/common.js");

const routes = [
  /**
   * POST /api/v1/ai/retrieve
   * Retrieve context based on query
   */
  {
    method: HTTP_METHODS.POST,
    path: `${API_BASE_PATH}${API_ENDPOINTS.RETRIEVE}`,
    handler: async (request, h) => {
      return await retrieveController.retrieveContext(request, h);
    },
    options: {
      pre: [{ method: validateRequest(retrieveRequestSchema) }],
    },
  },
];

module.exports = routes;
