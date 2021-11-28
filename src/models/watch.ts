import { ObjectId } from 'mongodb';
import { SearchParameters } from '../commands/search.js';
import { NyaaCategory, NyaaFilter } from '../services/nyaa.js';
import { Model } from './model.js';

export interface WatchConstructorParams extends Omit<SearchParameters, 'pageNumber' | 'pageSize'> {
    userId: string;
    lastInfoHash: string | null;
    id?: string;
}

export class Watch extends Model {
    public userId: string;
    public query: string;
    public filter?: NyaaFilter | null;
    public category?: NyaaCategory | null;
    public user?: string | null;
    public lastInfoHash: string | null;
    public id: string;

    public constructor(userId: string, params: WatchConstructorParams) {
        super();
        this.userId = userId;
        this.query = params.query;
        this.filter = params.filter;
        this.category = params.category;
        this.user = params.user;
        this.lastInfoHash = params.lastInfoHash;
        this.id = params.id ?? new ObjectId().toHexString()
    }
}