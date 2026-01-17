'use strict';

var config2 = require('@cs/context-config');
var EmbeddingFactory = require('@cs/embedding');
var contextUtils = require('@cs/context-utils');
var Chunker = require('@cs/chunker');
var crypto = require('crypto');
var sequelizeTypescript = require('sequelize-typescript');
var sequelize = require('sequelize');
var uuid = require('uuid');
var lancedb = require('@lancedb/lancedb');
var Parser = require('@cs/tree-sitter');
var ChildProcess = require('@cs/process-monitor');
var process2 = require('process');

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

var config2__default = /*#__PURE__*/_interopDefault(config2);
var EmbeddingFactory__default = /*#__PURE__*/_interopDefault(EmbeddingFactory);
var Chunker__default = /*#__PURE__*/_interopDefault(Chunker);
var crypto__default = /*#__PURE__*/_interopDefault(crypto);
var lancedb__namespace = /*#__PURE__*/_interopNamespace(lancedb);
var Parser__default = /*#__PURE__*/_interopDefault(Parser);
var ChildProcess__default = /*#__PURE__*/_interopDefault(ChildProcess);
var process2__default = /*#__PURE__*/_interopDefault(process2);

var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __decorateClass = (decorators, target, key, kind) => {
  var result = kind > 1 ? void 0 : kind ? __getOwnPropDesc(target, key) : target;
  for (var i = decorators.length - 1, decorator; i >= 0; i--)
    if (decorator = decorators[i])
      result = (kind ? decorator(target, key, result) : decorator(result)) || result;
  if (kind && result) __defProp(target, key, result);
  return result;
};
var __publicField = (obj, key, value) => __defNormalProp(obj, key + "" , value);

// ../../node_modules/p-try/index.js
var require_p_try = __commonJS({
  "../../node_modules/p-try/index.js"(exports, module) {
    var pTry = (fn, ...arguments_) => new Promise((resolve) => {
      resolve(fn(...arguments_));
    });
    module.exports = pTry;
    module.exports.default = pTry;
  }
});

// ../../node_modules/p-limit/index.js
var require_p_limit = __commonJS({
  "../../node_modules/p-limit/index.js"(exports, module) {
    var pTry = require_p_try();
    var pLimit = (concurrency) => {
      if (!((Number.isInteger(concurrency) || concurrency === Infinity) && concurrency > 0)) {
        return Promise.reject(new TypeError("Expected `concurrency` to be a number from 1 and up"));
      }
      const queue = [];
      let activeCount = 0;
      const next = () => {
        activeCount--;
        if (queue.length > 0) {
          queue.shift()();
        }
      };
      const run = (fn, resolve, ...args) => {
        activeCount++;
        const result = pTry(fn, ...args);
        resolve(result);
        result.then(next, next);
      };
      const enqueue = (fn, resolve, ...args) => {
        if (activeCount < concurrency) {
          run(fn, resolve, ...args);
        } else {
          queue.push(run.bind(null, fn, resolve, ...args));
        }
      };
      const generator = (fn, ...args) => new Promise((resolve) => enqueue(fn, resolve, ...args));
      Object.defineProperties(generator, {
        activeCount: {
          get: () => activeCount
        },
        pendingCount: {
          get: () => queue.length
        },
        clearQueue: {
          value: () => {
            queue.length = 0;
          }
        }
      });
      return generator;
    };
    module.exports = pLimit;
    module.exports.default = pLimit;
  }
});

// src/llm/BaseLlm.ts
var BaseLlm = class {
  constructor(options) {
    this.options = options;
    this.options = options;
  }
  static llmName;
  model;
};

// src/llm/DelegatedLlm.ts
var DelegatedLlm = class extends BaseLlm {
  static llmName = "DelegatedLlm";
  async chat(input) {
    return this.options.invokeFn(input);
  }
};

// src/llm/LlmFactory.ts
var llms = [DelegatedLlm];
var getLlmClassFromName = (name) => llms.find((cls) => cls.llmName === name);
var LlmFactory = class {
  static create = (name, params) => {
    const llm = getLlmClassFromName(name);
    if (!llm) {
      console.warn(`Unknown Llm ${name}`);
    }
    return params ? new llm(params) : new llm();
  };
};

// src/service/AbstractCodebaseService.ts
var import_p_limit = __toESM(require_p_limit());

// src/constant/Database.ts
var SequelizeErrorCode = {
  ECONNREFUSED: "Database connection refused.",
  EHOSTUNREACH: "Database host is unreachable.",
  ETIMEOUT: "Database connection timeout.",
  "22P02": "Invalid input syntax for data type.",
  "23505": "Unique constraint violation.",
  "23502": "NOT NULL constraint violation.",
  "23503": "Foreign key constraint violation.",
  "23514": "Validation failed",
  "42703": "Undefined column.",
  "42P01": "Undefined table."
};

// src/repository/orm/BaseRepository.ts
var BaseRepository = class {
  error(error) {
    return error.name.length ? `${error.name}: ${SequelizeErrorCode[error?.parent?.code]}` : error;
  }
  getFindOptions(attributes, conditions, raw = false) {
    return {
      rejectOnEmpty: false,
      raw,
      ...conditions ? { where: conditions } : {},
      ...attributes?.length ? { attributes } : null
    };
  }
};
var GlobalCache = class extends sequelizeTypescript.Model {
};
__decorateClass([
  sequelizeTypescript.Column({ type: sequelizeTypescript.DataType.STRING })
], GlobalCache.prototype, "cacheKey", 2);
__decorateClass([
  sequelizeTypescript.Column({ type: sequelizeTypescript.DataType.STRING })
], GlobalCache.prototype, "dir", 2);
__decorateClass([
  sequelizeTypescript.Column({ type: sequelizeTypescript.DataType.STRING })
], GlobalCache.prototype, "artifactId", 2);
__decorateClass([
  sequelizeTypescript.Column({ type: sequelizeTypescript.DataType.STRING })
], GlobalCache.prototype, "branch", 2);
__decorateClass([
  sequelizeTypescript.Column({ type: sequelizeTypescript.DataType.STRING })
], GlobalCache.prototype, "path", 2);
__decorateClass([
  sequelizeTypescript.Column({ type: sequelizeTypescript.DataType.STRING })
], GlobalCache.prototype, "identifier", 2);
GlobalCache = __decorateClass([
  sequelizeTypescript.Table({ tableName: "GlobalCache" })
], GlobalCache);
var Chunk = class extends sequelizeTypescript.Model {
};
__decorateClass([
  sequelizeTypescript.Column({ type: sequelizeTypescript.DataType.STRING })
], Chunk.prototype, "cacheKey", 2);
__decorateClass([
  sequelizeTypescript.Column({ type: sequelizeTypescript.DataType.STRING })
], Chunk.prototype, "path", 2);
__decorateClass([
  sequelizeTypescript.Column({ type: sequelizeTypescript.DataType.INTEGER })
], Chunk.prototype, "startLine", 2);
__decorateClass([
  sequelizeTypescript.Column({ type: sequelizeTypescript.DataType.INTEGER })
], Chunk.prototype, "endLine", 2);
__decorateClass([
  sequelizeTypescript.Column({ type: sequelizeTypescript.DataType.STRING })
], Chunk.prototype, "content", 2);
Chunk = __decorateClass([
  sequelizeTypescript.Table({ tableName: "Chunk" })
], Chunk);
var CacheReport = class extends sequelizeTypescript.Model {
};
__decorateClass([
  sequelizeTypescript.Column({ type: sequelizeTypescript.DataType.STRING })
], CacheReport.prototype, "identity", 2);
__decorateClass([
  sequelizeTypescript.Column({ type: sequelizeTypescript.DataType.STRING })
], CacheReport.prototype, "artifactId", 2);
__decorateClass([
  sequelizeTypescript.Column({ type: sequelizeTypescript.DataType.STRING })
], CacheReport.prototype, "status", 2);
CacheReport = __decorateClass([
  sequelizeTypescript.Table({ tableName: "CacheReport" })
], CacheReport);

// src/repository/orm/GlobalCacheRepository.ts
var GlobalCacheRepository = class extends BaseRepository {
  async getAll(attributes, conditions, raw = false) {
    const options = this.getFindOptions(attributes, conditions, raw);
    return await GlobalCache.findAll(options);
  }
  async getLatest(attributes, conditions, raw = false) {
    const options = this.getFindOptions(attributes, conditions, raw);
    options.order = [["updatedAt", "DESC"]];
    const globalCache = await GlobalCache.findOne(options) ?? {};
    let chunk = {};
    if (Object.keys(globalCache).length > 0) {
      const chunkOptions = this.getFindOptions(
        [],
        { cacheKey: globalCache.cacheKey },
        raw
      );
      chunk = await Chunk.findOne(chunkOptions);
    }
    return Object.assign({}, chunk, globalCache);
  }
  async replace(tag) {
    const tagValue = {
      cacheKey: tag.cacheKey,
      dir: tag.dir,
      branch: tag.branch,
      artifactId: tag.artifactId,
      path: tag.path,
      identifier: tag.identifier
    };
    await GlobalCache.upsert(tagValue);
  }
  async delete(conditions) {
    await GlobalCache.destroy({ where: conditions });
  }
  async getAllReport(attributes, conditions, raw = false) {
    const options = this.getFindOptions(attributes, conditions, raw);
    return await CacheReport.findAll(options);
  }
  async flagComplete(identity, artifactId) {
    await this.addStatus({ identity, artifactId, status: "done" });
  }
  async addStatus(data) {
    await CacheReport.create(data);
  }
  async getCompleted(identity, artifactId) {
    return await this.getAllReport([], { identity, artifactId, status: "done" }, true);
  }
  async getCompletedIndexbyIdentity(identity) {
    return await this.getAllReport([], { identity, status: "done" }, true);
  }
};

// src/indexer/core/GlobalCacheCodeBaseIndex.ts
var GlobalCacheCodeBaseIndex = class _GlobalCacheCodeBaseIndex {
  artifactId = "globalCache";
  repo;
  constructor() {
    this.repo = new GlobalCacheRepository();
  }
  getArtifactId() {
    return this.artifactId;
  }
  static async create() {
    return new _GlobalCacheCodeBaseIndex();
  }
  async *update(indexTag, refreshIndex, identifier, _) {
    const add = [...refreshIndex.compute, ...refreshIndex.addTag];
    const remove = [...refreshIndex.del, ...refreshIndex.removeTag];
    await Promise.all([
      ...remove.map((tag) => {
        return this.deleteOrRemoveTag({ ...tag, identifier });
      }),
      ...add.map((tag) => {
        return this.computeOrAddTag({ ...tag, identifier });
      })
    ]);
    yield { progress: 1, desc: "Done updating global cache", status: "done" };
  }
  async computeOrAddTag(tag) {
    await this.repo.replace(tag);
  }
  async deleteOrRemoveTag(tag) {
    await this.repo.delete({
      cacheKey: tag.cacheKey,
      dir: tag.dir,
      branch: tag.branch,
      artifactId: tag.artifactId,
      path: tag.path,
      identifier: tag.identifier
    });
  }
  identifyChanges(tag, currentFiles) {
    throw new Error("Method not implemented.");
  }
  async getLatestChunk(dir, branch) {
    const lastCachedFile = await this.repo.getLatest([], { dir, branch }, true);
    if (Object.keys(lastCachedFile).length === 0) {
      return {};
    }
    return {
      path: lastCachedFile.path,
      indexedAt: lastCachedFile.updatedAt
    };
  }
  async get(identifier, artifactId) {
    return await this.repo.getAll([], { identifier, artifactId }, true);
  }
  async getCompleted(identifier, artifactId) {
    return await this.repo.getCompleted(identifier, artifactId);
  }
  async getCompletedCount(identifier) {
    return (await this.repo.getCompletedIndexbyIdentity(identifier)).length;
  }
};
var Tag = class extends sequelizeTypescript.Model {
};
__decorateClass([
  sequelizeTypescript.Column({ type: sequelizeTypescript.DataType.STRING })
], Tag.prototype, "dir", 2);
__decorateClass([
  sequelizeTypescript.Column({ type: sequelizeTypescript.DataType.STRING })
], Tag.prototype, "branch", 2);
__decorateClass([
  sequelizeTypescript.Column({ type: sequelizeTypescript.DataType.STRING })
], Tag.prototype, "artifactId", 2);
__decorateClass([
  sequelizeTypescript.Column({ type: sequelizeTypescript.DataType.STRING })
], Tag.prototype, "path", 2);
__decorateClass([
  sequelizeTypescript.Column({ type: sequelizeTypescript.DataType.STRING })
], Tag.prototype, "cacheKey", 2);
__decorateClass([
  sequelizeTypescript.Column({ type: sequelizeTypescript.DataType.STRING })
], Tag.prototype, "lastUpdatedAt", 2);
__decorateClass([
  sequelizeTypescript.Column({ type: sequelizeTypescript.DataType.STRING, allowNull: true })
], Tag.prototype, "projectId", 2);
__decorateClass([
  sequelizeTypescript.Column({ type: sequelizeTypescript.DataType.INTEGER, allowNull: true })
], Tag.prototype, "orgId", 2);
__decorateClass([
  sequelizeTypescript.Column({ type: sequelizeTypescript.DataType.INTEGER, allowNull: true })
], Tag.prototype, "tenantId", 2);
Tag = __decorateClass([
  sequelizeTypescript.Table({ tableName: "Tag" })
], Tag);

// src/repository/orm/TagRepository.ts
var TagRepository = class extends BaseRepository {
  getWhereCondition(tag, extraConditions) {
    const whereCondition = Object.fromEntries(
      Object.entries({
        dir: tag.dir,
        branch: tag.branch,
        artifactId: tag.artifactId,
        projectId: tag.projectId,
        tenantId: tag.tenantId,
        org: tag.orgId
      }).filter(([_, value]) => value != null)
      // Filter out null or undefined values
    );
    return {
      where: {
        ...whereCondition,
        ...extraConditions
      }
    };
  }
  async getAll(tag) {
    const findOptions = tag ? this.getWhereCondition(tag) : {};
    return await Tag.findAll(findOptions);
  }
  async update(updateFields, conditions) {
    const { tag, ...extraConditions } = conditions;
    await Tag.update(updateFields, this.getWhereCondition(tag, extraConditions));
  }
  async replaceOrInsert(tag) {
    const chunk = await Chunk.findOne({
      where: { cacheKey: tag.cacheKey, path: tag.path },
      raw: true
    });
    if (chunk) {
      await Tag.upsert(tag);
    }
  }
  async delete(tag) {
    const extraConditions = { path: tag.path, cacheKey: tag.cacheKey };
    await Tag.destroy(this.getWhereCondition(tag, extraConditions));
  }
};

// src/service/AbstractCodebaseService.ts
var calculateHash = (fileContents) => {
  const hash = crypto__default.default.createHash("sha256");
  hash.update(fileContents);
  return hash.digest("hex");
};
var AbstractCodebaseService = class {
  tagRepo;
  globalCacheRepo;
  constructor() {
    this.tagRepo = new TagRepository();
    this.globalCacheRepo = new GlobalCacheRepository();
  }
  tagToString(tag) {
    return `${tag.dir}::${tag.branch}::${tag.artifactId}`;
  }
  async computeTag(indexTag, currentFiles, refresh) {
    const files = { ...currentFiles };
    const tags = await this.getTags(indexTag);
    const itemsToUpdate = [];
    const itemsToDelete = [];
    const itemsToUpdateTimestamp = [];
    for (const tag of tags) {
      const { lastUpdatedAt } = tag;
      if (!refresh && files[tag.path] === void 0) {
        itemsToDelete.push(tag);
      } else {
        if (Number(lastUpdatedAt) < files[tag.path]) {
          const newCacheKey = calculateHash(await contextUtils.read(tag.path));
          if (tag.cacheKey !== newCacheKey) {
            itemsToDelete.push({ ...tag });
            const newTag = { ...tag };
            newTag.cacheKey = newCacheKey;
            itemsToUpdate.push(newTag);
          } else {
            itemsToUpdateTimestamp.push(tag);
          }
        }
        delete files[tag.path];
      }
    }
    const limit = (0, import_p_limit.default)(10);
    const promises = Object.keys(files).map(async (path) => {
      const fileContents = await limit(() => contextUtils.read(path));
      return { path, cacheKey: calculateHash(fileContents), ...indexTag };
    });
    const itemsToAdd = await Promise.all(promises);
    return {
      add: [...itemsToAdd, ...itemsToUpdate],
      remove: itemsToDelete,
      updateLastUpdated: itemsToUpdateTimestamp,
      markComplete: this.markComplete
    };
  }
  async getTags(tag) {
    return await this.tagRepo.getAll(tag);
  }
  async markComplete(tags, type) {
    if (tags.length <= 0) {
      return;
    }
    const newUpdatedAt = Date.now();
    const tagRepo = new TagRepository();
    for (const tag of tags) {
      switch (type) {
        case "compute" /* Compute */:
        case "addTag" /* AddTag */:
          tag.lastUpdatedAt = String(newUpdatedAt);
          await tagRepo.replaceOrInsert(tag);
          break;
        case "removeTag" /* RemoveTag */:
        case "del" /* Delete */:
          await tagRepo.delete(tag);
          break;
        case "updateLastUpdated" /* UpdateLastUpdated */:
          await tagRepo.update(
            { cacheKey: tag.cacheKey, lastUpdatedAt: String(newUpdatedAt) },
            { tag, path: tag.path }
          );
          break;
        case "updateStatus" /* StatusUpdate */:
          const globalCacheRepo = new GlobalCacheRepository();
          await globalCacheRepo.flagComplete(tags[0].cacheKey, tags[0].artifactId);
          break;
      }
    }
  }
  async identifyChanges(tag, currentFiles, identifier, refresh = false) {
    const { add, remove, updateLastUpdated, markComplete } = await this.computeTag(tag, currentFiles, refresh);
    const compute = [];
    const del = [];
    const addTag = [];
    const removeTag = [];
    for (const tag2 of add) {
      const isExist = await this.checkIfCacheExist(tag2.cacheKey, tag2.artifactId, tag2.path);
      isExist ? addTag.push(tag2) : compute.push(tag2);
    }
    for (const tag2 of remove) {
      const isExist = await this.checkIfCacheExist(tag2.cacheKey, tag2.artifactId, tag2.path);
      !isExist ? removeTag.push(tag2) : del.push(tag2);
    }
    const globalCacheIndex = await GlobalCacheCodeBaseIndex.create();
    return [
      { compute, del, addTag, removeTag },
      updateLastUpdated,
      async (tags, type) => {
        await markComplete(tags, type);
        const results = {
          compute: [],
          del: [],
          addTag: [],
          removeTag: []
        };
        results[type] = tags;
        for await (const _ of globalCacheIndex.update(tag, results, identifier, async () => {
        })) {
        }
      }
    ];
  }
  async getTagsFromGlobalCache(cacheKey, artifactId, path) {
    return await this.globalCacheRepo.getAll(["dir", "branch", "artifactId"], { cacheKey, artifactId, path });
  }
  async checkIfCacheExist(cacheKey, artifactId, path) {
    const existingCache = await this.getTagsFromGlobalCache(cacheKey, artifactId, path);
    return existingCache.length > 0;
  }
};
var ChunkTag = class extends sequelizeTypescript.Model {
};
__decorateClass([
  sequelizeTypescript.Column({ type: sequelizeTypescript.DataType.STRING })
], ChunkTag.prototype, "tagString", 2);
__decorateClass([
  sequelizeTypescript.ForeignKey(() => Chunk),
  sequelizeTypescript.Column({ type: sequelizeTypescript.DataType.INTEGER })
], ChunkTag.prototype, "chunkId", 2);
ChunkTag = __decorateClass([
  sequelizeTypescript.Table({ tableName: "ChunkTag" })
], ChunkTag);

// src/repository/orm/ChunkRepository.ts
var ChunkRepository = class extends BaseRepository {
  async getAll(attributes, conditions, raw = false) {
    const options = this.getFindOptions(attributes, conditions, raw);
    return await Chunk.findAll(options);
  }
  async get(attributes, conditions, raw = false) {
    const options = this.getFindOptions(attributes, conditions, raw);
    return await Chunk.findOne(options);
  }
  async bulkAdd(chunks, tagString) {
    const transaction = await Chunk.sequelize?.transaction();
    try {
      const createdChunks = await Chunk.bulkCreate(chunks, {
        returning: true,
        transaction
      });
      const chunkTags = createdChunks.map((chunk) => ({
        chunkId: chunk.id,
        tagString
      }));
      await ChunkTag.bulkCreate(chunkTags, {
        transaction,
        ignoreDuplicates: true
        // Optional: prevents duplicate tag errors
      });
      await transaction?.commit();
    } catch (error) {
      await transaction?.rollback();
      throw new Error("Error inserting chunks with tags", { cause: error });
    }
  }
  /**
   * Replacement for "bulkAdd"
   * bulkAdd - Ensures that either all rows are inserted or none.
   * If any insert fails, the transaction rolls back completely and no partial data is saved.
   * addChunksWithTags - Supports partial inserts If inserting a chunk or its tags fails, the rest will still be attempted.
   *
   * @param chunks
   * @param tagString
   */
  async addChunksWithTags(chunks, tagString) {
    for (const chunk of chunks) {
      try {
        const createdChunk = await Chunk.create(chunk);
        try {
          await ChunkTag.create({ chunkId: createdChunk.id, tagString });
        } catch (tagError) {
        }
      } catch (chunkError) {
      }
    }
  }
  async addChunkTags(pathAndCacheKey, tagString) {
    const chunks = await this.getAll([], pathAndCacheKey);
    if (chunks.length === 0) {
      return;
    }
    const chunkTags = chunks.map((chunk) => ({ chunkId: chunk.id, tagString }));
    await ChunkTag.bulkCreate(chunkTags);
  }
  async deleteChunkTag(conditions) {
    await ChunkTag.destroy({ where: conditions });
  }
  async deleteChunk(conditions) {
    await Chunk.destroy({ where: conditions });
  }
  async deleteChunkTags(pathAndCacheKey, tagString) {
    const chunkIds = await this.getAll(["id"], pathAndCacheKey, true).then((chunks) => chunks.map((chunk) => chunk.id));
    if (chunkIds.length > 0) {
      await this.deleteChunkTag({ tagString, chunkId: { [sequelize.Op.in]: chunkIds } });
    }
  }
  async delete(cacheKey) {
    const chunksToDelete = await this.getAll(["id"], { cacheKey }, true);
    for (const chunkToDelete of chunksToDelete) {
      const chunkId = chunkToDelete.id;
      await this.deleteChunkTag({ chunkId });
      await this.deleteChunk({ id: chunkId });
    }
  }
  async getAllByChunkIds(ids) {
    return await Chunk.findAll({ where: { id: { [sequelize.Op.in]: ids } } });
  }
};

// src/service/ChunkService.ts
var ChunkService = class extends AbstractCodebaseService {
  chunkRepo;
  maxChunkSize;
  constructor(maxChunkSize) {
    super();
    this.chunkRepo = new ChunkRepository();
    this.maxChunkSize = maxChunkSize;
  }
  async *sync(syncContext) {
    yield* this.processChunkTags("addTag" /* AddTag */, syncContext);
    yield* this.processChunkTags("removeTag" /* RemoveTag */, syncContext);
    yield* this.processChunkTags("del" /* Delete */, syncContext);
  }
  async computeAndAddChunks(tags, tagString, markComplete) {
    const chunker = new Chunker__default.default();
    const chunks = await chunker.generateChunks(tags, contextUtils.getPathSep(), this.maxChunkSize);
    await this.chunkRepo.addChunksWithTags(chunks.chunkList, tagString);
    await markComplete(tags, "compute" /* Compute */);
  }
  async *processChunkTags(indexType, syncContext) {
    let { refreshIndex, tagString, markComplete, accumulatedProgress } = syncContext;
    const tags = refreshIndex[indexType];
    if (!tags.length) {
      return;
    }
    for (const tag of tags) {
      const pathAndCacheKey = { path: tag.path, cacheKey: tag.cacheKey };
      try {
        switch (indexType) {
          case "addTag" /* AddTag */:
            await this.chunkRepo.addChunkTags(pathAndCacheKey, tagString);
            break;
          case "removeTag" /* RemoveTag */:
            await this.chunkRepo.deleteChunkTags(pathAndCacheKey, tagString);
            break;
          case "del" /* Delete */:
            await this.chunkRepo.delete(tag.cacheKey);
            break;
          default:
            throw new Error(`Unsupported index type: ${indexType}`);
        }
        await markComplete([tag], indexType);
        accumulatedProgress += 1 / tags.length / 4;
        yield {
          progress: accumulatedProgress,
          status: "indexing",
          desc: `${indexType} ${contextUtils.getBasePath(tag.path)}`
        };
      } catch (error) {
        console.error(`Failed to process tag: ${tag.path} for index type: ${indexType}`);
      }
    }
  }
};

// src/indexer/core/ChunkCodeIndex.ts
var ChunkCodeIndex = class _ChunkCodeIndex {
  constructor(maxChunkSize) {
    this.maxChunkSize = maxChunkSize;
    this.chunkService = new ChunkService(this.maxChunkSize);
  }
  chunkService;
  static artifactId = "chunks";
  async identifyChanges(tag, currentFiles, identifier, refresh) {
    return await this.chunkService.identifyChanges(tag, currentFiles, identifier, refresh);
  }
  getArtifactId() {
    return _ChunkCodeIndex.artifactId;
  }
  async *update(tag, refreshIndex, _, markComplete) {
    let accumulatedProgress = 0;
    const tagString = this.chunkService.tagToString(tag);
    try {
      if (refreshIndex.compute.length > 0) {
        yield {
          desc: `Chunking files`,
          status: "indexing",
          progress: accumulatedProgress
        };
        await this.chunkService.computeAndAddChunks(refreshIndex.compute, tagString, markComplete);
      }
      for await (const progress of this.chunkService.sync({
        refreshIndex,
        tagString,
        markComplete,
        accumulatedProgress
      })) {
        yield {
          desc: progress.desc,
          progress: progress.progress,
          status: "indexing"
        };
      }
    } catch (error) {
    }
  }
};
var Fts = class extends sequelizeTypescript.Model {
};
__publicField(Fts, "skipSync", true);
__decorateClass([
  sequelizeTypescript.Column({ type: sequelizeTypescript.DataType.STRING })
], Fts.prototype, "path", 2);
__decorateClass([
  sequelizeTypescript.Column({ type: sequelizeTypescript.DataType.STRING })
], Fts.prototype, "content", 2);
__decorateClass([
  sequelizeTypescript.Column({ type: sequelizeTypescript.DataType.STRING })
], Fts.prototype, "cacheKey", 2);
Fts = __decorateClass([
  sequelizeTypescript.Table({ tableName: "Fts" })
], Fts);
var FtsMetadata = class extends sequelizeTypescript.Model {
};
__decorateClass([
  sequelizeTypescript.Column({ type: sequelizeTypescript.DataType.STRING })
], FtsMetadata.prototype, "cacheKey", 2);
__decorateClass([
  sequelizeTypescript.Column({ type: sequelizeTypescript.DataType.STRING })
], FtsMetadata.prototype, "path", 2);
__decorateClass([
  sequelizeTypescript.ForeignKey(() => Chunk),
  sequelizeTypescript.Column({ type: sequelizeTypescript.DataType.INTEGER })
], FtsMetadata.prototype, "chunkId", 2);
FtsMetadata = __decorateClass([
  sequelizeTypescript.Table({ tableName: "FtsMetadata" })
], FtsMetadata);

// src/repository/orm/FullTextSearchRepository.ts
var PATH_WEIGHT_MULTIPLIER = 10;
var FullTextSearchRepository = class extends BaseRepository {
  async insertFts(fts) {
    const ftsEntry = await Fts.create(fts);
    return ftsEntry.id;
  }
  async upsertFtsMetadata(ftsMeta) {
    await FtsMetadata.upsert(ftsMeta);
  }
  async deleteFts(conditions) {
    await Fts.destroy({ where: conditions });
  }
  async deleteFtsMetadata(conditions) {
    await FtsMetadata.destroy({ where: conditions });
  }
  buildRetrieveQuery(tagStrings) {
    return `
      SELECT FtsMetadata.chunkId, FtsMetadata.path, Fts.content, rank
      FROM Fts
      JOIN FtsMetadata ON Fts.rowid = FtsMetadata.id
      JOIN ChunkTag ON FtsMetadata.chunkId = ChunkTag.chunkId
      WHERE fts MATCH ?
      AND ChunkTag.tagString IN (${tagStrings.map(() => "?").join(",")})
      ORDER BY bm25(fts, ${PATH_WEIGHT_MULTIPLIER})
      LIMIT ?
    `;
  }
  async retrieve(text, tagStrings, threshold) {
    const query = this.buildRetrieveQuery(tagStrings);
    const parameters = [text.replace(/\?/g, ""), ...tagStrings, Math.ceil(threshold)];
    const results = await Fts.sequelize?.query(query, {
      replacements: parameters,
      type: sequelize.QueryTypes.SELECT
    }) || [];
    return results;
  }
};

// src/service/FullTextSearchService.ts
var RANK_CUTOFF = 15;
var FullTextSearchService = class extends AbstractCodebaseService {
  ftsRepo;
  chunkRepo;
  constructor() {
    super();
    this.ftsRepo = new FullTextSearchRepository();
    this.chunkRepo = new ChunkRepository();
  }
  async *processIndexing(refreshIndex, markComplete) {
    yield* this.add(refreshIndex.compute, markComplete);
    await this.addTag(refreshIndex.addTag, markComplete);
    await this.removeTag(refreshIndex.removeTag, markComplete);
    await this.delete(refreshIndex.del, markComplete);
  }
  async *add(computeTags, markComplete) {
    for (let i = 0; i < computeTags.length; i++) {
      const item = computeTags[i];
      try {
        const chunks = await this.chunkRepo.getAll([], { path: item.path, cacheKey: item.cacheKey }, true);
        await Promise.all(
          chunks.map(async (chunk) => {
            const id = await this.ftsRepo.insertFts({
              path: item.path,
              cacheKey: item.cacheKey,
              content: chunk.content
            });
            await this.ftsRepo.upsertFtsMetadata({
              id,
              path: item.path,
              cacheKey: item.cacheKey,
              chunkId: chunk.id
            });
          })
        );
        yield {
          progress: i / computeTags.length,
          desc: `Indexing ${contextUtils.getBasePath(item.path)}`,
          status: "indexing"
        };
        await markComplete([item], "compute" /* Compute */);
      } catch (error) {
      }
    }
  }
  async addTag(addTags, markComplete) {
    if (addTags.length > 0) {
      await markComplete(addTags, "addTag" /* AddTag */);
    }
  }
  async removeTag(removeTags, markComplete) {
    if (removeTags.length > 0) {
      await markComplete(removeTags, "removeTag" /* RemoveTag */);
    }
  }
  async delete(delTags, markComplete) {
    for (const item of delTags) {
      try {
        await Promise.all([
          this.ftsRepo.deleteFtsMetadata({ path: item.path, cacheKey: item.cacheKey }),
          this.ftsRepo.deleteFts({ path: item.path, cacheKey: item.cacheKey })
        ]);
        await markComplete([item], "del" /* Delete */);
      } catch (error) {
      }
    }
  }
  async get(text, tags, threshold) {
    const ftsResult = await this.ftsRepo.retrieve(text, this.convertTags(tags), threshold);
    const filteredResult = ftsResult.filter((result) => result.rank <= -2.5);
    if (filteredResult.length === 0) {
      return [];
    }
    const thresholdRank = filteredResult[0].rank + RANK_CUTOFF;
    const chunkIds = filteredResult.map((result) => thresholdRank > result.rank && result.chunkId);
    return await this.chunkRepo.getAllByChunkIds(chunkIds);
  }
  convertTags(tags) {
    return tags.map((tag) => this.tagToString({ ...tag, artifactId: ChunkCodeIndex.artifactId }));
  }
};

// src/lib/database/AbstractDatabase.ts
var AbstractDatabase = class {
  db;
  static modelLocaton = "";
  get() {
    return this.db;
  }
  logSuccess() {
  }
  logFailure(e) {
    console.error(`${this.constructor.name} connection Failed: ${e}`);
  }
};

// src/lib/database/Lance.ts
var Lance = class extends AbstractDatabase {
  async connect(dbPath = contextUtils.getLanceDbPath()) {
    try {
      return await lancedb__namespace.connect(dbPath);
    } catch (e) {
      this.logFailure(e);
    }
  }
};

// src/model/lanceDb/Lance.ts
var Lance2 = class {
  client;
  tableName = "";
  constructor(tableName = null) {
    this.connect();
    if (tableName) {
      this.tableName = tableName;
    }
  }
  connect() {
    if (!this.client) {
      this.client = new Lance().connect();
    }
  }
  async createTable(data = {}) {
    return await (await this.client).createTable(this.tableName, data);
  }
  async listTables() {
    return await (await this.client).tableNames();
  }
  async getTable() {
    return await (await this.client).openTable(this.tableName);
  }
  async add(data) {
    try {
      const table = await this.getTable();
      await table.add(data);
    } catch (err) {
      console.log("err while adding lance data", err);
    }
  }
  async delete(filter) {
    const table = await this.getTable();
    await table.delete(filter);
  }
  async search(input, limit) {
    const table = await this.getTable();
    return await table.search(input).limit(limit).toArray();
  }
};

// src/model/lanceDb/Tag.ts
var Tag2 = class extends Lance2 {
  constructor(tableName) {
    super(tableName);
  }
  setTagName(name) {
    this.tableName = name;
  }
  async isTagExist(tagTblName) {
    const existingTables = await this.listTables();
    return existingTables.includes(tagTblName);
  }
};
var LanceCache = class extends sequelizeTypescript.Model {
};
__decorateClass([
  sequelizeTypescript.Column({ type: sequelizeTypescript.DataType.STRING })
], LanceCache.prototype, "uuid", 2);
__decorateClass([
  sequelizeTypescript.Column({ type: sequelizeTypescript.DataType.STRING })
], LanceCache.prototype, "cacheKey", 2);
__decorateClass([
  sequelizeTypescript.Column({ type: sequelizeTypescript.DataType.STRING })
], LanceCache.prototype, "path", 2);
__decorateClass([
  sequelizeTypescript.Column({ type: sequelizeTypescript.DataType.STRING })
], LanceCache.prototype, "artifactId", 2);
__decorateClass([
  sequelizeTypescript.Column({ type: sequelizeTypescript.DataType.STRING })
], LanceCache.prototype, "vector", 2);
__decorateClass([
  sequelizeTypescript.Column({ type: sequelizeTypescript.DataType.INTEGER })
], LanceCache.prototype, "startLine", 2);
__decorateClass([
  sequelizeTypescript.Column({ type: sequelizeTypescript.DataType.INTEGER })
], LanceCache.prototype, "endLine", 2);
__decorateClass([
  sequelizeTypescript.Column({ type: sequelizeTypescript.DataType.STRING })
], LanceCache.prototype, "contents", 2);
LanceCache = __decorateClass([
  sequelizeTypescript.Table({ tableName: "LanceCache" })
], LanceCache);

// src/repository/orm/LanceCacheRepository.ts
var LanceCacheRepository = class extends BaseRepository {
  async getAll(attributes, conditions, raw = false) {
    const options = this.getFindOptions(attributes, conditions, raw);
    return await LanceCache.findAll(options);
  }
  async getAllByUuid(uuids) {
    return await LanceCache.findAll({ where: { uuid: { [sequelize.Op.in]: uuids } } });
  }
  async delete(conditions) {
    await LanceCache.destroy({ where: conditions });
  }
  async add(rows) {
    try {
      for (const row of rows) {
        await LanceCache.create(
          {
            uuid: row.uuid,
            cacheKey: row.cachekey,
            path: row.path,
            artifactId: row.artifactId,
            vector: JSON.stringify(row.vector),
            startLine: row.startLine,
            endLine: row.endLine,
            contents: row.contents
          }
          // { transaction },
        );
      }
    } catch (error) {
    }
  }
};

// src/service/VectorService.ts
var DISTANCE_CUTOFF = 1;
var VectorService = class extends AbstractCodebaseService {
  embeddingProvider;
  lanceCacheRepo;
  tag;
  artifactId;
  maxChunkSize;
  tagBatchSize = 2;
  computeBatchSize = 10;
  constructor(embeddingProvider, artifactId, maxChunkSize = 500) {
    super();
    this.embeddingProvider = embeddingProvider;
    this.artifactId = artifactId;
    this.maxChunkSize = maxChunkSize;
    this.lanceCacheRepo = new LanceCacheRepository();
    this.tag = new Tag2();
  }
  tableNameForTag(tag) {
    return this.tagToString(tag).replace(/[^\w-_.]/g, "");
  }
  async collectChunks(items) {
    const chunker = new Chunker__default.default();
    return chunker.generateChunks(items, contextUtils.getPathSep(), this.maxChunkSize);
  }
  async getEmbeddings(chunks) {
    try {
      return await this.embeddingProvider.embed(chunks.map((c) => c.content));
    } catch (err) {
      return [];
    }
  }
  async filterChunks(allChunks) {
    const filteredChunks = [];
    for (const chunk of allChunks) {
      const conditions = {
        contents: chunk.content,
        startLine: String(chunk.startLine),
        endLine: String(chunk.endLine)
      };
      try {
        const lanceCache = await this.lanceCacheRepo.getAll([], conditions, true);
        if (lanceCache.length === 0) {
          filteredChunks.push(chunk);
        }
      } catch (err) {
      }
    }
    return filteredChunks;
  }
  async computeRows(items, state) {
    const chunkMap = (await this.collectChunks(items)).chunkMap;
    const allChunks = await this.filterChunks(Array.from(chunkMap.values()).flatMap(({ chunks }) => chunks));
    for (let i = 0; i < allChunks.length; i += this.computeBatchSize) {
      const batchChunks = allChunks.slice(i, i + this.computeBatchSize);
      try {
        const embeddings = await this.getEmbeddings(batchChunks);
        for (let j = embeddings.length - 1; j >= 0; j--) {
          if (embeddings[j] === void 0) {
            const chunk = batchChunks[j];
            const chunks = chunkMap.get(chunk.path)?.chunks;
            if (chunks) {
              const index = chunks.findIndex((c) => c === chunk);
              if (index !== -1) {
                chunks.splice(index, 1);
              }
            }
            embeddings.splice(j, 1);
          }
        }
        const computedRows = this.formatRows(batchChunks, embeddings);
        await this.lanceCacheRepo.add(computedRows);
        if (computedRows.length > 0) {
          state.shouldSkipTableCreation ? await this.tag.add(computedRows) : await this.tag.createTable(computedRows);
          state.shouldSkipTableCreation = true;
        }
      } catch (err) {
      }
    }
  }
  formatRows(chunks, embeddings) {
    const rows = [];
    let embeddingIndex = 0;
    for (const chunk of chunks) {
      rows.push({
        path: chunk.path,
        cachekey: chunk.cacheKey,
        uuid: uuid.v4(),
        vector: embeddings[embeddingIndex],
        startLine: chunk.startLine,
        endLine: chunk.endLine,
        contents: chunk.content,
        artifactId: this.artifactId
      });
      embeddingIndex++;
    }
    return rows;
  }
  async *processIndexing(tag, refreshIndex, markComplete) {
    const tableName = this.tableNameForTag(tag);
    let state = { shouldSkipTableCreation: await this.tag.isTagExist(tableName) };
    let accumulatedProgress = 0;
    this.tag.setTagName(tableName);
    await this.computeAndAddRows(refreshIndex.compute, state, markComplete);
    yield* this.addTag(refreshIndex.addTag, state, markComplete, accumulatedProgress);
    yield* this.removeTag(refreshIndex, markComplete, accumulatedProgress);
  }
  async cleanupMemory() {
    if (global.gc) {
      global.gc();
    }
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  async computeAndAddRows(tags, state, markComplete) {
    for (let i = 0; i < tags.length; i += this.tagBatchSize) {
      const tagBatch = tags.slice(i, i + this.tagBatchSize);
      await this.computeRows(tagBatch, state);
      await markComplete(tagBatch, "compute" /* Compute */);
      await this.cleanupMemory();
    }
  }
  async *addTag(addTag, state, markComplete, accumulatedProgress) {
    for (const tag of addTag) {
      const { path, cacheKey } = tag;
      const cachedItems = await this.lanceCacheRepo.getAll(
        [],
        {
          cacheKey,
          path,
          artifactId: this.artifactId
        },
        true
      );
      const lanceRows = cachedItems.map(({ uuid, vector, startLine, endLine, contents }) => ({
        path,
        uuid,
        startLine,
        endLine,
        contents,
        cachekey: cacheKey,
        vector: JSON.parse(vector),
        artifactId: this.artifactId
      }));
      if (lanceRows.length > 0) {
        if (!state.shouldSkipTableCreation) {
          await this.tag.createTable(lanceRows);
          state.shouldSkipTableCreation = true;
        } else {
          await this.tag.add(lanceRows);
        }
      }
      await markComplete([tag], "addTag" /* AddTag */);
      accumulatedProgress += 1 / addTag.length / 3;
      yield {
        progress: accumulatedProgress,
        desc: `Indexing ${contextUtils.getBasePath(path)}`,
        status: "indexing"
      };
    }
  }
  async *removeTag(refreshIndex, markComplete, accumulatedProgress) {
    const toDel = [...refreshIndex.removeTag, ...refreshIndex.del];
    for (const { path, cacheKey } of toDel) {
      await this.tag.delete(`cachekey = '${cacheKey}' AND path = '${path}'`);
      accumulatedProgress += 1 / toDel.length / 3;
      yield {
        progress: accumulatedProgress,
        desc: `Stashing ${contextUtils.getBasePath(path)}`,
        status: "indexing"
      };
    }
    await markComplete(refreshIndex.removeTag, "removeTag" /* RemoveTag */);
    for (const { path, cacheKey } of refreshIndex.del) {
      await this.lanceCacheRepo.delete({ cacheKey, path, artifactId: this.artifactId });
      accumulatedProgress += 1 / refreshIndex.del.length / 3;
      yield {
        progress: accumulatedProgress,
        desc: `Removing ${contextUtils.getBasePath(path)}`,
        status: "indexing"
      };
    }
    await markComplete(refreshIndex.del, "del" /* Delete */);
  }
  async get(input, tags, threshold) {
    const [vector] = await this.embeddingProvider.embed([input]);
    let allResults = [];
    for (const tag of tags) {
      const results = await this.getByTag({ ...tag, artifactId: this.artifactId }, threshold, vector);
      allResults.push(...results);
    }
    if (allResults.length === 0) {
      return [];
    }
    allResults = allResults.sort((a, b) => a._distance - b._distance);
    allResults = allResults.map(
      (result) => allResults[0]?._distance + DISTANCE_CUTOFF > result._distance && result
    );
    return await this.getMatchedRows(allResults);
  }
  async getMatchedRows(vectors) {
    const uuids = vectors.map((r) => r.uuid);
    const data = await this.lanceCacheRepo.getAllByUuid(uuids);
    return data.map((d) => {
      return {
        id: d.id,
        cacheKey: d.cacheKey,
        path: d.path,
        startLine: d.startLine,
        endLine: d.endLine,
        index: 0,
        content: d.contents
      };
    });
  }
  async getByTag(tag, limit, vector) {
    const tableName = this.tableNameForTag(tag);
    if (!await this.tag.isTagExist(tableName)) {
      return [];
    }
    this.tag.setTagName(tableName);
    return await this.tag.search(vector, limit);
  }
};

// src/context/retriever/BaseRetriever.ts
var BaseRetriever = class {
  constructor(options) {
    this.options = options;
    this.vectorService = new VectorService(
      options.embeddingProvider,
      `vectordb:${options.embeddingProvider.getProviderName()}`
    );
    this.ftsService = new FullTextSearchService();
    this.chunker = new Chunker__default.default();
  }
  ftsService;
  vectorService;
  chunker;
  async retrieveFts(input, tags, threshold) {
    try {
      if (input.trim() === "") {
        return [];
      }
      const tokens = contextUtils.getCleanedTrigrams(input).join(" OR ");
      return await this.ftsService.get(tokens, tags, threshold);
    } catch (e) {
      return [];
    }
  }
  async chunkRecentlyEditedFiles(files, threshold) {
    const recentlyEditedFilesSlice = files.slice(0, threshold);
    const chunks = [];
    let i = 0;
    for (const filepath of recentlyEditedFilesSlice) {
      const contents = await contextUtils.read(filepath);
      const fileChunks = this.chunker.streamChunk({
        path: filepath,
        contents,
        maxChunkSize: this.options.embeddingProvider.maxChunkSize,
        cacheKey: filepath
      });
      for await (const chunk of fileChunks) {
        chunks.push({ id: `rc-${++i}`, ...chunk });
      }
    }
    return chunks.slice(0, threshold);
  }
  async retrieveEmbeddings(input, tags, threshold) {
    try {
      return this.vectorService.get(input, tags, threshold);
    } catch (e) {
      return [];
    }
  }
  deduplicateChunks(chunks) {
    return contextUtils.deduplicateArray(chunks, (a, b) => {
      return a.path === b.path && a.startLine === b.startLine && a.endLine === b.endLine;
    });
  }
  async filter(input, chunks) {
    try {
      const data = await this.options.llm.chat({ code_chunks: chunks, question: input });
      return JSON.parse(data);
    } catch (err) {
      return chunks.map((chunk) => chunk.id);
    }
  }
  removeStopWords(input) {
    return contextUtils.extractKeywords(input);
  }
};

// src/context/retriever/NoRerankRetriever.ts
var NoRerankRetriever = class extends BaseRetriever {
  async retrieve(args) {
    const { thresholdFinal } = this.options;
    const recentlyEditedThreshold = thresholdFinal * 0.25;
    const ftsThreshold = 50;
    const embeddingsThreshold = 50;
    let chunks = [];
    const { input, tags, recentlyEditedFiles } = args;
    const ftsChunks = await this.retrieveFts(input, tags, ftsThreshold);
    const embeddingsChunks = contextUtils.hasRequiredCpuFeaturesForLanceDb() ? await this.retrieveEmbeddings(input, tags, embeddingsThreshold) : [];
    const recentlyEditedFilesChunks = await this.chunkRecentlyEditedFiles(recentlyEditedFiles, recentlyEditedThreshold);
    chunks.push(...recentlyEditedFilesChunks, ...ftsChunks, ...embeddingsChunks);
    chunks = this.deduplicateChunks(chunks);
    const filteredChunksIds = await this.filter(input, chunks);
    return chunks.filter((item) => filteredChunksIds.includes(String(item.id)) || filteredChunksIds.includes(item.id));
  }
};

// src/context/retriever/reranker/RerankRetriever.ts
var RerankRetriever = class extends BaseRetriever {
  async retrieve(args) {
    throw new Error("Method not implemented.");
  }
};

// src/context/Retriever.ts
var DEFAULT_THRESHOLD = 25;
var IS_KEYWORD_RETRIEVAL_ENABLED = true;
async function* retrieve(options) {
  const { llm, embeddingName, reRank } = options;
  const thresholdFinal = options?.thresholdFinal ?? DEFAULT_THRESHOLD;
  const isKeywordRetrievalEnabled = options?.isKeywordRetrievalEnabled ?? IS_KEYWORD_RETRIEVAL_ENABLED;
  const retrieverClass = !!reRank ? RerankRetriever : NoRerankRetriever;
  const retriever = new retrieverClass({
    thresholdFinal,
    embeddingProvider: EmbeddingFactory__default.default.create(embeddingName),
    llm: LlmFactory.create(llm.name, llm.options)
  });
  yield {
    desc: "retrieveing",
    action: "retrieve",
    status: "in-progress"
  };
  if (isKeywordRetrievalEnabled) {
    const keywords = retriever.removeStopWords(options.input);
    yield {
      desc: "retrieveing relavent keywords",
      action: "keywork-lookup",
      status: "done",
      data: keywords
    };
  }
  yield {
    desc: "retrieveing relavant files",
    action: "retrieve-files",
    status: "in-progress"
  };
  const retrievedResult = await retriever.retrieve({
    input: options.input,
    tags: options.tags,
    recentlyEditedFiles: options.recentlyEditedFiles
  });
  yield {
    desc: "retrieveing relavant files completed",
    action: "retrieve",
    status: "complete",
    data: retrievedResult
  };
}
var VectorIndex = class {
  constructor(maxChunkSize) {
    this.maxChunkSize = maxChunkSize;
    this.vectorService = new VectorService(config2__default.default.getConfig().embeddingProvider, this.artifactId, this.maxChunkSize);
  }
  artifactId = `vectordb:${config2__default.default.getConfig().embeddingProvider.getProviderName()}`;
  vectorService;
  getArtifactId() {
    return this.artifactId;
  }
  async *update(tag, subResult, _, markComplete) {
    const indexingProcess = this.vectorService.processIndexing(tag, subResult, markComplete);
    try {
      for await (const progress of indexingProcess) {
        yield progress;
      }
    } catch (error) {
    }
  }
  async identifyChanges(tag, currentFiles, identifier, refresh) {
    return await this.vectorService.identifyChanges(tag, currentFiles, identifier, refresh);
  }
};

// src/indexer/core/FullTextSearchIndex.ts
var FullTextSearchIndex = class {
  ftservice;
  artifactId = "sqliteFts";
  constructor() {
    this.ftservice = new FullTextSearchService();
  }
  getArtifactId() {
    return this.artifactId;
  }
  async *update(_, subResult, identifier, markComplete) {
    const indexingProcess = this.ftservice.processIndexing(subResult, markComplete);
    try {
      for await (const progress of indexingProcess) {
        yield progress;
      }
    } catch (error) {
    }
  }
  async identifyChanges(tag, currentFiles, identifier, refresh) {
    return await this.ftservice.identifyChanges(tag, currentFiles, identifier, refresh);
  }
};
var CodeSnippet = class extends sequelizeTypescript.Model {
};
__decorateClass([
  sequelizeTypescript.Column({ type: sequelizeTypescript.DataType.TEXT, allowNull: false })
], CodeSnippet.prototype, "path", 2);
__decorateClass([
  sequelizeTypescript.Column({ type: sequelizeTypescript.DataType.TEXT, allowNull: false })
], CodeSnippet.prototype, "cacheKey", 2);
__decorateClass([
  sequelizeTypescript.Column({ type: sequelizeTypescript.DataType.TEXT, allowNull: false })
], CodeSnippet.prototype, "content", 2);
__decorateClass([
  sequelizeTypescript.Column({ type: sequelizeTypescript.DataType.TEXT, allowNull: false })
], CodeSnippet.prototype, "title", 2);
__decorateClass([
  sequelizeTypescript.Column({ type: sequelizeTypescript.DataType.TEXT, allowNull: true })
], CodeSnippet.prototype, "signature", 2);
__decorateClass([
  sequelizeTypescript.Column({ type: sequelizeTypescript.DataType.INTEGER, allowNull: false })
], CodeSnippet.prototype, "startLine", 2);
__decorateClass([
  sequelizeTypescript.Column({ type: sequelizeTypescript.DataType.INTEGER, allowNull: false })
], CodeSnippet.prototype, "endLine", 2);
CodeSnippet = __decorateClass([
  sequelizeTypescript.Table({ tableName: "CodeSnippet" })
], CodeSnippet);

// src/model/orm/CodeSnippetTag.ts
var CodeSnippetTag = class extends sequelizeTypescript.Model {
};
__decorateClass([
  sequelizeTypescript.Column({ type: sequelizeTypescript.DataType.TEXT, allowNull: false })
], CodeSnippetTag.prototype, "tag", 2);
__decorateClass([
  sequelizeTypescript.ForeignKey(() => CodeSnippet),
  sequelizeTypescript.Column({ type: sequelizeTypescript.DataType.INTEGER, allowNull: false })
], CodeSnippetTag.prototype, "snippetId", 2);
CodeSnippetTag = __decorateClass([
  sequelizeTypescript.Table({ tableName: "CodeSnippetTag" })
], CodeSnippetTag);

// src/repository/orm/CodeSnippetRepository.ts
var CodeSnippetRepository = class extends BaseRepository {
  async getAll(attributes, conditions, raw = false, transaction = null) {
    const options = this.getFindOptions(attributes, conditions, raw);
    return await CodeSnippet.findAll({ ...options, transaction });
  }
  async add(snippet, options = {}) {
    return await CodeSnippet.create(snippet, options);
  }
  async addSnippetTag(snippetTag, options = {}) {
    await CodeSnippetTag.create(snippetTag, options);
  }
  async addSnippetAndTag(snippets, pathAndCacheKey, tag) {
    const transaction = await CodeSnippet.sequelize?.transaction();
    try {
      for (const snippet of snippets) {
        const createdSnippet = await this.add({ ...snippet, ...pathAndCacheKey }, { transaction });
        await this.addSnippetTag({ snippetId: createdSnippet.id, tag }, { transaction });
      }
      await transaction?.commit();
    } catch (error) {
      await transaction?.rollback();
      throw error;
    }
  }
  async deleteSnippetsandTags(pathAndCacheKey) {
    const transaction = await CodeSnippet.sequelize?.transaction();
    try {
      const snippetsToDel = await this.getIds(pathAndCacheKey, transaction);
      await this.deleteSnippetTag({ snippetId: { [sequelize.Op.in]: snippetsToDel } }, transaction);
      await this.deleteSnippet({ id: { [sequelize.Op.in]: snippetsToDel } }, transaction);
      await transaction?.commit();
    } catch (error) {
      await transaction?.rollback();
      throw error;
    }
  }
  async deleteSnippets(pathAndCacheKey) {
    const snippetsToDel = await this.getIds(pathAndCacheKey);
    await this.deleteSnippet({ snippetId: { [sequelize.Op.in]: snippetsToDel } });
  }
  async deleteSnippetTag(conditions, transaction = null) {
    await CodeSnippetTag.destroy({ where: conditions, transaction });
  }
  async deleteSnippet(conditions, transaction = null) {
    await CodeSnippet.destroy({ where: conditions, transaction });
  }
  async getIds(pathAndCacheKey, transaction = null) {
    return await this.getAll(["id"], pathAndCacheKey, true, transaction).then(
      (snippets) => snippets.map((snippet) => snippet.id)
    );
  }
  async getByPathPattern(conditions, bindValues, limit, offset) {
    try {
      return await CodeSnippet.findAll({
        where: sequelize.Sequelize.literal(conditions),
        replacements: bindValues,
        limit,
        offset,
        order: [
          ["path", "ASC"],
          ["signature", "ASC"]
        ]
      });
    } catch (error) {
      throw new Error("Error fetching snippets: " + error);
    }
  }
};

// src/service/CodeSnippetService.ts
var MAX_LIKE_PATTERN_LENGTH = 5e4;
var CodeSnippetService = class extends AbstractCodebaseService {
  snippetRepo;
  constructor() {
    super();
    this.snippetRepo = new CodeSnippetRepository();
  }
  async *sync(syncContext) {
    yield* this.processSnippetTags("compute" /* Compute */, syncContext);
    yield* this.processSnippetTags("addTag" /* AddTag */, syncContext);
    yield* this.processSnippetTags("removeTag" /* RemoveTag */, syncContext);
    yield* this.processSnippetTags("del" /* Delete */, syncContext);
  }
  async *processSnippetTags(indexType, syncContext) {
    let { refreshIndex, tagString, markComplete, accumulatedProgress } = syncContext;
    const tags = refreshIndex[indexType];
    if (!tags.length) {
      return;
    }
    for (const tag of tags) {
      const pathAndCacheKey = { path: tag.path, cacheKey: tag.cacheKey };
      try {
        switch (indexType) {
          case "addTag" /* AddTag */:
          case "compute" /* Compute */:
            await this.computeAndAddTag(tag, tagString);
            break;
          case "removeTag" /* RemoveTag */:
            await this.snippetRepo.deleteSnippets(pathAndCacheKey);
            break;
          case "del" /* Delete */:
            await this.snippetRepo.deleteSnippetsandTags(pathAndCacheKey);
            break;
          default:
            throw new Error(`Unsupported index type: ${indexType}`);
        }
        await markComplete([tag], indexType);
        accumulatedProgress += 1 / tags.length / 4;
        yield {
          progress: accumulatedProgress,
          status: "indexing",
          desc: `${indexType} ${contextUtils.getBasePath(tag.path)}`
        };
      } catch (error) {
        throw new Error(`Failed to process tag: ${tag.path} for index type: ${indexType}`);
      }
    }
  }
  async computeAndAddTag(tag, tagString) {
    try {
      const snippets = await this.getSnippetsInFile(tag.path);
      const pathAndCacheKey = { path: tag.path, cacheKey: tag.cacheKey };
      await this.snippetRepo.addSnippetAndTag(snippets, pathAndCacheKey, tagString);
    } catch (e) {
    }
  }
  async getSnippetsInFile(filepath) {
    const contents = await contextUtils.read(filepath);
    const fileParser = await Parser__default.default.buildParserForFile(filepath);
    if (!fileParser) {
      return [];
    }
    const ast = fileParser.parse(contents);
    const query = await Parser__default.default.loadQueryForFile(filepath);
    const matches = query?.matches(ast.rootNode);
    if (!matches) {
      return [];
    }
    return matches.map(this.getSnippetsFromMatch);
  }
  getSnippetsFromMatch(match) {
    const bodyTypesToTreatAsSignatures = [
      "interface_declaration",
      // TypeScript, Java
      "struct_item",
      // Rust
      "type_spec"
      // Go
    ];
    const bodyCaptureGroupPrefixes = ["definition", "reference"];
    let title = "", content = "", signature = "", startLine = 0, endLine = 0, hasSeenBody = false;
    for (const { name, node } of match.captures) {
      const trimmedCaptureName = name.split(".")[0];
      const nodeText = node.text;
      const nodeType = node.type;
      if (bodyCaptureGroupPrefixes.includes(trimmedCaptureName)) {
        if (bodyTypesToTreatAsSignatures.includes(nodeType)) {
          signature = nodeText;
          hasSeenBody = true;
        }
        content = nodeText;
        startLine = node.startPosition.row;
        endLine = node.endPosition.row;
      } else {
        if (trimmedCaptureName === "name") {
          title = nodeText;
        }
        if (!hasSeenBody) {
          signature += nodeText + " ";
          if (trimmedCaptureName === "comment") {
            signature += "\n";
          }
        }
      }
    }
    return { title, content, signature, startLine, endLine };
  }
  truncateToLastNBytes(input) {
    let bytes = 0;
    let startIndex = 0;
    for (let i = input.length - 1; i >= 0; i--) {
      bytes += new TextEncoder().encode(input[i]).length;
      if (bytes > MAX_LIKE_PATTERN_LENGTH) {
        startIndex = i + 1;
        break;
      }
    }
    return input.substring(startIndex, input.length);
  }
  async getPathsAndSignatures(workspaceDirs, offset, batchSize) {
    const likePatterns = workspaceDirs.map((dir) => this.truncateToLastNBytes(`${dir}%`));
    const placeholders = likePatterns.map(() => "path LIKE ?").join(" OR ");
    const rows = await this.snippetRepo.getByPathPattern(placeholders, likePatterns, batchSize, offset);
    const groupedByPath = {};
    for (const { path, signature } of rows) {
      if (!groupedByPath[path]) {
        groupedByPath[path] = [];
      }
      groupedByPath[path].push(signature);
    }
    const hasMore = rows.length === batchSize;
    return { groupedByPath, hasMore };
  }
};

// src/indexer/core/CodeSnippetIndex.ts
var CodeSnippetIndex = class {
  artifactId = "codeSnippets";
  codeSnippetService;
  constructor() {
    this.codeSnippetService = new CodeSnippetService();
  }
  async *update(tag, refreshIndex, _, markComplete) {
    const tagString = this.codeSnippetService.tagToString(tag);
    let accumulatedProgress = 0;
    try {
      for await (const progress of this.codeSnippetService.sync({
        refreshIndex,
        tagString,
        markComplete,
        accumulatedProgress
      })) {
        yield {
          desc: progress.desc,
          progress: progress.progress,
          status: "indexing"
        };
      }
    } catch (error) {
    }
  }
  getArtifactId() {
    return this.artifactId;
  }
  async identifyChanges(tag, currentFiles, identifier, refresh) {
    return await this.codeSnippetService.identifyChanges(tag, currentFiles, identifier, refresh);
  }
  async getPathsAndSignatures(workspaceDirs, offset = 0, batchSize = 100) {
    return await this.codeSnippetService.getPathsAndSignatures(workspaceDirs, offset, batchSize);
  }
};
async function yieldProcess(...arg) {
  const command = process.execPath;
  const args = ["--expose-gc", ...arg];
  const queue = new ChildProcess.AsyncQueue();
  const options = {
    collect: false,
    onStdout: async (text) => {
      queue.push(parseResponse(text));
    },
    onStderr: (err) => {
      console.error("[stderr]", err);
    },
    onExit: () => {
      queue.close();
    }
  };
  const childProcess = new ChildProcess__default.default(command, args, options);
  childProcess.run().catch((err) => {
    queue.close();
  });
  return queue;
}
var parseResponse = (text) => {
  const match = text.match(/data:\s*'([^']+)'/);
  if (match && contextUtils.isJson(match[1])) {
    return match[1];
  }
  return text;
};

// src/constant/Process.ts
var INDEXER_SCRIPT = ["index", "refresh"];
var STATUS = {
  done: "done",
  complete: "complete"
};

// src/indexer/CodebaseIndexer.ts
var INDEX_EXPIRATION_DAYS = 30;
var CodebaseIndexer = class _CodebaseIndexer {
  constructor(rules = "") {
    this.rules = rules;
    this.ignoreRules = rules;
    this.globalIndexer = new GlobalCacheCodeBaseIndex();
  }
  ignoreRules;
  globalIndexer;
  static instance;
  static getInstance(rules = "") {
    if (!_CodebaseIndexer.instance) {
      _CodebaseIndexer.instance = new _CodebaseIndexer(rules);
    }
    return _CodebaseIndexer.instance;
  }
  /**
   * We batch for two reasons:
   * - To limit memory usage for indexes that perform computations locally, e.g. FTS
   * - To make as few requests as possible to the embeddings providers
   */
  filesPerBatch = 50;
  // Note that we exclude certain Sqlite errors that we do not want to clear the indexes on,
  // e.g. a `SQLITE_BUSY` error.
  errorsRegexesToClearIndexesOn = [
    /Invalid argument error: Values length (d+) is less than the length ((d+)) multiplied by the value size (d+)/,
    /SQLITE_CONSTRAINT/,
    /SQLITE_ERROR/,
    /SQLITE_CORRUPT/,
    /SQLITE_IOERR/,
    /SQLITE_FULL/
  ];
  houseKeeping(days = INDEX_EXPIRATION_DAYS) {
    contextUtils.traverseAndClean(days, "index");
  }
  async getIndexesToBuild() {
    const maxChunkSize = config2__default.default.getConfig().embeddingProvider.maxChunkSize;
    const indexes = [
      new ChunkCodeIndex(maxChunkSize),
      // Chunking must come first
      ...contextUtils.hasRequiredCpuFeaturesForLanceDb() ? [new VectorIndex(maxChunkSize)] : [],
      // Use the vector index only
      // if the system has a supported CPU for LanceDB
      new FullTextSearchIndex(),
      new CodeSnippetIndex()
    ];
    return indexes;
  }
  async isIndexed(workspaceDir, branch) {
    return await this.globalIndexer.getLatestChunk(workspaceDir, branch);
  }
  /**
   * Enables the indexing operation to be completed in batches, this is important in large
   * repositories where indexing can quickly use up all the memory available
   */
  *batchRefreshIndex(results) {
    let curPos = 0;
    while (curPos < results.compute.length || curPos < results.del.length || curPos < results.addTag.length || curPos < results.removeTag.length) {
      yield {
        compute: results.compute.slice(curPos, curPos + this.filesPerBatch),
        del: results.del.slice(curPos, curPos + this.filesPerBatch),
        addTag: results.addTag.slice(curPos, curPos + this.filesPerBatch),
        removeTag: results.removeTag.slice(curPos, curPos + this.filesPerBatch)
      };
      curPos += this.filesPerBatch;
    }
  }
  async *runScript(scriptName, workspaceDir, workspace, branch) {
    const scriptPath = contextUtils.getScriptPath();
    const progress = await yieldProcess(
      scriptPath,
      scriptName,
      JSON.stringify([this.ignoreRules]),
      // Constructor Args
      JSON.stringify([workspaceDir, workspace, branch, uuid.v4()]),
      // Method Args
      JSON.stringify(config2__default.default.getAppConfig())
      // Config to initialize
    );
    for await (const update of progress) {
      yield update;
    }
  }
  async *refresh(workspaceDir, workspace, branch) {
    const appConfig = config2__default.default.getAppConfig();
    const funcToCall = appConfig?.multiThread ? this.runScript("refresh", workspaceDir, workspace, branch) : this.doRefresh(workspaceDir, workspace, branch, uuid.v4());
    yield* funcToCall;
  }
  async *index(workspaceDir, workspace, branch) {
    const appConfig = config2__default.default.getAppConfig();
    const funcToCall = appConfig?.multiThread ? this.runScript("index", workspaceDir, workspace, branch) : this.doIndex(workspaceDir, workspace, branch, uuid.v4());
    yield* funcToCall;
  }
  async *doRefresh(workspaceDir, workspace, branch, identifier) {
    for await (const progress of this.indexFiles(workspaceDir, workspace, branch, identifier, true)) {
      yield progress;
    }
  }
  async getFilesToIndex(workspaceDir, workspace, artifactId, identifier) {
    const isCacheDone = await this.globalIndexer.getCompleted(identifier, artifactId);
    if (isCacheDone.length > 0) {
      return [];
    }
    const files = contextUtils.collectAllFiles(workspace, workspaceDir, this.ignoreRules);
    const index = await this.globalIndexer.get(identifier, artifactId);
    const indexPaths = new Set(index.map((entry) => entry.path));
    return files.filter((filePath) => !indexPaths.has(filePath));
  }
  async *doIndex(workspaceDir, workspace, branch, identifier) {
    for await (const progress of this.indexFiles(workspaceDir, workspace, branch, identifier)) {
      yield progress;
    }
  }
  async *indexFiles(workspaceDir, workspace, branch, identifier, refresh = false) {
    const indexesToBuild = await this.getIndexesToBuild();
    let completedIndexCount = 0;
    for (const codebaseIndex of indexesToBuild) {
      const workspaceFiles = await this.getFilesToIndex(
        workspaceDir,
        workspace,
        codebaseIndex.getArtifactId(),
        identifier
      );
      if (workspaceFiles.length === 0) {
        continue;
      }
      const stats = await contextUtils.getLastModified(workspaceFiles);
      const tag = {
        dir: workspaceDir,
        branch,
        artifactId: codebaseIndex.getArtifactId()
      };
      ({
        desc: `Planning changes for ${codebaseIndex.getArtifactId()} index...`});
      const [refreshIndex, lastUpdated, markComplete] = await codebaseIndex.identifyChanges(
        tag,
        { ...stats },
        identifier,
        refresh
      );
      const totalOps = refreshIndex.compute.length + refreshIndex.del.length + refreshIndex.addTag.length + refreshIndex.removeTag.length;
      let completedOps = 0;
      if (totalOps > 0) {
        for (const subResult of this.batchRefreshIndex(refreshIndex)) {
          for await (const progress2 of codebaseIndex.update(tag, subResult, identifier, markComplete)) {
          }
          completedOps += subResult.compute.length + subResult.del.length + subResult.addTag.length + subResult.removeTag.length;
          (completedIndexCount + completedOps / totalOps) * (1 / indexesToBuild.length);
        }
      }
      await markComplete(lastUpdated, "updateLastUpdated" /* UpdateLastUpdated */);
      await markComplete([{ cacheKey: identifier, artifactId: codebaseIndex.getArtifactId() }], "updateStatus" /* StatusUpdate */);
      const indexTrackCnt = await this.globalIndexer.getCompletedCount(identifier);
      const indexDoneStatus = {
        progress: indexTrackCnt / indexesToBuild.length * 100,
        desc: `Done indexing ${codebaseIndex.getArtifactId()}...`,
        status: STATUS.done
      };
      yield { data: JSON.stringify(indexDoneStatus) };
      console.log(`Finished indexing ${codebaseIndex.getArtifactId()}...`);
      completedIndexCount += 1;
    }
    contextUtils.writeStats({ workspaceDir: contextUtils.getWorkspaceDir(), lastIndexedAt: Date.now(), version: "v1" });
    const indexCompleteStatus = {
      progress: 1,
      desc: "indexing completed",
      status: STATUS.complete
    };
    yield { data: JSON.stringify(indexCompleteStatus) };
  }
};

// src/model/orm/index.ts
var orm_default = [
  Chunk,
  ChunkTag,
  CodeSnippet,
  CodeSnippetTag,
  Fts,
  FtsMetadata,
  GlobalCache,
  LanceCache,
  Tag,
  CacheReport
];

// src/lib/database/Sqlite.ts
var Sqlite = class extends AbstractDatabase {
  models = [];
  async connect(dbPath = contextUtils.getIndexSqlitePath()) {
    try {
      this.models = orm_default;
      const options = {
        dialect: "sqlite",
        models: this.models,
        storage: dbPath,
        query: {
          raw: true
        },
        logging: false
      };
      this.db = new sequelizeTypescript.Sequelize(options);
      await this.setUp();
      this.logSuccess();
    } catch (e) {
      this.logFailure(e);
    }
  }
  async setUp() {
    await this.loadModels();
    const db2 = this.get();
    await db2?.query("PRAGMA compile_options;");
    await db2?.query(`CREATE VIRTUAL TABLE IF NOT EXISTS Fts USING fts5(
        id UNINDEXED,
        path,
        content,
        cacheKey,
        createdAt,
        updatedAt,
        tokenize = 'trigram'
    )`);
    await db2?.query("PRAGMA journal_mode = WAL;");
  }
  async loadModels() {
    await Promise.all(
      this.models.map(async (model) => {
        if (model.skipSync) {
          return;
        }
        await model.sync();
      })
    );
  }
};
async function runIndexer(method, useRetryCheck = false) {
  const constructorArgs = JSON.parse(process2__default.default.argv[3] || "[]");
  const methodArgs = JSON.parse(process2__default.default.argv[4] || "[]");
  const config4 = JSON.parse(process2__default.default.argv[5] || "[]");
  await init(config4);
  const indexer2 = CodebaseIndexer.getInstance(...constructorArgs);
  const shouldUseRefresh = method === "doRefresh" || useRetryCheck && process2__default.default.argv[5];
  const methodToCall = shouldUseRefresh ? "doRefresh" : "doIndex";
  for await (const progress of indexer2[methodToCall](...methodArgs)) {
    console.log(progress);
  }
}
var indexer = {
  async index() {
    await runIndexer("doIndex", true);
  },
  async refresh() {
    await runIndexer("doRefresh");
  }
};

// src/index.ts
var db = new Sqlite();
var init = async (appConfig = {}) => {
  config2__default.default.loadAppConfig(appConfig);
  await db.connect();
};
var script = process.argv[2];
(async () => {
  if (INDEXER_SCRIPT.includes(script)) {
    try {
      await indexer[script]();
    } catch (err) {
      console.log(`Failed to execute ${script}`, err);
    }
  }
})();

exports.CodeSnippetIndex = CodeSnippetIndex;
exports.CodebaseIndexer = CodebaseIndexer;
exports.init = init;
exports.retrieve = retrieve;
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map