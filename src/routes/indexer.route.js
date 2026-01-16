/**
 * Hapi routes for indexing operations
 */
const indexController = require("../controllers/index.controller.js");
const {
  validateRequest,
  validateQuery,
} = require("../middleware/validation.middleware.js");
const {
  indexRequestSchema,
  refreshIndexRequestSchema,
  indexStatusRequestSchema,
  clearRequestSchema,
} = require("../schemas/index.schemas.js");
const {
  API_BASE_PATH,
  API_ENDPOINTS,
  HTTP_METHODS,
} = require("../constants/common.js");

const routes = [
  /**
   * POST /api/v1/ai/index
   * Index an array of files for context retrieval
   */
  {
    method: HTTP_METHODS.POST,
    path: `${API_BASE_PATH}${API_ENDPOINTS.INDEX}`,
    handler: async (request, h) => {
      return await indexController.indexFiles(request, h);
    },
    options: {
      pre: [{ method: validateRequest(indexRequestSchema) }],
    },
  },

  /**
   * PUT /api/v1/ai/index/{folderName}/{branchName}
   * Refresh the index for a specific folder and branch
   */
  {
    method: HTTP_METHODS.PUT,
    path: `${API_BASE_PATH}${API_ENDPOINTS.INDEX}/{folderName}/{branchName}`,
    handler: async (request, h) => {
      return await indexController.refreshIndex(request, h);
    },
    options: {
      pre: [{ method: validateRequest(refreshIndexRequestSchema) }],
    },
  },

  /**
   * DELETE /api/v1/ai/index
   * Clear old indexed data
   */
  {
    method: HTTP_METHODS.DELETE,
    path: `${API_BASE_PATH}${API_ENDPOINTS.INDEX}`,
    handler: async (request, h) => {
      return await indexController.clearIndex(request, h);
    },
    options: {
      pre: [{ method: validateQuery(clearRequestSchema) }],
    },
  },

  /**
   * POST /api/v1/ai/index/status
   * Get detailed index status information
   */
  {
    method: HTTP_METHODS.POST,
    path: `${API_BASE_PATH}${API_ENDPOINTS.INDEX_STATUS}`,
    handler: async (request, h) => {
      return await indexController.getDetailedIndexStatus(request, h);
    },
    options: {
      pre: [{ method: validateRequest(indexStatusRequestSchema) }],
    },
  },
];

module.exports = routes;
