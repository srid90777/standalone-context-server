'use strict';

var tiktoken = require('tiktoken');

// src/index.ts
var encoding = null;
function encodingForModel(modelName) {
  if (!encoding) {
    encoding = tiktoken.encoding_for_model(modelName) ?? tiktoken.encoding_for_model("gpt-4");
  }
  return encoding;
}
function countImageTokens(content) {
  if (content.type === "imageUrl") {
    return 85;
  }
  throw new Error("Non-image content type");
}
function countTokens(content, modelName = "gpt2") {
  const encoding2 = encodingForModel(modelName);
  if (Array.isArray(content)) {
    return content.reduce((acc, part) => {
      return acc + part.type === "imageUrl" ? countImageTokens(part) : encoding2.encode(part.text ?? "", "all", []).length;
    }, 0);
  } else {
    return encoding2.encode(content ?? "", "all", []).length;
  }
}

exports.countTokens = countTokens;
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map