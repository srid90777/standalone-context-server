import * as proc from 'child_process';

interface RunParameterContext {
    /** Reports an error parsed from the stdin/stdout streams. */
    reportError(err: string | Error): void;
    /** Attempts to stop the running process. See {@link ChildProcess.stop}. */
    stop(force?: boolean, signal?: string): void;
    /** Send string to stdin */
    send(text: string): Promise<void>;
}
interface ChildProcessOptions {
    /** Sets the logging behavior. (default: 'yes') */
    logging?: 'yes' | 'no' | 'noparams';
    /** Controls whether stdout/stderr is collected and returned in the `ChildProcessResult`. (default: true) */
    collect?: boolean;
    /** Wait until streams close to resolve the process result. (default: true) */
    waitForStreams?: boolean;
    /** Forcefully kill the process on an error. (default: false) */
    useForceStop?: boolean;
    /** Rejects the Promise on any error. Can also use a callback for custom errors. (default: false) */
    rejectOnError?: boolean | ((error: Error) => Error);
    /** Rejects the Promise on non-zero exit codes. Can also use a callback for custom errors. (default: false) */
    rejectOnErrorCode?: boolean | ((code: number) => Error);
    /** A `Timeout` token. The running process will be terminated on expiration or cancellation. */
    /** Options sent to the `spawn` command. This is merged in with the base options if they exist. */
    spawnOptions?: proc.SpawnOptions;
    /** Callback for intercepting text from the stdout stream. */
    onStdout?: (text: string, context: RunParameterContext) => void;
    /** Callback for intercepting text from the stderr stream. */
    onStderr?: (text: string, context: RunParameterContext) => void;
    onExit?: () => void;
}
interface ChildProcessRunOptions extends Omit<ChildProcessOptions, 'logging'> {
    /** Arguments applied in addition to the ones used in construction. */
    extraArgs?: string[];
}
interface ChildProcessResult {
    exitCode: number;
    error: Error | undefined;
    /** All output emitted by the process, if it was started with `collect=true`, else empty. */
    stdout: string;
    /** All stderr data emitted by the process, if it was started with `collect=true`, else empty. */
    stderr: string;
    signal?: string;
}

declare const eof: unique symbol;
declare class ChildProcess {
    #private;
    static stopTimeout: number;
    constructor(command: string, args?: any[], baseOptions?: ChildProcessOptions);
    static run(command: string, args?: string[], options?: ChildProcessOptions): Promise<ChildProcessResult>;
    restart(retryCount: number): Promise<void>;
    run(params?: ChildProcessRunOptions): Promise<ChildProcessResult>;
    result(): ChildProcessResult | undefined;
    pid(): number;
    exitCode(): number;
    pause(): void;
    resume(): void;
    stop(force?: boolean, signal?: NodeJS.Signals): void;
    send(input: string | Buffer | typeof eof): Promise<void>;
    get stopped(): boolean;
    toString(noparams?: boolean): string;
}

declare class AsyncQueue<T> {
    private items;
    private resolves;
    private done;
    push(item: T): void;
    close(): void;
    [Symbol.asyncIterator](): AsyncIterator<T>;
}

export { AsyncQueue, ChildProcess as default };
