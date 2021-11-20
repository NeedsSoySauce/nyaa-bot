import { SlashCommandBuilder } from '@discordjs/builders';
import { CommandInteraction } from 'discord.js';
import { search } from './search.js';
import { debug } from './debug.js'

export type CommandOptionChoice<T> = [name: string, value: T]

export interface Command {
    builder: Pick<SlashCommandBuilder, "toJSON" | "name">,
    execute(interaction: CommandInteraction): Promise<void>
}

export { search, debug };
