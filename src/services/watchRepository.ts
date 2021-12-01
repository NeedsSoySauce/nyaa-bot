import { Collection, Db } from 'mongodb';
import { Watch } from '../models/watch.js';
import { PagedResult } from '../types.js';

export interface GetWatchesParameters {
    userId?: string;
    pageNumber?: number;
    pageSize?: number
}

export interface WatchRepository {
    addOrUpdateWatch(watch: Watch): Promise<Watch>
    getWatches(params?: GetWatchesParameters): Promise<PagedResult<Watch>>
    deleteWatch(userId: string, id: string): Promise<Watch | null>
}

export class DatabaseWatchRepository implements WatchRepository {
    private collection: Collection<Watch>;

    public constructor(db: Db) {
        this.collection = db.collection<Watch>('watches')
        this.collection.createIndex({
            userId: 1,
            query: 1,
            filter: 1,
            category: 1,
            user: 1
        }, { unique: true })
        this.collection.createIndex({ createdOnUtc: 1 })
        this.collection.createIndex({ userId: 1, id: 1 }, { unique: true })
    }

    public async addOrUpdateWatch(watch: Watch) {
        const { id, createdOnUtc, updatedOnUtc, infoHashes, ...filterProperties } = watch
        const now = new Date();
        await this.collection.updateOne(filterProperties, {
            $setOnInsert: {
                ...filterProperties,
                createdOnUtc,
                id
            },
            $set: {
                updatedOnUtc: now
            },
            $addToSet: {
                infoHashes: {
                    $each: infoHashes
                }
            }
        }, {
            upsert: true
        });
        return watch;
    }

    private getWatchesInternal(params?: GetWatchesParameters) {
        const userId = params?.userId
        if (userId) {
            return this.collection.find({ userId })
        }
        return this.collection.find()
    }

    public async getWatches(params?: GetWatchesParameters): Promise<PagedResult<Watch>> {
        const pageNumber = params?.pageNumber ?? 0
        const pageSize = params?.pageSize ?? 10

        const offset = pageNumber * pageSize
        const watches = await this.getWatchesInternal(params)
            .sort({ createdOnUtc: 1 })
            .skip(offset)
            .limit(pageSize)
            .map(doc => new Watch(doc.userId, doc))
            .toArray()
        const total = await this.getWatchesInternal(params).count()
        const pageCount = Math.ceil(total / pageSize)

        return {
            pageNumber,
            pageSize,
            total,
            pageCount,
            items: watches,
            hasNext: pageNumber < pageCount - 1,
            hasPrevious: pageNumber > 0
        }
    }

    public async deleteWatch(userId: string, id: string): Promise<Watch | null> {
        const result = await this.collection.findOneAndDelete({ userId, id })
        return result.value
    }
}