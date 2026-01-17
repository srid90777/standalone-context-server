# embedding

This library helps provide the embeddings.

## Installation

To install this library, run the following command in your terminal:

```bash
npm install @cs/embedding'
```

## Usage

```node
import EmbeddingFactory from '@cs/embedding';

const data = {
  options: {
    model: 'all-MiniLM-L6-v2',
    maxChunkSize: 500,
  },
  maxBatchSize: 5,
};
const chunks = [
  `private function clear() {
      $this->cfgMeta = null;
      $this->service = null;
  }`,
];
const embeddingProvider = EmbeddingFactory.create('transformers', data);
const embeddings = await embeddingProvider.embed(chunks);
```
