interface IConfig {
    embeddingProvider: any;
    globalDir?: string;
    rootDir?: string;
    buildPath?: string;
    multiThread?: boolean;
    workspaceDir: string;
    scriptFile?: string;
}

declare class Config {
    private loadConvictConfig;
    loadAppConfig(appConfig?: any): IConfig;
    getConfig(): IConfig;
    getAppConfig(): IConfig;
}
declare const config: Config;

export { config as default };
