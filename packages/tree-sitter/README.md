# tree-sitter

This library can build a concrete syntax tree for a source file.

## Installation

To install this library, run the following command in your terminal:

```bash
npm install @cs/tree-sitter
```

## Usage

Import the library and use the exported classes / libraries in the microservice:

```node
import Parser from '@cs/tree-sitter';
```

Retrieves a Parser instance configured for the given file based on its extension.

```node
const filePath = '/home/asplap2028/Documents/crain/pirc/pi-api3/src/example.ts';
async function main(filePath) {
  const parser = await Parser.buildParserForFile(filePath);
  console.log(parser);
}
```

Retrieves a Tree-Sitter query object for extracting structured information from a file.

```node
async function main(filePath) {
  const query = await Parser.loadQueryForFile(filePath);
  console.log(query);
}
```

A dictionary that maps file extensions to corresponding programming languages.

```node
console.log(Parser.supportedLanguages['ts']); // Output: 'typescript'
console.log(Parser.supportedLanguages['java']); // Output: 'java'
```
