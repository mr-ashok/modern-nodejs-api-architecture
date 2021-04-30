import { Collection } from 'mongodb';
import MongoDBConnectionHandler from '../MongoDBConnectionHandler';

export const isSuccessDBResult = (operationResult: { ok?: number; result?: { ok?: number } }): boolean =>
    (operationResult.result?.ok ?? operationResult.ok) === 1;

export abstract class DbHelper<T> {
    protected constructor(
        protected readonly dbConnectionHandler: MongoDBConnectionHandler,
        private readonly collectionName: string
    ) {}

    protected getAllCollections(): Collection<T>[] {
        return this.dbConnectionHandler.getAllDbCollections<T>(this.collectionName);
    }

    protected getPrimaryCollection(): Collection<T> {
        return this.dbConnectionHandler.getPrimaryDbCollection<T>(this.collectionName);
    }
}
