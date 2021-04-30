import Logger from './Logger';
import LoggerStream from './LoggerStream';

export default class LoggerStreamImpl implements LoggerStream {
    constructor(private readonly logger: Logger, private readonly tags: string[] = []) {}

    createSubStream(subStreamTag: string): LoggerStreamImpl {
        return new LoggerStreamImpl(this.logger, [...this.tags, subStreamTag]);
    }

    error(...message: unknown[]): void {
        this.logger.error({ tags: this.tags, message });
    }

    log(...message: unknown[]): void {
        this.logger.log({ tags: this.tags, message });
    }

    logErrorWhileProcessing(...message: unknown[]): void {
        this.logger.logErrorWhileProcessing({ tags: this.tags, message });
    }

    trace(...message: unknown[]): void {
        this.logger.trace({ tags: this.tags, message });
    }

    warn(...message: unknown[]): void {
        this.logger.warn({ tags: this.tags, message });
    }
}
