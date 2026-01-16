/**
 * Controller for handling context retrieval operations
 */
const BaseController = require("./base.controller.js");
const retrieveService = require("../services/retrieve.service.js");

class RetrieveController extends BaseController {
  /**
   * Retrieve context based on query
   */
  async retrieveContext(request, h) {
    return await this.executeService(
      request,
      h,
      async () => {
        const payload = {
          ...request.payload,
          authorization: request.headers.authorization,
        };

        const results = [];
        // Consume the generator to build the full response array
        for await (const result of retrieveService.retrieveContext(
          payload,
          () => {} // No-op progress callback since we are not streaming
        )) {
          results.push(result);
        }

        // Filter results to only include required fields
        const filteredResults = results
          .filter(item => item.data && item.data !== null) // Filter out completion markers
          .map(item => ({
            id: item.data.id,
            cacheKey: item.data.cacheKey,
            path: item.data.path,
            startLine: item.data.startLine,
            endLine: item.data.endLine,
            content: item.data.content
          }));

        return {
          result: filteredResults
        };
      },
      {
        folderName: request.payload.folderName,
        branchName: request.payload.branchName,
      }
    );
  }
}

module.exports = new RetrieveController();
