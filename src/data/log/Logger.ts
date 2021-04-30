import TimeWrapper from '../TimeWrapper';
import { Color, ColorType, ConsoleFormatter } from './ConsoleFormatter';

type LoggerData = {
    message: unknown[];
    tags: string[];
};

const createFormattedTag = (message: string, color: ColorType): string =>
    new ConsoleFormatter(message).setTextBold().setTextColor(color).format();

const TAG_PREFIX = 'Logger';
const logTag = createFormattedTag(`${TAG_PREFIX}:log`, Color.Blue);
const errorTag = createFormattedTag(`${TAG_PREFIX}:error`, Color.Red);
const warnTag = createFormattedTag(`${TAG_PREFIX}:warn`, Color.Yellow);
const traceTag = createFormattedTag(`${TAG_PREFIX}:trace`, Color.Cyan);

/* eslint-disable no-console */
export default class Logger {
    constructor(private readonly timeWrapper: TimeWrapper) {}

    error(data: LoggerData): void {
        return this.logWithFormatting(errorTag, data, Color.Red);
    }

    log(data: LoggerData): void {
        return this.logWithFormatting(logTag, data, Color.Default);
    }

    logErrorWhileProcessing(data: LoggerData): void {
        this.error({
            ...data,
            message: [
                'Error while processing data, please take appropriate action',
                {
                    date: this.timeWrapper.getDate(),
                    message: data.message,
                },
            ],
        });
    }

    trace(data: LoggerData): void {
        const messages = this.createFormattedMessage(data, Color.Default);
        console.trace(traceTag, ...data.tags, ...messages);
    }

    warn(data: LoggerData): void {
        return this.logWithFormatting(warnTag, data, Color.Yellow);
    }

    private createFormattedMessage(data: LoggerData, color: ColorType): unknown[] {
        const timeStamp = `(${this.timeWrapper.getDate().toUTCString()})`;
        return [timeStamp, ...data.message].map((message) =>
            typeof message === 'string' ? new ConsoleFormatter(message).setTextColor(color).format() : message
        );
    }

    private logWithFormatting(tag: string, data: LoggerData, color: ColorType): void {
        const messages = this.createFormattedMessage(data, color);
        console.log(tag, ...data.tags, ...messages);
    }
}
/* eslint-enable no-console */
