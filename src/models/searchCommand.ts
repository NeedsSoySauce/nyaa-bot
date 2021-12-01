import { SearchParameters } from '../commands/search.js';
import { NyaaCategory, NyaaFilter } from '../services/nyaaClient.js';
import { NullableUndefined } from "../types";
import { Command, CommandConstructorParams } from './command.js';

export interface SearchCommandConstructorParams extends Omit<CommandConstructorParams, 'name'>, NullableUndefined<SearchParameters> {
}

export class SearchCommand extends Command {
    public name = 'search';
    public query: string;
    public filter?: NyaaFilter | null;
    public category?: NyaaCategory | null;
    public user?: string | null;
    public pageNumber: number;
    public pageSize: number;

    public constructor(params: SearchCommandConstructorParams) {
        super({ ...params, name: 'search' })
        this.query = params.query;
        this.filter = params.filter;
        this.category = params.category;
        this.user = params.user;
        this.pageNumber = params.pageNumber;
        this.pageSize = params.pageSize;
    }
}