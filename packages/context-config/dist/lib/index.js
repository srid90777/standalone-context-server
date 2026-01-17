'use strict';

var convict = require('convict');
var async_hooks = require('async_hooks');
var EmbeddingFactory = require('@cs/embedding');

function _interopDefault (e) { return e && e.__esModule ? e : { default: e }; }

var convict__default = /*#__PURE__*/_interopDefault(convict);
var EmbeddingFactory__default = /*#__PURE__*/_interopDefault(EmbeddingFactory);

// src/Config.ts
var configContext = new async_hooks.AsyncLocalStorage();
var Config = class {
  loadConvictConfig() {
    const config2 = convict__default.default({
      env: {
        doc: "The application environment.",
        format: ["prod", "dev"],
        default: "dev",
        env: "NODE_ENV"
      },
      db: {
        postgres: {
          URL: {
            doc: "Postgres Database URI",
            format: String,
            default: "",
            env: "POSTGRES_URL"
          }
        }
      }
    }).validate({ allowed: "strict" });
    return config2.getProperties();
  }
  loadAppConfig(appConfig = {}) {
    const config2 = { ...this.loadConvictConfig(), ...appConfig };
    configContext.enterWith(config2);
    return config2;
  }
  getConfig() {
    const config2 = this.getAppConfig();
    config2.embeddingProvider = EmbeddingFactory__default.default.create(
      config2?.embeddingProvider?.provider,
      config2.embeddingProvider ?? {}
    );
    return config2;
  }
  getAppConfig() {
    const config2 = configContext.getStore();
    if (!config2) {
      throw new Error("No config available in current context. Did you call init()?");
    }
    return config2;
  }
};
var config = new Config();
var Config_default = config;

// src/index.ts
var index_default = Config_default;

module.exports = index_default;
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map