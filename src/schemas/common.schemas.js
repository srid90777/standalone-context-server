/**
 * Common Zod validation schemas shared across different endpoints
 */
const { z } = require("zod");

// Base schemas for common fields
const workspaceDirSchema = z.string().min(1, "Workspace directory is required");
const folderNameSchema = z.string().min(1, "Folder name is required");
const branchNameSchema = z.string().min(1, "Branch name is required");
const filesToIndexSchema = z
  .array(z.string().min(1, "File path cannot be empty"))
  .min(1, "At least one file must be provided");
const recentlyEditedFilesSchema = z.array(z.string()).optional().default([]);

module.exports = {
  workspaceDirSchema,
  folderNameSchema,
  branchNameSchema,
  filesToIndexSchema,
  recentlyEditedFilesSchema,
};
