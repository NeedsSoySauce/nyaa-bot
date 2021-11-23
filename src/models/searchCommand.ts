import { NullableUndefined } from "../types";
import { NyaaFilter, NyaaCategory } from '../services/nyaa.js';
import { Command, CommandConstructorParams } from './command.js';

export interface SearchCommandConstructorParams extends CommandConstructorParams, NullableUndefined<{
    query: string;
    filter?: NyaaFilter;
    category?: NyaaCategory;
    user?: string;
}> {}

export class SearchCommand extends Command {
    public query: string;
    public filter?: NyaaFilter | null;
    public category?: NyaaCategory | null;
    public user?: string | null;

    public constructor(params: SearchCommandConstructorParams) {
        super(params)
        this.query = params.query;
        this.filter = params.filter;
        this.category = params.category;
        this.user = params.user;
    }
}