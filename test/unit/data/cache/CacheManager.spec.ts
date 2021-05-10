import { expect } from 'chai';
import CacheManager from '../../../../src/data/cache/CacheManager';
import LoggerStreamTestImpl from '../../../mocks/data/log/LoggerStreamTestImpl';
import TimeWrapperTestImp from '../../../mocks/data/TimeWrapperTestImpl';

const CACHE_KEY = 'data_key';
const CACHE_DEFAULT_VALUE = 'default cache data';
const CACHE_ALTERNATIVE_VALUE = 'alternative cache data';
const DEFAULT_REFRESH_TIME_IN_MIN = 15;

describe('Data Layer - Cache', () => {
    it(`Should use invalidator for cache when data is not present`, async () => {
        const timeWrapper = new TimeWrapperTestImp();
        const loggerStream = new LoggerStreamTestImpl();
        const cacheManager = new CacheManager(timeWrapper, loggerStream);
        const cacheData = await cacheManager.getCachedData<string>({
            invalidator: async () => CACHE_DEFAULT_VALUE,
            key: CACHE_KEY,
            refreshTime: timeWrapper.minutesInMillis(DEFAULT_REFRESH_TIME_IN_MIN),
        });
        expect(cacheData).to.be.eql(CACHE_DEFAULT_VALUE);
    });

    it(`Should use cache when data is present`, async () => {
        const timeWrapper = new TimeWrapperTestImp();
        const loggerStream = new LoggerStreamTestImpl();
        const cacheManager = new CacheManager(timeWrapper, loggerStream);
        const cacheData = await cacheManager.getCachedData<string>({
            invalidator: async () => CACHE_DEFAULT_VALUE,
            key: CACHE_KEY,
            refreshTime: timeWrapper.minutesInMillis(DEFAULT_REFRESH_TIME_IN_MIN),
        });
        expect(cacheData).to.be.eql(CACHE_DEFAULT_VALUE);

        const newCacheData = await cacheManager.getCachedData<string>({
            invalidator: () => Promise.reject(new Error('Cache data invaliidator should not be invoked')),
            key: CACHE_KEY,
            refreshTime: timeWrapper.minutesInMillis(DEFAULT_REFRESH_TIME_IN_MIN),
        });
        expect(newCacheData).to.be.eql(CACHE_DEFAULT_VALUE);
    });

    it(`Should invalidate the data after cache expiry`, async () => {
        const timeWrapper = new TimeWrapperTestImp();
        const loggerStream = new LoggerStreamTestImpl();
        const cacheManager = new CacheManager(timeWrapper, loggerStream);
        const cacheData = await cacheManager.getCachedData<string>({
            invalidator: async () => CACHE_DEFAULT_VALUE,
            key: CACHE_KEY,
            refreshTime: timeWrapper.minutesInMillis(DEFAULT_REFRESH_TIME_IN_MIN),
        });
        expect(cacheData).to.be.eql(CACHE_DEFAULT_VALUE);

        const cacheParams = {
            invalidator: async (): Promise<string> => CACHE_ALTERNATIVE_VALUE,
            key: CACHE_KEY,
            refreshTime: timeWrapper.minutesInMillis(DEFAULT_REFRESH_TIME_IN_MIN),
        };

        // Cache data is not changed immediately for cache fetch with different invalidator.
        const cacheDataAfterImmediately = await cacheManager.getCachedData<string>(cacheParams);
        expect(cacheDataAfterImmediately).to.be.eql(CACHE_DEFAULT_VALUE);

        timeWrapper.advanceTimeBy(DEFAULT_REFRESH_TIME_IN_MIN / 2, 'minute');

        // Cache data is not changed after half time with different invalidator.
        const cacheDataAfterHalfTime = await cacheManager.getCachedData<string>(cacheParams);
        expect(cacheDataAfterHalfTime).to.be.eql(CACHE_DEFAULT_VALUE);

        // Cache data is invalidated after cache expiry.
        timeWrapper.advanceTimeBy(DEFAULT_REFRESH_TIME_IN_MIN / 2, 'minute');
        const cacheDataAfterExpiry = await cacheManager.getCachedData<string>(cacheParams);
        expect(cacheDataAfterExpiry).to.be.eql(CACHE_ALTERNATIVE_VALUE);
    });

    it(`Should invalidate the data expiry with data fetch`, async () => {
        const timeWrapper = new TimeWrapperTestImp();
        const loggerStream = new LoggerStreamTestImpl();
        const cacheManager = new CacheManager(timeWrapper, loggerStream);
        const cacheData = await cacheManager.getCachedData<string>({
            invalidator: async () => CACHE_DEFAULT_VALUE,
            key: CACHE_KEY,
            refreshTime: timeWrapper.minutesInMillis(DEFAULT_REFRESH_TIME_IN_MIN),
            shouldUpdateExpiry: true,
        });
        expect(cacheData).to.be.eql(CACHE_DEFAULT_VALUE);

        const cacheParams = {
            invalidator: async (): Promise<string> => CACHE_ALTERNATIVE_VALUE,
            key: CACHE_KEY,
            refreshTime: timeWrapper.minutesInMillis(DEFAULT_REFRESH_TIME_IN_MIN),
            shouldUpdateExpiry: true,
        };

        // Cache data is not changed immediately for cache fetch with different invalidator.
        const cacheDataAfterImmediately = await cacheManager.getCachedData<string>(cacheParams);
        expect(cacheDataAfterImmediately).to.be.eql(CACHE_DEFAULT_VALUE);

        timeWrapper.advanceTimeBy(DEFAULT_REFRESH_TIME_IN_MIN / 2, 'minute');

        // Cache data is not changed after half time with different invalidator.
        const cacheDataAfterHalfTime = await cacheManager.getCachedData<string>(cacheParams);
        expect(cacheDataAfterHalfTime).to.be.eql(CACHE_DEFAULT_VALUE);

        // Cache data is not changed after full expiry time with different invalidator to verify the expiry was updated.
        timeWrapper.advanceTimeBy(DEFAULT_REFRESH_TIME_IN_MIN / 2, 'minute');
        const cacheDataAfterExpiry = await cacheManager.getCachedData<string>(cacheParams);
        expect(cacheDataAfterExpiry).to.be.eql(CACHE_DEFAULT_VALUE);

        // Verify cache data is invalidated after the updated expiry time has been passed.
        timeWrapper.advanceTimeBy(DEFAULT_REFRESH_TIME_IN_MIN * 2, 'minute');
        const cacheDataAfterUpdatedExpiry = await cacheManager.getCachedData<string>(cacheParams);
        expect(cacheDataAfterUpdatedExpiry).to.be.eql(CACHE_ALTERNATIVE_VALUE);
    });
});
