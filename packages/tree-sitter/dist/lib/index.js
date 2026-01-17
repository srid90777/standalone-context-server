'use strict';

var path = require('path');
var fs = require('fs');
var Parser = require('web-tree-sitter');
var contextUtils = require('@cs/context-utils');

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

var path__namespace = /*#__PURE__*/_interopNamespace(path);
var fs__namespace = /*#__PURE__*/_interopNamespace(fs);
var Parser__default = /*#__PURE__*/_interopDefault(Parser);

// src/Parser.ts
var TreeSitter = class _TreeSitter {
  static nameToLanguage = /* @__PURE__ */ new Map();
  static supportedLanguages = {
    cpp: "cpp",
    hpp: "cpp",
    cc: "cpp",
    cxx: "cpp",
    hxx: "cpp",
    cp: "cpp",
    hh: "cpp",
    inc: "cpp",
    cs: "c_sharp",
    c: "c",
    h: "c",
    css: "css",
    php: "php",
    phtml: "php",
    php3: "php",
    php4: "php",
    php5: "php",
    php7: "php",
    phps: "php",
    "php-s": "php",
    bash: "bash",
    sh: "bash",
    json: "json",
    ts: "typescript",
    mts: "typescript",
    cts: "typescript",
    tsx: "tsx",
    elm: "elm",
    js: "javascript",
    jsx: "javascript",
    mjs: "javascript",
    cjs: "javascript",
    py: "python",
    ipynb: "python",
    pyw: "python",
    pyi: "python",
    el: "elisp",
    emacs: "elisp",
    ex: "elixir",
    exs: "elixir",
    go: "go",
    eex: "embedded_template",
    heex: "embedded_template",
    leex: "embedded_template",
    html: "html",
    htm: "html",
    java: "java",
    lua: "lua",
    ocaml: "ocaml",
    ml: "ocaml",
    mli: "ocaml",
    ql: "ql",
    res: "rescript",
    resi: "rescript",
    rb: "ruby",
    erb: "ruby",
    rs: "rust",
    rdl: "systemrdl",
    toml: "toml",
    sol: "solidity"
  };
  static async buildParserForFile(filepath) {
    try {
      await Parser__default.default.init({
        locateFile(scriptName, _) {
          return path__namespace.join(contextUtils.getRootDir(), contextUtils.getBuildPath(), "/node_modules/web-tree-sitter", scriptName);
        }
      });
      const parser = new Parser__default.default();
      const language = await this.resolveLanguageForFile(filepath);
      if (!language) {
        return void 0;
      }
      parser.setLanguage(language);
      return parser;
    } catch (e) {
      return void 0;
    }
  }
  static async resolveLanguageForFile(filepath) {
    try {
      await Parser__default.default.init({
        locateFile(scriptName, _) {
          return path__namespace.join(contextUtils.getRootDir(), contextUtils.getBuildPath(), "/node_modules/web-tree-sitter", scriptName);
        }
      });
      const extension = path__namespace.extname(filepath).slice(1);
      const languageName = _TreeSitter.supportedLanguages[extension];
      if (!languageName) {
        return void 0;
      }
      let language = _TreeSitter.nameToLanguage.get(languageName);
      if (!language) {
        language = await this.resolveLanguageForFileExt(extension);
        _TreeSitter.nameToLanguage.set(languageName, language);
      }
      return language;
    } catch (e) {
      return void 0;
    }
  }
  static async resolveLanguageForFileExt(fileExtension) {
    const wasmPath = path__namespace.join(
      contextUtils.getRootDir(),
      contextUtils.getBuildPath(),
      "/node_modules/@cs/tree-sitter",
      "tree-sitter-wasms",
      "out",
      `tree-sitter-${_TreeSitter.supportedLanguages[fileExtension]}.wasm`
    );
    return await Parser__default.default.Language.load(wasmPath);
  }
  static async loadQueryForFile(filepath, queryType = "code-snippet-queries") {
    const language = await this.resolveLanguageForFile(filepath);
    if (!language) {
      return void 0;
    }
    const fullLangName = _TreeSitter.supportedLanguages[path__namespace.extname(filepath).slice(1)] ?? "";
    const sourcePath = path__namespace.join(
      contextUtils.getRootDir(),
      contextUtils.getBuildPath(),
      "/node_modules/@cs/tree-sitter",
      "query",
      queryType,
      `${fullLangName}.scm`
    );
    if (!fs__namespace.existsSync(sourcePath)) {
      return void 0;
    }
    const querySource = fs__namespace.readFileSync(sourcePath).toString();
    return language.query(querySource);
  }
};

// src/index.ts
var index_default = TreeSitter;

module.exports = index_default;
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map