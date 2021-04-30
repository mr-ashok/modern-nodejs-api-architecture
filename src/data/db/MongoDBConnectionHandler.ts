import { Collection, Db, LoggerState, MongoClient } from 'mongodb';
import LoggerStream from '../log/LoggerStream';
import TimeWrapper from '../TimeWrapper';

const BLACK_LISTED_MESSAGES = ['schedule getMore call'];
const LOGGABLE_CLASS_NAME = ['Db', 'Cursor'];

const RETRY_DELAY_IN_SEC = 5;
const MAX_RETRY_ATTEMPT = 5;

export default class MongoDBConnectionHandler {
    private readonly mongoDbClients: MongoClient[] = [];
    private readonly mongoDbLogger: (_?: string, loggerState?: LoggerState) => void;

    constructor(
        private readonly dbLogger: LoggerStream,
        private readonly timeWrapper: TimeWrapper,
        private readonly isDebug: boolean
    ) {
        this.mongoDbLogger = (_?: string, loggerState?: LoggerState): void => {
            if (!isDebug || !loggerState) {
                return;
            }
            for (let index = 0; index < BLACK_LISTED_MESSAGES.length; index++) {
                const blackListedMessage = BLACK_LISTED_MESSAGES[index];
                if (blackListedMessage && loggerState.message.startsWith(blackListedMessage)) {
                    return;
                }
            }
            if (LOGGABLE_CLASS_NAME.includes(loggerState.className)) {
                this.dbLogger.log(loggerState);
            }
        };
    }

    connectDB(connectionUrl: string, retryAttempt: number = 0): void {
        const mongoClient = new MongoClient(connectionUrl, {
            loggerLevel: this.isDebug ? 'debug' : undefined,
            logger: this.mongoDbLogger,
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        mongoClient.on('connecting', () => this.dbLogger.log('connecting to MongoDB...'));
        mongoClient.on('connected', () => this.dbLogger.log('MongoDB connected!'));
        mongoClient.once('open', () => this.dbLogger.log('MongoDB connection opened!'));
        mongoClient.on('reconnected', () => this.dbLogger.log('MongoDB reconnected!'));
        mongoClient.on('error', (err: string) => {
            this.dbLogger.error(`Error in MongoDb connection: ${err}`);
            this.disconnectDB();
            this.retryConnect(connectionUrl, retryAttempt);
        });
        mongoClient.on('disconnected', () => {
            this.dbLogger.log('MongoDB disconnected!');
            this.retryConnect(connectionUrl, retryAttempt);
        });

        mongoClient.connect().then(
            () => {
                this.dbLogger.log('DB connected');
                this.mongoDbClients.push(mongoClient);
            },
            () => {
                this.dbLogger.error('DB connection failed.');
                this.retryConnect(connectionUrl, retryAttempt);
            }
        );
    }

    disconnectDB(): void {
        while (this.mongoDbClients.length > 0) {
            const client = this.mongoDbClients.pop();
            if (client) {
                client.close().then(
                    () => this.dbLogger.log('DB disconnected'),
                    () => this.dbLogger.error('DB disconnection failed.')
                );
            }
        }
    }

    getAllDbCollections<T>(collectionName: string): Collection<T>[] {
        return this.mongoDbClients.map((client) => client.db().collection<T>(collectionName));
    }

    getPrimaryDb(): Db {
        if (this.mongoDbClients.length > 0 && this.mongoDbClients[0]) {
            return this.mongoDbClients[0].db();
        }
        throw new Error(`No Primary DB specified`);
    }

    getPrimaryDbCollection<T>(collectionName: string): Collection<T> {
        return this.getPrimaryDb().collection<T>(collectionName);
    }

    lazyBackupOp<COLLECTION_TYPE, OPERATION_RESULT_TYPE>(
        collections: Collection<COLLECTION_TYPE>[],
        executor: (collection: Collection<COLLECTION_TYPE>) => Promise<OPERATION_RESULT_TYPE>
    ): Promise<OPERATION_RESULT_TYPE> {
        const primaryDb = collections[0];
        if (!primaryDb) {
            return Promise.reject(new Error(`Invalid call for DB operation`));
        }
        const logOperationPerformance = (
            collection: string,
            status: 'success' | 'failed',
            executionTime: number
        ): void => this.dbLogger.log(`DB Performance: `, { collection, status, executionTime });
        return new Promise<OPERATION_RESULT_TYPE>((resolve, reject) => {
            const executorStartTimeForPrimaryCollection = this.timeWrapper.getDate().getTime();
            executor(primaryDb).then(
                (data) => {
                    const executionTimeForPrimaryCollection =
                        this.timeWrapper.getElapsedTime() - executorStartTimeForPrimaryCollection;
                    logOperationPerformance('primary', 'success', executionTimeForPrimaryCollection);

                    // Execute operation on backup DB, only when primary DB operation sucess.
                    for (let index = 1; index < collections.length; index++) {
                        const collection = collections[index];
                        if (collection) {
                            const executorStartTimeForBackupCollection = this.timeWrapper.getElapsedTime();
                            const logPerformance = (status: 'success' | 'failed'): void => {
                                const executionTimeForBackupCollection =
                                    this.timeWrapper.getElapsedTime() - executorStartTimeForBackupCollection;
                                logOperationPerformance(`backup_${index}`, status, executionTimeForBackupCollection);
                            };
                            executor(collection).then(
                                () => logPerformance('success'),
                                (err) => {
                                    logPerformance('failed');
                                    this.dbLogger.error(`DB Operation error for backup_${index} collection`, err);
                                }
                            );
                        }
                    }
                    resolve(data);
                },
                (err) => {
                    const executionTimeForPrimaryCollection =
                        this.timeWrapper.getElapsedTime() - executorStartTimeForPrimaryCollection;
                    logOperationPerformance('primary', 'failed', executionTimeForPrimaryCollection);
                    this.dbLogger.error(`DB Operation error for primary collection`, err);
                    reject(err);
                }
            );
        });
    }

    private retryConnect(connectionUrl: string, retryAttempt: number = 0): void {
        if (retryAttempt >= MAX_RETRY_ATTEMPT) {
            this.dbLogger.error('Hit max retry attempts');
            return;
        }
        setTimeout(
            () => this.connectDB(connectionUrl, retryAttempt + 1),
            this.timeWrapper.secondsInMillis(RETRY_DELAY_IN_SEC)
        );
    }
}
