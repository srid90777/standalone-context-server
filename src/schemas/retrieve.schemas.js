/**
 * Zod validation schemas for retrieve operations
 */
const { z } = require("zod");
const {
  workspaceDirSchema,
  folderNameSchema,
  branchNameSchema,
  recentlyEditedFilesSchema,
} = require("./common.schemas.js");

// Retrieve request schema
const retrieveRequestSchema = z.object({
  workspaceDir: workspaceDirSchema,
  recentlyEditedFiles: recentlyEditedFilesSchema,
  folderName: folderNameSchema,
  branchName: branchNameSchema,
  query: z.string().min(1, "Query is required"),
});

module.exports = {
  retrieveRequestSchema,
};
