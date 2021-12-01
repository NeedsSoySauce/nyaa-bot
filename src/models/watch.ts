import { ObjectId } from 'mongodb';
import { SearchParameters } from '../commands/search.js';
import { NyaaSearchParameters } from '../services/nyaaClient';
import { NyaaCategory, NyaaFilter } from '../services/nyaaClient.js';
import { Model } from './model.js';

export interface WatchConstructorParams extends Omit<SearchParameters, 'pageNumber' | 'pageSize'> {
    userId: string;
    infoHashes: string[] | null;
    id?: string;
}

export class Watch extends Model implements NyaaSearchParameters {
    public userId: string;
    public query: string;
    public filter?: NyaaFilter | null;
    public category?: NyaaCategory | null;
    public user?: string | null;
    public infoHashes: string[];
    public id: string;

    public constructor(userId: string, params: WatchConstructorParams) {
        super();
        this.userId = userId;
        this.query = params.query;
        this.filter = params.filter;
        this.category = params.category;
        this.user = params.user;
        this.infoHashes = params.infoHashes ?? [];
        this.id = params.id ?? new ObjectId().toHexString()
    }
}