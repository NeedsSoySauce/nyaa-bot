import { Model } from './model.js';

export interface CommandConstructorParams {
    userId: string;
    name: string;
}

export abstract class Command extends Model {
    public userId: string;
    public name: string;

    public constructor(params: CommandConstructorParams) {
        super()
        this.userId = params.userId;
        this.name = params.name;
    }
}
