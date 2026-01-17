declare function read(filepath: string): Promise<string>;
declare function collectAllFiles(paths: string[], rootDir: string, ignoreRules: string): string[];
declare function getAllAllowedFilesInDir(dirPath: string, rootDir: string, ignoreFilePath: string): string[];
declare function traverseAndClean(days: number, subpath?: string, dir?: string): void;
declare function writeStats(data: object): void;

declare const BASE_CONTEXT_PATH: string;
/**
 * Get the root directory of the consuming project.
 * Combines user-supplied paths, `process.cwd()`, and `require.main`.
 * @param customRoot Optional user-supplied root directory.
 * @returns The absolute path to the consumer's root directory.
 */
declare function getConsumerRoot(customRoot?: string): string;
declare function getRepoMapPath(): string;
declare function getPathSep(): "\\" | "/";
declare function getIndexSqlitePath(): string;
declare function getLanceDbPath(): string;
declare function getIndexFolderPath(): string;
declare function getWorkspaceDir(): string;
declare function getRootDir(): string;
declare function getBuildPath(): string;
declare function getCodespellGlobalPath(): string;
declare function getStatsPath(): string;
declare function getLastModified(files: string[]): Promise<Record<string, number>>;
declare function getBasePath(filePath: string): string;
declare function getScriptPath(): string;

declare function getCleanedTrigrams(input: string): string[];
declare function deduplicateArray<T>(array: T[], equal: (a: T, b: T) => boolean): T[];
declare function extractKeywords(input: string): string[];
/**
 * Determines whether the current Linux system has the required CPU features
 * to support LanceDB's native vector indexing binaries.
 *
 * Specifically, LanceDB requires the `avx2` and `fma` CPU flags, which are
 * common on modern x64 processors. This check only applies on x64 Linux systems.
 *
 * @returns {boolean} - `true` if supported or not applicable; `false` if unsupported.
 */
declare function hasRequiredCpuFeaturesForLanceDb(): boolean;
declare const isJson: (text: string) => boolean;
declare const safeParseJson: (text: string) => any;

export { BASE_CONTEXT_PATH, collectAllFiles, deduplicateArray, extractKeywords, getAllAllowedFilesInDir, getBasePath, getBuildPath, getCleanedTrigrams, getCodespellGlobalPath, getConsumerRoot, getIndexFolderPath, getIndexSqlitePath, getLanceDbPath, getLastModified, getPathSep, getRepoMapPath, getRootDir, getScriptPath, getStatsPath, getWorkspaceDir, hasRequiredCpuFeaturesForLanceDb, isJson, read, safeParseJson, traverseAndClean, writeStats };
