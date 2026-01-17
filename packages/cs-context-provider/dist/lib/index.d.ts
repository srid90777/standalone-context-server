import { Model } from 'sequelize-typescript';

declare class Chunk extends Model {
    cacheKey: string;
    path: string;
    startLine: number;
    endLine: number;
    content: string;
}

declare class Tag extends Model<Tag> {
    dir: string;
    branch: string;
    artifactId: string;
    path: string;
    cacheKey: string;
    lastUpdatedAt: string;
    projectId?: string | undefined;
    orgId?: number | undefined;
    tenantId?: number | undefined;
}

type LastModifiedMap = {
    [path: string]: number;
};
type PathAndCacheKey = {
    path: string;
    cacheKey: string;
};

interface ProgressUpdate {
    data: string;
}
type IndexStatus = 'loading' | 'indexing' | 'done' | 'failed' | 'paused' | 'disabled' | 'complete';
interface IndexProgressUpdate {
    progress: number;
    desc: string;
    shouldClearIndexes?: boolean;
    status: IndexStatus;
    debugInfo?: string;
}
type RefreshIndex = {
    compute: Tag[];
    del: Tag[];
    addTag: Tag[];
    removeTag: Tag[];
};
interface ICodebaseIndex {
    update(tag: IndexTag, subResult: any, identifier: string, markComplete: any): any;
    getArtifactId(): string;
    identifyChanges(tag: IndexTag, currentFiles: LastModifiedMap, identifier: string, refresh: boolean): Promise<any>;
}
declare enum IndexType {
    Compute = "compute",
    Delete = "del",
    AddTag = "addTag",
    RemoveTag = "removeTag",
    UpdateLastUpdated = "updateLastUpdated",
    StatusUpdate = "updateStatus"
}
interface LatestChunk {
    path: string;
    indexedAt: string;
}

interface BranchAndDir {
    branch: string;
    dir?: string;
}
interface ProjectTag {
    projectId?: string;
    orgId?: number;
    tenantId?: number;
}
interface IndexTag extends ProjectTag, BranchAndDir {
    artifactId: string;
}
type MarkCompleteCallback = (items: Tag[], resultType: IndexType) => Promise<void>;

interface LlmArgs {
    name: string;
    options: LlmOptions;
}
interface LlmOptions {
    invokeFn: LlmInvoke;
}
interface ChatInput {
    [key: string]: any;
}
type LlmInvoke = (input: ChatInput) => Promise<string>;

interface RetrieverArgs {
    input: string;
    tags: BranchAndDir[];
    recentlyEditedFiles: string[];
}
interface RetrievalChainOptions extends RetrieverArgs {
    reRank?: boolean;
    thresholdFinal?: number;
    llm: LlmArgs;
    embeddingName: string;
    isKeywordRetrievalEnabled?: boolean;
}

declare function retrieve(options: RetrievalChainOptions): AsyncGenerator<{
    desc: string;
    action: string;
    status: string;
    data?: undefined;
} | {
    desc: string;
    action: string;
    status: string;
    data: string[];
} | {
    desc: string;
    action: string;
    status: string;
    data: void | Partial<Chunk>[];
}, void, unknown>;

declare class CodebaseIndexer {
    protected readonly rules: string;
    private ignoreRules;
    private globalIndexer;
    private static instance;
    constructor(rules?: string);
    static getInstance(rules?: string): CodebaseIndexer;
    /**
     * We batch for two reasons:
     * - To limit memory usage for indexes that perform computations locally, e.g. FTS
     * - To make as few requests as possible to the embeddings providers
     */
    filesPerBatch: number;
    errorsRegexesToClearIndexesOn: RegExp[];
    houseKeeping(days?: number): void;
    private getIndexesToBuild;
    isIndexed(workspaceDir: string, branch: string): Promise<LatestChunk | {}>;
    /**
     * Enables the indexing operation to be completed in batches, this is important in large
     * repositories where indexing can quickly use up all the memory available
     */
    private batchRefreshIndex;
    private runScript;
    refresh(workspaceDir: string, workspace: string[], branch: string): AsyncGenerator<string | ProgressUpdate, void, unknown>;
    index(workspaceDir: string, workspace: string[], branch: string): AsyncGenerator<string | ProgressUpdate, void, unknown>;
    doRefresh(workspaceDir: string, workspace: string[], branch: string, identifier: string): AsyncGenerator<ProgressUpdate, void, unknown>;
    private getFilesToIndex;
    doIndex(workspaceDir: string, workspace: string[], branch: string, identifier: string): AsyncGenerator<ProgressUpdate, void, unknown>;
    private indexFiles;
}

interface PathsAndSignatures {
    groupedByPath: {
        [path: string]: string[];
    };
    hasMore: boolean;
}

declare class CodeSnippetIndex implements ICodebaseIndex {
    private artifactId;
    private codeSnippetService;
    constructor();
    update(tag: IndexTag, refreshIndex: RefreshIndex, _: string, markComplete: MarkCompleteCallback): AsyncGenerator<IndexProgressUpdate, any, unknown>;
    getArtifactId(): string;
    identifyChanges(tag: IndexTag, currentFiles: LastModifiedMap, identifier: string, refresh: boolean): Promise<[RefreshIndex, PathAndCacheKey[], MarkCompleteCallback]>;
    getPathsAndSignatures(workspaceDirs: string[], offset?: number, batchSize?: number): Promise<PathsAndSignatures>;
}

declare const init: (appConfig?: any) => Promise<void>;

export { CodeSnippetIndex, CodebaseIndexer, init, retrieve };
