'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

// src/BaseEmbeddingProvider.ts
var DEFAULT_MAX_CHUNK_SIZE = 500;
var BaseEmbeddingProvider = class {
  static maxBatchSize;
  static model;
  static defaultOptions;
  static providerName;
  options;
  constructor(options) {
    this.options = {
      ...this.constructor.defaultOptions,
      ...options
    };
  }
  get maxBatchSize() {
    return this.options.maxBatchSize ?? this.constructor.maxBatchSize;
  }
  get maxChunkSize() {
    return this.options.maxChunkSize ?? DEFAULT_MAX_CHUNK_SIZE;
  }
  getModel() {
    return this.options.model ?? this.constructor.model;
  }
  getBatchedChunks(chunks) {
    if (!this.maxBatchSize) {
      console.log(`${this.getBatchedChunks.name} should only be called if 'maxBatchSize' is defined`);
      return [chunks];
    }
    const batchedChunks = [];
    for (let i = 0; i < chunks.length; i += this.maxBatchSize) {
      batchedChunks.push(chunks.slice(i, i + this.maxBatchSize));
    }
    return batchedChunks;
  }
};

// src/TransformerEmbeddingProvider.ts
var TransformerEmbeddingProvider = class _TransformerEmbeddingProvider extends BaseEmbeddingProvider {
  static providerName = "transformers";
  static maxGroupSize = 4;
  static model = "Xenova/all-MiniLM-L6-v2";
  static mockVector = Array.from({ length: 384 }).fill(2);
  static task = "feature-extraction";
  static instance = null;
  static pipeline = null;
  static async initialize() {
    if (_TransformerEmbeddingProvider.pipeline === null) {
      const module = require('../../../../../transformers-pkg-compat.js');
      _TransformerEmbeddingProvider.pipeline = module.pipeline;
    }
  }
  async getInstance() {
    await _TransformerEmbeddingProvider.initialize();
    if (_TransformerEmbeddingProvider.instance === null) {
      _TransformerEmbeddingProvider.instance = await _TransformerEmbeddingProvider.pipeline(
        _TransformerEmbeddingProvider.task,
        this.getModel()
      );
    }
    return _TransformerEmbeddingProvider.instance;
  }
  getProviderName() {
    return _TransformerEmbeddingProvider.providerName;
  }
  getModel() {
    const { model } = this.options;
    return model ? `Xenova/${model}` : _TransformerEmbeddingProvider.model;
  }
  async embed(chunks) {
    if (process.env.NODE_ENV === "test") {
      return chunks.map(() => _TransformerEmbeddingProvider.mockVector);
    }
    const extractor = await this.getInstance();
    if (!extractor) {
      throw new Error("TransformerJS embeddings pipeline is not initialized");
    }
    if (chunks.length === 0) {
      return [];
    }
    const outputs = [];
    for (let i = 0; i < chunks.length; i += _TransformerEmbeddingProvider.maxGroupSize) {
      const chunkGroup = chunks.slice(i, i + _TransformerEmbeddingProvider.maxGroupSize);
      const output = await extractor(chunkGroup, {
        pooling: "mean",
        normalize: true
      });
      await new Promise((resolve) => setTimeout(resolve, 10));
      outputs.push(...output.tolist());
    }
    return outputs;
  }
};

// src/EmbeddingFactory.ts
var Providers = [TransformerEmbeddingProvider];
var getEmbeddingProviderClassFromName = (name) => Providers.find((cls) => cls.providerName === name);
var EmbeddingFactory = class {
  static create = (name, params) => {
    const embeddingProvider = getEmbeddingProviderClassFromName(name ?? "transformers");
    if (!embeddingProvider) {
      console.log(`Unknown embedding provider ${name}`);
    }
    return params ? new embeddingProvider(params) : new embeddingProvider();
  };
};

// src/index.ts
var index_default = EmbeddingFactory;

exports.BaseEmbeddingProvider = BaseEmbeddingProvider;
exports.default = index_default;
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map