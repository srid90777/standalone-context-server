# @cs/context-provider

This library manages the indexing and retrieval of files and folders. It provides functionalities to quickly search for or retrieve files based on input.

## Installation

To install this library, run the following command in your terminal:

```bash
npm install @cs/context-provider
```

## Usage

Import the library and use the exported classes / libraries in the microservice:

```node
import { init, CodebaseIndexer, retrieve } from '@cs/context-provider';
```

Initialize the provider before using it. This can be done once while bootstrapping the application.

```node
const config = {
  embeddingProvider: {
    provider: 'transformers',
    model: 'all-MiniLM-L6-v2',
    maxChunkSize: 500,
    maxBatchSize: 6,
  },
  globalDir: '.codespell',
};
// Config is optional, if not provided, the default will be used
await init(config);
```

Indexing will index all the given files or all files in the specified folder. Even if a file is already indexed, it will be deleted and re-indexed from scratch.

```node
const folder = 'pi-api3' // Folder name to be indexed
const branch = 'master'  // Branch to be considered for indexing
const filesAndFolders = [
  '/home/asplap2028/Documents/crain/pirc/pi-api3/src/Command',
  '/home/asplap2028/Documents/crain/pirc/pi-api3/src/CacheKernel.php'
] // List of files and folders to be indexed
const ignoreRules = `/.env.local
/.env.local.php
/.env.*.local
/public/bundles/
/var/
/vendor/
nbproject/
/.env.test`
const indexFiles = async (folder: string, filesAndFolders: string[], branch: string, ignoreRules: string) => {
  const indexer = new CodebaseIndexer(ignoreRules); // ignoreRules is optional. If not provided all files will be allowed.
  for await (const progressUpdate of indexer.index(folder, filesAndFolders, branch)) {
    console.log('Progress Update:', progressUpdate);
  }
};
await indexFiles(folder, filesAndFolders, branch, ignoreRules);
```

Refresh will re-index the files only if they have not been indexed before or if the file has changed since the last indexing.

```node
const refreshFiles = async (folder: string, filesAndFolders: string[], branch: string) => {
  const indexer = new CodebaseIndexer();
  for await (const progressUpdate of indexer.refresh(folder, filesAndFolders, branch)) {
    console.log('Progress Update:', progressUpdate);
  }
};
await refreshFiles(folder, filesAndFolders, branch);
```

Retrieve the relavant chunks from indexed data.

```node
const input = {
  reRank: false,
  thresholdFinal: 25,
  llm: {
    name: 'DelegatedLlm',
    options: {
      invokeFn: callback,
    },
  },
  embeddingName: 'transformers',
  input: 'what is the use of commands',
  tags: [{ branch: 'master', dir: 'pi-api3' }],
  recentlyEditedFiles: ['/home/asplap2028/Documents/crain/pirc/pi-api3/src/CacheKernel.php'],
};
const retrieveData = async (input) => {
  const retrieverResult = await retrieve(input);
  console.log(retrieverResult);
};
await retrieveData(input);
```

Parameter definition:

- reRank(optional): Whether to re-rank the results (true/false). Default false
- thresholdFinal(optional): The confidence threshold for filtering results. Default 25
- llm: llm options to be useds
- embeddingName: Name of the embedding model
- input: User query for retrieval
- tags: Metadata filters for retrieval
- recentlyEditedFiles: List of recently modified files to prioritize
