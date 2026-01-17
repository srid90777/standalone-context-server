type PathAndCacheKey = {
    path: string;
    cacheKey: string;
};
interface ChunkWithoutID {
    content: string;
    startLine: number;
    endLine: number;
    signature?: string;
}
interface Chunk extends ChunkWithoutID {
    cacheKey: string;
    path: string;
    index: number;
}
type ChunkDocumentParam = {
    path: string;
    contents: string;
    maxChunkSize: number;
    cacheKey: string;
};
type ItemWithChunks = {
    item: PathAndCacheKey;
    chunks: Chunk[];
};
type ChunkMap = Map<string, ItemWithChunks>;

declare class Chunker {
    private cache;
    static supportedLanguages: {
        [key: string]: string;
    };
    private buildChunkIfFitsLimit;
    private walkAndChunk;
    canBeChunked(pathSep: string, filepath: string, contents: string): boolean;
    generateChunks(paths: PathAndCacheKey[], pathSep: string, maxChunkSize: number): Promise<{
        chunkList: Chunk[];
        chunkMap: ChunkMap;
    }>;
    convertToChunks(pathAndCacheKey: PathAndCacheKey, pathSep: string, maxChunkSize: number): Promise<Chunk[]>;
    streamChunk({ path, contents, maxChunkSize, cacheKey }: ChunkDocumentParam): AsyncGenerator<Chunk>;
    private streamChunkWithoutId;
    fallbackChunker(contents: string, maxChunkSize: number): AsyncGenerator<ChunkWithoutID>;
    chunkCode(filepath: string, contents: string, maxChunkSize: number): AsyncGenerator<ChunkWithoutID>;
}

export { Chunker as default };
