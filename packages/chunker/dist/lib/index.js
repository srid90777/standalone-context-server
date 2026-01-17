'use strict';

var path = require('path');
var contextUtils = require('@cs/context-utils');
var Parser = require('@cs/tree-sitter');
var llmTokenizer = require('@cs/llm-tokenizer');

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
var Parser__default = /*#__PURE__*/_interopDefault(Parser);

// src/Chunker.ts
var CHUNK_SIZE_BUFFER = 50;
var collapsedNodeConstructors = {
  // Classes, structs, etc
  class_definition: buildClassChunk,
  class_declaration: buildClassChunk,
  impl_item: buildClassChunk,
  // Functions
  function_definition: buildNodeChunks,
  function_declaration: buildNodeChunks,
  function_item: buildNodeChunks,
  // Methods
  method_declaration: buildNodeChunks,
  method_definition: buildNodeChunks,
  arrow_function: buildNodeChunks,
  // Export statement
  export_statement: buildNodeChunks,
  program: buildNodeChunks
};
var FUNCTION_BLOCK_NODE_TYPES = ["block", "statement_block"];
var FUNCTION_DECLARATION_NODE_TYPEs = [
  "method_definition",
  "function_definition",
  "function_item",
  "function_declaration",
  "method_declaration"
];
async function buildClassChunk(node, code, maxChunkSize) {
  return collapseChildNodes(
    node,
    code,
    ["block", "class_body", "declaration_list"],
    FUNCTION_DECLARATION_NODE_TYPEs,
    FUNCTION_BLOCK_NODE_TYPES,
    maxChunkSize
  );
}
async function collapseChildNodes(node, code, blockTypes, collapseTypes, collapseBlockTypes, maxChunkSize) {
  code = code.slice(0, node.endIndex);
  const block = locateFirstChild(node, blockTypes);
  const collapsedChildren = [];
  if (block) {
    const childrenToCollapse = block.children.filter((child) => collapseTypes.includes(child.type));
    for (const child of childrenToCollapse.reverse()) {
      const grandChild = locateFirstChild(child, collapseBlockTypes);
      if (grandChild) {
        const start = grandChild.startIndex;
        const end = grandChild.endIndex;
        const collapsedChild = code.slice(child.startIndex, start) + getCollapsePlaceholder(grandChild);
        code = code.slice(0, start) + getCollapsePlaceholder(grandChild) + code.slice(end);
        collapsedChildren.unshift(collapsedChild);
      }
    }
  }
  code = code.slice(node.startIndex);
  let removedChild = false;
  while (llmTokenizer.countTokens(code.trim()) > maxChunkSize && collapsedChildren.length > 0) {
    removedChild = true;
    const childCode = collapsedChildren.pop();
    const index = code.lastIndexOf(childCode);
    if (index > 0) {
      code = code.slice(0, index) + code.slice(index + childCode.length);
    }
  }
  if (removedChild) {
    let lines = code.split("\n");
    let firstWhiteSpaceInGroup = -1;
    for (let i = lines.length - 1; i >= 0; i--) {
      if (lines[i].trim() === "") {
        if (firstWhiteSpaceInGroup < 0) {
          firstWhiteSpaceInGroup = i;
        }
      } else {
        if (firstWhiteSpaceInGroup - i > 1) {
          lines = [...lines.slice(0, i + 1), ...lines.slice(firstWhiteSpaceInGroup + 1)];
        }
        firstWhiteSpaceInGroup = -1;
      }
    }
    code = lines.join("\n");
  }
  return code;
}
function getCollapsePlaceholder(node) {
  if (node.type === "statement_block") {
    return "{ ... }";
  }
  return "...";
}
function locateFirstChild(node, grammarName) {
  if (Array.isArray(grammarName)) {
    return node.children.find((child) => grammarName.includes(child.type)) || null;
  }
  return node.children.find((child) => child.type === grammarName) || null;
}
async function buildNodeChunks(node, code, maxChunkSize) {
  const codeCollapse = [];
  let currentLine = code.slice(0, node.startIndex).split("\n").length;
  partitionCodeByNode(node, code, maxChunkSize, (chunk) => {
    const chunkLines = chunk.split("\n");
    const startLine = currentLine;
    const endLine = currentLine + chunkLines.length - 1;
    codeCollapse.push({
      startLine,
      endLine,
      content: chunk
    });
    currentLine = endLine + 1;
  });
  return codeCollapse;
}
function trimLastLine(text) {
  const lines = text.split("\n");
  lines.pop();
  return lines.join("\n");
}
function partitionCodeByNode(node, code, maxChunkSize, addChunk) {
  let currentChunkStart = node.startIndex;
  let currentChunkSize = 0;
  let safeChunkLimit = maxChunkSize - CHUNK_SIZE_BUFFER;
  function processNode(node2) {
    const nodeSize = llmTokenizer.countTokens(code.slice(node2.startIndex, node2.endIndex));
    if (nodeSize > maxChunkSize) {
      if (node2.children.length > 0) {
        node2.children.forEach(processNode);
      }
      return;
    }
    const content = code.slice(currentChunkStart, node2.startIndex);
    if (llmTokenizer.countTokens(content) > safeChunkLimit) {
      addChunk(trimLastLine(content), currentChunkStart, node2.startIndex);
      currentChunkStart = node2.startIndex;
      currentChunkSize = 0;
    }
    currentChunkSize += nodeSize;
  }
  node.children.forEach(processNode);
  if (currentChunkSize > 0) {
    addChunk(code.slice(currentChunkStart, node.endIndex), currentChunkStart, node.endIndex);
  }
}

// src/Chunker.ts
var Chunker = class _Chunker {
  cache = /* @__PURE__ */ new Map();
  // Maintaining a separate list here to ensure isolation for chunking and code snippets
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
    sol: "solidity",
    txt: "txt",
    md: "md"
  };
  async buildChunkIfFitsLimit(node, maxChunkSize, root = true) {
    if (root || node.type in collapsedNodeConstructors) {
      const tokenCount = llmTokenizer.countTokens(node.text);
      if (tokenCount < maxChunkSize) {
        return {
          content: node.text,
          startLine: node.startPosition.row,
          endLine: node.endPosition.row
        };
      }
    }
    return void 0;
  }
  async *walkAndChunk(node, code, maxChunkSize, root = true) {
    const chunk = await this.buildChunkIfFitsLimit(node, maxChunkSize, root);
    if (chunk) {
      yield chunk;
      return;
    }
    if (node.type in collapsedNodeConstructors) {
      const codeCollapse = await collapsedNodeConstructors[node.type](node, code, maxChunkSize);
      if (typeof codeCollapse === "string") {
        yield {
          content: codeCollapse,
          startLine: node.startPosition.row,
          endLine: node.endPosition.row
        };
      } else if (Array.isArray(codeCollapse)) {
        for (const chunk2 of codeCollapse) {
          yield {
            content: chunk2.content,
            startLine: chunk2.startLine,
            endLine: chunk2.endLine
          };
        }
      }
    }
    const generators = node.children.map((child) => this.walkAndChunk(child, code, maxChunkSize, false));
    for (const generator of generators) {
      yield* generator;
    }
  }
  canBeChunked(pathSep, filepath, contents) {
    if (contents.length > 1e6) {
      return false;
    }
    if (contents.length === 0) {
      return false;
    }
    const basename = filepath.split(pathSep).pop();
    const extension = path__namespace.extname(filepath).slice(1);
    const languageName = _Chunker.supportedLanguages[extension];
    if (!languageName) {
      return false;
    }
    return basename?.includes(".") ?? false;
  }
  async generateChunks(paths, pathSep, maxChunkSize) {
    const chunkMap = /* @__PURE__ */ new Map();
    const chunkLists = [];
    await Promise.all(
      paths.map(async (p) => {
        const cacheKey = `${p.path}_${p.cacheKey}_${pathSep}`;
        if (!this.cache.has(cacheKey)) {
          const chunks = await this.convertToChunks(p, pathSep, maxChunkSize);
          this.cache.set(cacheKey, chunks);
        }
        const cachedChunks = this.cache.get(cacheKey);
        chunkMap.set(p.path, { item: p, chunks: cachedChunks });
        chunkLists.push(cachedChunks);
      })
    );
    return { chunkList: chunkLists.flat(), chunkMap };
  }
  async convertToChunks(pathAndCacheKey, pathSep, maxChunkSize) {
    const contents = await contextUtils.read(pathAndCacheKey.path);
    if (!this.canBeChunked(pathSep, pathAndCacheKey.path, contents)) {
      return [];
    }
    const chunks = [];
    const chunkParams = {
      path: pathAndCacheKey.path,
      contents,
      maxChunkSize,
      cacheKey: pathAndCacheKey.cacheKey
    };
    for await (const c of this.streamChunk(chunkParams)) {
      chunks.push(c);
    }
    return chunks;
  }
  async *streamChunk({ path: path2, contents, maxChunkSize, cacheKey }) {
    let index = 0;
    const chunkPromises = [];
    for await (const chunkWithoutId of this.streamChunkWithoutId(path2, contents, maxChunkSize)) {
      chunkPromises.push(
        new Promise(async (resolve) => {
          if (llmTokenizer.countTokens(chunkWithoutId.content) > maxChunkSize) {
            return resolve(void 0);
          }
          resolve({
            ...chunkWithoutId,
            cacheKey,
            index,
            path: path2
          });
        })
      );
      index++;
    }
    for await (const chunk of chunkPromises) {
      if (!chunk) {
        continue;
      }
      yield chunk;
    }
  }
  async *streamChunkWithoutId(filepath, contents, maxChunkSize) {
    if (contents.trim() === "") {
      return;
    }
    const segs = filepath.split(".");
    const ext = segs[segs.length - 1];
    if (ext in Parser__default.default.supportedLanguages) {
      try {
        for await (const chunk of this.chunkCode(filepath, contents, maxChunkSize)) {
          yield chunk;
        }
        return;
      } catch (e) {
      }
    }
    yield* this.fallbackChunker(contents, maxChunkSize);
  }
  async *fallbackChunker(contents, maxChunkSize) {
    if (contents.trim().length === 0) {
      return;
    }
    let chunkContent = "";
    let chunkTokens = 0;
    let startLine = 0;
    let currLine = 0;
    const lineTokens = await Promise.all(
      contents.split("\n").map(async (l) => {
        return {
          line: l,
          tokenCount: llmTokenizer.countTokens(l)
        };
      })
    );
    for (const lt of lineTokens) {
      if (chunkTokens + lt.tokenCount > maxChunkSize - 5) {
        yield { content: chunkContent, startLine, endLine: currLine - 1 };
        chunkContent = "";
        chunkTokens = 0;
        startLine = currLine;
      }
      if (lt.tokenCount < maxChunkSize) {
        chunkContent += `${lt.line}
`;
        chunkTokens += lt.tokenCount + 1;
      }
      currLine++;
    }
    yield {
      content: chunkContent,
      startLine,
      endLine: currLine - 1
    };
  }
  async *chunkCode(filepath, contents, maxChunkSize) {
    if (contents.trim().length === 0) {
      return;
    }
    const fileParser = await Parser__default.default.buildParserForFile(filepath);
    if (fileParser === void 0) {
      throw new Error(`Failed to load parser for file ${filepath}: `);
    }
    const tree = fileParser.parse(contents);
    yield* this.walkAndChunk(tree.rootNode, contents, maxChunkSize);
  }
};

// src/index.ts
var index_default = Chunker;

module.exports = index_default;
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map