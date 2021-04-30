import { Color, ConsoleFormatter } from '../log/ConsoleFormatter';
import LoggerStream from '../log/LoggerStream';
import TimeWrapper from '../TimeWrapper';

const DEFAULT_REFRESH_TIME_IN_MIN = 15;
const CACHE_TAG = new ConsoleFormatter(' Cache ')
    .setTextBold()
    .setBackgroundColor(Color.White)
    .setTextColor(Color.Blue)
    .format();

export default class CacheManager {
    private readonly cache: Map<string, { data: unknown; expiry: number; invalidate: boolean }> = new Map();
    private readonly cacheLogger: LoggerStream;

    constructor(private readonly timeWrapper: TimeWrapper, logger: LoggerStream) {
        this.cacheLogger = logger.createSubStream(CACHE_TAG);
    }

    async getCachedData<T>(params: {
        invalidator: () => Promise<T>;
        key: string;
        refreshTime?: number;
        shouldUpdateExpiry?: boolean;
    }): Promise<T> {
        const { invalidator, key, refreshTime, shouldUpdateExpiry } = params;
        const cacheRefreshTime = refreshTime ?? this.timeWrapper.minutesInMillis(DEFAULT_REFRESH_TIME_IN_MIN);

        const cacheData = this.cache.get(key);
        if (!cacheData) {
            // Cache not present, we need to enforce wait
            this.cacheLogger.log('Cache not present enforcing wait');
            return this.invalidateCache(cacheRefreshTime, invalidator, key);
        }
        if (shouldUpdateExpiry && cacheData.expiry > this.timeWrapper.getElapsedTime()) {
            // When data is not expired, update it's expiry to future time.
            cacheData.expiry = this.timeWrapper.getElapsedTime() + cacheRefreshTime;
        }
        if (cacheData.expiry <= this.timeWrapper.getElapsedTime() && cacheData.invalidate) {
            this.cacheLogger.log(`Cache expired, sending request, locking invalidate for key "${key}"`);
            cacheData.invalidate = false;
            this.cache.set(key, cacheData);

            return this.invalidateCache(cacheRefreshTime, invalidator, key);
        }
        this.cacheLogger.log(`Sending data from cache`);
        return cacheData.data as T;
    }

    removeCachedData(key: string): boolean {
        return this.cache.delete(key);
    }

    private async invalidateCache<T>(cacheRefreshTime: number, invalidator: () => Promise<T>, key: string): Promise<T> {
        const newData = await invalidator();
        if (newData) {
            this.cacheLogger.log(`Updating data of cache for key "${key}"`);
            this.cache.set(key, {
                data: newData,
                expiry: this.timeWrapper.getElapsedTime() + cacheRefreshTime,
                invalidate: true,
            });
        }
        return newData;
    }
}
