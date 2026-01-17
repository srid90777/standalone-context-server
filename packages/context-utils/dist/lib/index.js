'use strict';

var fs2 = require('fs');
var path = require('path');
var ignore = require('ignore');
var crypto = require('crypto');
var os = require('os');
var config = require('@cs/context-config');
var nlp = require('wink-nlp-utils');
var extractor = require('keyword-extractor');

function _interopDefault (e) { return e && e.__esModule ? e : { default: e }; }

function _interopNamespace(e) {
  if (e && e.__esModule) return e;
  var n = Object.create(null);
  if (e) {
    Object.keys(e).forEach(function (k) {
      if (k !== 'default') {
        var d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(n, k, d.get ? d : {
          enumerable: true,
          get: function () { return e[k]; }
        });
      }
    });
  }
  n.default = e;
  return Object.freeze(n);
}

var fs2__namespace = /*#__PURE__*/_interopNamespace(fs2);
var path__default = /*#__PURE__*/_interopDefault(path);
var ignore__default = /*#__PURE__*/_interopDefault(ignore);
var crypto__default = /*#__PURE__*/_interopDefault(crypto);
var os__namespace = /*#__PURE__*/_interopNamespace(os);
var config__default = /*#__PURE__*/_interopDefault(config);
var nlp__default = /*#__PURE__*/_interopDefault(nlp);
var extractor__default = /*#__PURE__*/_interopDefault(extractor);

// src/File.ts
var BASE_CONTEXT_PATH = path__default.default.join(os__namespace.homedir(), ".codespell/context");
function getConsumerRoot(customRoot) {
  if (customRoot) {
    return path__default.default.resolve(customRoot);
  }
  return "src";
}
function getRepoMapPath() {
  return path__default.default.join(getCodespellGlobalPath(), "repo_map.txt");
}
function getPathSep() {
  return path__default.default.sep;
}
function getIndexSqlitePath() {
  return path__default.default.join(getIndexFolderPath(), "index.sqlite");
}
function getLanceDbPath() {
  return path__default.default.join(getIndexFolderPath(), "lancedb");
}
function getIndexFolderPath() {
  const indexPath = path__default.default.join(getCodespellGlobalPath(), "index");
  if (!fs2__namespace.existsSync(indexPath)) {
    fs2__namespace.mkdirSync(indexPath, { recursive: true });
  }
  return indexPath;
}
var calculateHash = (path3) => {
  const hash = crypto__default.default.createHash("sha256");
  hash.update(path3);
  return hash.digest("hex");
};
function getWorkspaceDir() {
  return config__default.default.getAppConfig()["workspaceDir"];
}
function getRootDir() {
  return config__default.default.getAppConfig()["rootDir"] ?? __dirname;
}
function getBuildPath() {
  return config__default.default.getAppConfig()["buildPath"] ?? "";
}
function getCodespellGlobalPath() {
  const workspaceDir = getWorkspaceDir();
  if (!workspaceDir) {
    console.error("Workspace directory is undefined.");
    throw new Error("Please provide workspace directory");
  }
  const codespellPath = path__default.default.join(BASE_CONTEXT_PATH, calculateHash(workspaceDir));
  if (!fs2__namespace.existsSync(codespellPath)) {
    fs2__namespace.mkdirSync(codespellPath, { recursive: true });
  }
  return codespellPath;
}
function getStatsPath() {
  return path__default.default.join(getCodespellGlobalPath(), "stats.json");
}
async function getLastModified(files) {
  const result = {};
  await Promise.all(
    files.map(async (file) => {
      try {
        const { mtimeMs } = await fs2__namespace.statSync(file);
        result[file] = mtimeMs;
      } catch (error) {
        console.error(`Error getting last modified time for ${file}:`, error);
      }
    })
  );
  return result;
}
function getBasePath(filePath) {
  return path__default.default.basename(path__default.default.dirname(filePath));
}
function getScriptPath() {
  const scriptFile = config__default.default.getAppConfig().scriptFile;
  return scriptFile ? path__default.default.join(getRootDir(), getBuildPath(), scriptFile) : `${getRootDir()}/node_modules/@cs/context-provider/dist/lib/index.js`;
}

// src/File.ts
async function read(filepath) {
  return new Promise((resolve, reject) => {
    fs2__namespace.readFile(filepath, "utf8", (err, contents) => {
      if (err) {
        console.log(err);
        resolve("");
      }
      resolve(contents);
    });
  });
}
function getAllFiles(dirPath, arrayOfFiles = []) {
  if (!fs2__namespace.existsSync(dirPath)) {
    console.error(`Directory does not exist: ${dirPath}`);
  }
  const stats = fs2__namespace.statSync(dirPath);
  if (!stats.isDirectory()) {
    console.error(`Path is not a directory: ${dirPath}`);
  }
  const files = fs2__namespace.readdirSync(dirPath);
  files.forEach((file) => {
    const filePath = path__default.default.join(dirPath, file);
    const stats2 = fs2__namespace.statSync(filePath);
    if (stats2.isDirectory()) {
      getAllFiles(filePath, arrayOfFiles);
    } else if (stats2.isFile()) {
      arrayOfFiles.push(filePath);
    }
  });
  return arrayOfFiles;
}
function collectAllFiles(paths, rootDir, ignoreRules) {
  const allFiles = [];
  const defaultIgnoreRules = `# === General ===
*.log
*.tmp
*.bak
*.swp
*.swo

# === PHP ===
vendor/
composer.lock

# === Java ===
*.class
*.jar
*.war
*.ear
*.iml
*.ipr
*.iws
target/
out/
build/

# === .NET ===
[Bb]in/
[Oo]bj/
*.exe
*.dll
*.pdb
*.mdb
*.cache
*.log
*.user
*.suo
*.userosscache
*.sln.docstates

# === TypeScript / JavaScript ===
node_modules/
dist/
out/
build/
*.tsbuildinfo
package-lock*

# === Python ===
__pycache__/
*.py[cod]
*.pyo
*.pyd
*.egg
*.egg-info/
build/
dist/
.eggs/
*.env
*.venv
env/
venv/
site-packages/
lib64/
.Python

# === IDEs ===
.idea/
.vscode/
*.sublime-workspace
*.sublime-project
*.DS_Store

# === Other common ===
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pids/
*.pid
*.seed
*.pid.lock`;
  const consolidatedIgnoreRules = `${defaultIgnoreRules} ${ignoreRules}`.trim();
  paths.forEach((currentPath) => {
    if (!fs2__namespace.existsSync(currentPath)) {
      console.error(`Path does not exist: ${currentPath}`);
      return;
    }
    const stats = fs2__namespace.statSync(currentPath);
    if (stats.isFile()) {
      allFiles.push(currentPath);
    } else if (stats.isDirectory()) {
      allFiles.push(...getAllFiles(currentPath));
    } else {
      console.error(`Path is neither a file nor a directory: ${currentPath}`);
    }
  });
  return getAllowedFiles(allFiles, rootDir, consolidatedIgnoreRules);
}
function getAllowedFiles(fileList, rootDir, ignoreRules) {
  try {
    const globalIg = ignore__default.default().add(ignoreRules.replace(/\//g, "/**/"));
    const dirPath = getDirectoryPathTillFolder(fileList[0], rootDir);
    return fileList.filter((file) => {
      try {
        const relativePathToGitignore = path__default.default.relative(dirPath, file).replace(/\\/g, "/");
        return !globalIg.ignores(relativePathToGitignore);
      } catch (error) {
        console.error("Error processing file:", file, error);
        return false;
      }
    });
  } catch (error) {
    console.error("Error processing ignore files:", error);
    return [];
  }
}
function getDirectoryPathTillFolder(filePath, folderName) {
  let currentDir = path__default.default.dirname(filePath);
  while (currentDir && currentDir !== path__default.default.parse(currentDir).root) {
    if (path__default.default.basename(currentDir) === folderName) {
      return currentDir;
    }
    currentDir = path__default.default.dirname(currentDir);
  }
  throw new Error(`Folder ${folderName} not found for file ${filePath}`);
}
function getAllAllowedFilesInDir(dirPath, rootDir, ignoreFilePath) {
  const allFiles = getAllFiles(dirPath);
  return getAllowedFiles(allFiles, rootDir, ignoreFilePath);
}
function isOlderThan(dateStr, days) {
  const timestamp = new Date(dateStr).getTime();
  const msThreshold = days * 24 * 60 * 60 * 1e3;
  return Date.now() - timestamp > msThreshold;
}
function traverseAndClean(days, subpath = "", dir = BASE_CONTEXT_PATH) {
  if (!fs2__namespace.existsSync(dir)) {
    throw new Error(`Directory does not exist: ${dir}`);
  }
  const entries = fs2__namespace.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path__default.default.join(dir, entry.name);
    if (entry.isDirectory()) {
      traverseAndClean(days, subpath, fullPath);
      continue;
    }
    if (entry.isFile() && entry.name === "stats.json") {
      try {
        const content = fs2__namespace.readFileSync(fullPath, "utf-8");
        if (!content.trim()) {
          continue;
        }
        const data = JSON.parse(content);
        if (data.lastIndexedAt && isOlderThan(data.lastIndexedAt, days)) {
          const targetDir = subpath ? path__default.default.join(path__default.default.dirname(fullPath), subpath) : path__default.default.dirname(fullPath);
          if (fs2__namespace.existsSync(targetDir)) {
            fs2__namespace.rmSync(targetDir, { recursive: true, force: true });
            console.log(`Deleted: ${targetDir}`);
          } else {
            console.log(`Skipped: ${targetDir} does not exist`);
          }
        }
      } catch (err) {
        console.error(`Failed to process ${fullPath}:`, err);
      }
    }
  }
}
function writeStats(data) {
  fs2__namespace.writeFileSync(getStatsPath(), JSON.stringify(data, null, 2));
}
var WORD_SPLIT_CNT = 5;
function getCleanedTrigrams(input) {
  let text = nlp__default.default.string.removeExtraSpaces(input);
  text = nlp__default.default.string.stem(text);
  let tokens = nlp__default.default.string.tokenize(text, true).filter((token) => token.tag === "word").map((token) => token.value);
  tokens = nlp__default.default.tokens.removeWords(tokens);
  tokens = nlp__default.default.tokens.setOfWords(tokens);
  const cleanedTokens = [...tokens].join(" ");
  const trigrams = nlp__default.default.string.ngram(cleanedTokens, WORD_SPLIT_CNT);
  return trigrams.length ? trigrams : [cleanedTokens];
}
function deduplicateArray(array, equal) {
  const result = [];
  for (const item of array) {
    if (!result.some((existingItem) => equal(existingItem, item))) {
      result.push(item);
    }
  }
  return result;
}
function extractKeywords(input) {
  return extractor__default.default.extract(input, {
    language: "english",
    remove_digits: true,
    return_changed_case: true,
    remove_duplicates: true
  });
}
function hasRequiredCpuFeaturesForLanceDb() {
  const REQUIRED_CPU_FLAGS = ["avx2", "fma"];
  const arch2 = os__namespace.arch();
  if (arch2 !== "x64") {
    return true;
  }
  try {
    const cpuInfo = fs2__namespace.readFileSync("/proc/cpuinfo", "utf-8").toLowerCase();
    const hasAllRequiredFlags = cpuInfo ? REQUIRED_CPU_FLAGS.every((flag) => cpuInfo.includes(flag)) : true;
    if (!hasAllRequiredFlags) {
      console.log("Vector indexing disabled - Your Linux system lacks required CPU features (AVX2, FMA).");
    }
    return hasAllRequiredFlags;
  } catch (error) {
    console.log("Could not determine CPU features. Assuming compatibility by default.");
    return true;
  }
}
var isJson = (text) => {
  try {
    JSON.parse(text);
    return true;
  } catch (e) {
    return false;
  }
};
var safeParseJson = (text) => {
  try {
    return JSON.parse(text);
  } catch (e) {
    return text;
  }
};

exports.BASE_CONTEXT_PATH = BASE_CONTEXT_PATH;
exports.collectAllFiles = collectAllFiles;
exports.deduplicateArray = deduplicateArray;
exports.extractKeywords = extractKeywords;
exports.getAllAllowedFilesInDir = getAllAllowedFilesInDir;
exports.getBasePath = getBasePath;
exports.getBuildPath = getBuildPath;
exports.getCleanedTrigrams = getCleanedTrigrams;
exports.getCodespellGlobalPath = getCodespellGlobalPath;
exports.getConsumerRoot = getConsumerRoot;
exports.getIndexFolderPath = getIndexFolderPath;
exports.getIndexSqlitePath = getIndexSqlitePath;
exports.getLanceDbPath = getLanceDbPath;
exports.getLastModified = getLastModified;
exports.getPathSep = getPathSep;
exports.getRepoMapPath = getRepoMapPath;
exports.getRootDir = getRootDir;
exports.getScriptPath = getScriptPath;
exports.getStatsPath = getStatsPath;
exports.getWorkspaceDir = getWorkspaceDir;
exports.hasRequiredCpuFeaturesForLanceDb = hasRequiredCpuFeaturesForLanceDb;
exports.isJson = isJson;
exports.read = read;
exports.safeParseJson = safeParseJson;
exports.traverseAndClean = traverseAndClean;
exports.writeStats = writeStats;
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map