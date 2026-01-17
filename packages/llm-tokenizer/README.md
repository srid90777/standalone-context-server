# llm-tokenizer

This library helps count tokens to estimate computational cost and ensure text fits within a model's token limit.

## Installation

To install this library, run the following command in your terminal:

```bash
npm install @cs/llm-tokenizer
```

## Usage

```node
import { countTokens } from '@cs/llm-tokenizer';

const text = `private function clear() {
    $this->cfgMeta = null;
    $this->service = null;
}`;
const model = 'gpt4';
countTokens(text, model);
```
