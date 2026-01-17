interface EmbedOptions {
    model?: string;
    maxChunkSize?: number;
    maxBatchSize?: number;
}
type EmbeddingsProviderName = 'transformers' | 'llm';
interface EmbeddingsProvider {
    id: string;
    providerName: EmbeddingsProviderName;
    maxChunkSize: number;
    embed(chunks: string[]): Promise<number[][]>;
}

interface IBaseEmbeddingsProvider extends EmbeddingsProvider {
    options: EmbedOptions;
    defaultOptions?: EmbedOptions;
    maxBatchSize?: number;
}
declare abstract class BaseEmbeddingProvider {
    static maxBatchSize: IBaseEmbeddingsProvider['maxBatchSize'];
    static model: IBaseEmbeddingsProvider['options']['model'];
    static defaultOptions: IBaseEmbeddingsProvider['defaultOptions'];
    static providerName: EmbeddingsProviderName;
    abstract embed(chunks: string[]): Promise<number[][]>;
    abstract getProviderName(): string;
    options: IBaseEmbeddingsProvider['options'];
    constructor(options: IBaseEmbeddingsProvider['options']);
    get maxBatchSize(): number | undefined;
    get maxChunkSize(): number;
    getModel(): string | undefined;
    getBatchedChunks(chunks: string[]): string[][];
}

declare class EmbeddingFactory {
    static create: (name: string, params?: {
        [key: string]: any;
    }) => BaseEmbeddingProvider;
}

export { BaseEmbeddingProvider, EmbeddingFactory as default };
