import BuildConfig from './BuildConfig';
import CacheManager from './cache/CacheManager';
import MongoDBConnectionHandler from './db/MongoDBConnectionHandler';
import { Color, ConsoleFormatter } from './log/ConsoleFormatter';
import Logger from './log/Logger';
import LoggerStream from './log/LoggerStream';
import LoggerStreamImpl from './log/LoggerStreamImpl';
import TimeWrapper from './TimeWrapper';

type DbHelpers = {};

export type DataDependency = {
    buildConfig: BuildConfig;
    cacheManager: CacheManager;
    dbHelpers: DbHelpers;
    logger: LoggerStream;
    timeWrapper: TimeWrapper;
};

const DB_TAG = new ConsoleFormatter(' DB ')
    .setTextBold()
    .setBackgroundColor(Color.Cyan)
    .setTextColor(Color.Black)
    .format();

const createDbHelpers = (params: {
    buildConfig: BuildConfig;
    cacheManager: CacheManager;
    logger: LoggerStream;
    timeWrapper: TimeWrapper;
}): DbHelpers => {
    const dbLogger = params.logger.createSubStream(DB_TAG);
    const dbConnectionHandler = new MongoDBConnectionHandler(dbLogger, params.timeWrapper, params.buildConfig.isDebug);
    dbConnectionHandler.connectDB(params.buildConfig.primaryDbConnectionUrl);

    return {};
};

const createDependencies = (buildConfig: BuildConfig): DataDependency => {
    const timeWrapper = new TimeWrapper();
    const logger = new Logger(timeWrapper);
    const loggerStream = new LoggerStreamImpl(logger);

    const cacheManager = new CacheManager(timeWrapper, loggerStream);

    const dbHelpers = createDbHelpers({ logger: loggerStream, timeWrapper, cacheManager, buildConfig });

    return {
        buildConfig,
        timeWrapper,
        logger: loggerStream,
        cacheManager,
        dbHelpers,
    };
};

export default createDependencies;
