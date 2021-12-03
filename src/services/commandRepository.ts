import { Collection, Db } from 'mongodb';
import { Command } from "../models/command.js";

export interface CommandRepository {
    addCommand(command: Command): Promise<Command>
}

export class DatabaseCommandRepository implements CommandRepository {
    private collection: Collection<Command>;

    public constructor(db: Db) {
        this.collection = db.collection<Command>('commands')
    }

    public async addCommand(command: Command): Promise<Command> {
        await this.collection.insertOne(command)
        return command;
    }
}