/**
 * Zod validation schemas for index operations
 */
const { z } = require("zod");
const {
  workspaceDirSchema,
  folderNameSchema,
  branchNameSchema,
  filesToIndexSchema,
} = require("./common.schemas.js");
const {
  DEFAULT_CLEAR_DAYS,
  MIN_CLEAR_DAYS,
} = require("../constants/common.js");

// Index request schema
const indexRequestSchema = z.object({
  workspaceDir: workspaceDirSchema,
  filesToIndex: filesToIndexSchema,
  folderName: folderNameSchema,
  branchName: branchNameSchema,
});

// Refresh index request schema
const refreshIndexRequestSchema = z.object({
  workspaceDir: workspaceDirSchema,
  filesToIndex: filesToIndexSchema,
});

// Index status request schema
const indexStatusRequestSchema = z.object({
  workspaceDir: workspaceDirSchema,
  folderName: folderNameSchema,
  branchName: branchNameSchema,
});

// Clear request schema - for query parameters
const clearRequestSchema = z.object({
  days: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : DEFAULT_CLEAR_DAYS))
    .refine((val) => !isNaN(val) && val >= MIN_CLEAR_DAYS, {
      message: "Days must be a non-negative number",
    }),
});

module.exports = {
  indexRequestSchema,
  refreshIndexRequestSchema,
  indexStatusRequestSchema,
  clearRequestSchema,
};
