export default interface LoggerStream {
    createSubStream(subStreamTag: string): LoggerStream;

    error(...message: unknown[]): void;

    log(...message: unknown[]): void;

    logErrorWhileProcessing(...message: unknown[]): void;

    trace(...message: unknown[]): void;

    warn(...message: unknown[]): void;
}
