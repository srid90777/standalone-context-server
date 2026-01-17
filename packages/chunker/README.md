# @cs/chunker

This library implements the chunking process. It chunks the code in a file into meaningful segments.

## Installation

To install this library, run the following command in your terminal:

```bash
npm install @cs/chunker
```

## Usage

```node
import Chunker from '@cs/chunker';
async function main() {
  const chunker = new Chunker();
```

#### **Define the paths and cache keys for the files you want to chunk**

```node
const paths = [
  { path: 'file1.ts', cacheKey: 'cache1' },
  { path: 'file2.ts', cacheKey: 'cache2' },
];

const pathSep = '/'; // Adjust based on OS
const maxChunkSize = 500; // Define the maximum size of each chunk
const path = 'file1.ts';
const cacheKey = 'cache1';
```

#### **Determines if a file should be chunked based on its size and extension**

```node
const canBeChunked = chunker.canBeChunked(pathSep, path, cacheKey);
console.log(canBeChunked); // true or false
```

#### **Processes a list of files and generates chunks**

```node
const { chunkList, chunkMap } = await chunker.generateChunks(paths, pathSep, maxChunkSize);
console.log(chunkList); // List of chunks
console.log(chunkMap); // Map of file paths to chunks
```

#### **Reads a file and divides it into chunks**

```node
const pathInfo = { path: 'example.js', cacheKey: '12345' };
const chunks = await chunker.convertToChunks(pathInfo, path, maxChunkSize);
console.log(chunks); // List of processed chunks
```

#### **Breaks down a file into chunks and assigns unique identifiers**

```node
const chunkParams = {
  path: 'example.js',
  contents: 'const a = 10;',
  maxChunkSize: 500,
  cacheKey: '12345',
};
for await (const chunk of chunker.streamChunk(chunkParams)) {
  console.log(chunk);
}
```

#### **Splits file contents into line-based chunks**

```node
const fileContents = 'function test() {\n  return true;\n}';
for await (const chunk of chunker.fallbackChunker(fileContents, 50)) {
  console.log(chunk);
}
```

#### **Uses tree-sitter to intelligently chunk code based on syntax structure**

```node
  const filePath = 'example.js';
  for await (const chunk of chunker.chunkCode(filePath, fileContents, maxChunkSize)) {
    console.log(chunk);
  }
}
```
