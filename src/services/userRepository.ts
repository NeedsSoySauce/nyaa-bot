import { Collection, Db } from 'mongodb';
import { User } from '../models/user.js';

export interface UserRepository {
    addOrUpdateUser(user: User): Promise<User>
}

export class DatabaseUserRepository implements UserRepository {
    private collection: Collection<User>;

    public constructor(db: Db) {
        this.collection = db.collection<User>('users')
        this.collection.createIndex({ id: 1 }, { unique: true })
    }

    public async addOrUpdateUser(user: User) {
        const { createdOnUtc, ...other } = user
        const now = new Date();
        await this.collection.updateOne({
            id: user.id
        }, {
            $setOnInsert: {
                createdOnUtc: now
            },
            $set: {
                ...other
            }
        }, {
            upsert: true
        });
        return user;
    }
}