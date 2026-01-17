import Parser from 'web-tree-sitter';

declare class TreeSitter {
    private static nameToLanguage;
    static supportedLanguages: {
        [key: string]: string;
    };
    static buildParserForFile(filepath: string): Promise<Parser | undefined>;
    private static resolveLanguageForFile;
    private static resolveLanguageForFileExt;
    static loadQueryForFile(filepath: string, queryType?: string): Promise<Parser.Query | undefined>;
}

export { TreeSitter as default };
