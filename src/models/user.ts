import { Model } from './model.js';

export class User extends Model {
    public id: string;

    public constructor(id: string) {
        super()
        this.id = id;
    }
}