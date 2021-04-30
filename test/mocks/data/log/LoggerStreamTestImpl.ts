/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable class-methods-use-this */
import LoggerStream from '../../../../src/data/log/LoggerStream';

export default class LoggerStreamTestImpl implements LoggerStream {
    createSubStream(_: string): LoggerStream {
        return this;
    }

    error(..._: unknown[]): void {
        // No-OP
    }

    log(..._: unknown[]): void {
        // No-OP
    }

    logErrorWhileProcessing(..._: unknown[]): void {
        // No-OP
    }

    trace(..._: unknown[]): void {
        // No-OP
    }

    warn(..._: unknown[]): void {
        // No-OP
    }
}
