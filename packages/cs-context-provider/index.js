class CodebaseIndexer {
  constructor() {}
  async isIndexed(folder, branch) { return false; }
  houseKeeping(days) {}
}

const init = async (config) => {
  console.log("Mock @cs/context-provider initialized");
};

const retrieve = async (options) => {
  return [];
};

module.exports = {
  CodebaseIndexer,
  init,
  retrieve
};
