/**
 * Controller for handling indexing operations
 */
const BaseController = require("./base.controller.js");
const indexService = require("../services/index.service.js");

class IndexController extends BaseController {
  /**
   * Index files for context retrieval
   */
  async indexFiles(request, h) {
    return await this.executeService(
      request,
      h,
      async () => {
        const result = await indexService.indexFiles(request.payload);
        // Return only progress and status
        return {
          progress: 10,
          status: 'indexing'
        };
      },
      {
        folderName: request.payload.folderName,
        branchName: request.payload.branchName,
      },
    );
  }

  /**
   * Refresh the index for specific files
   */
  async refreshIndex(request, h) {
    return await this.executeService(
      request,
      h,
      async () => {
        // Extract folderName and branchName from path parameters
        const { folderName, branchName } = request.params;
        const payload = {
          ...request.payload,
          folderName,
          branchName,
        };
        const result = await indexService.refreshIndex(payload);
        // Return only progress and status
        return {
          progress: 10,
          status: 'indexing'
        };
      },
      {
        folderName: request.params.folderName,
        branchName: request.params.branchName,
      },
    );
  }

  /**
   * Check if a specific folder and branch are indexed
   */
  async checkIndexStatus(request, h) {
    return await this.executeService(request, h, async () => {
      return await indexService.checkIndexStatus(request.payload);
    });
  }

  /**
   * Get detailed index status information
   */
  async getDetailedIndexStatus(request, h) {
    return await this.executeService(request, h, async () => {
      const result = await indexService.getDetailedIndexStatus(request.payload);
      // Return only workspaceDir and lastIndexedAt
      return {
        workspaceDir: request.payload.workspaceDir,
        lastIndexedAt: result.indexInfo?.indexedAt ? new Date(result.indexInfo.indexedAt).getTime() : null
      };
    });
  }

  /**
   * Clear old indexed data
   */
  async clearIndex(request, h) {
    return await this.executeService(request, h, async () => {
      // Extract days from query parameters with default value
      const days = request.query.days || 3;
      const result = await indexService.clearOldIndexedData({ days });
      // Return only message
      return {
        message: "Successfully cleared indexed data."
      };
    });
  }
}

module.exports = new IndexController();
