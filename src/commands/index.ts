import { SlashCommandBuilder } from '@discordjs/builders';
import { CommandInteraction } from 'discord.js';
import { DebugSlashCommand } from './debug.js';
import { SearchSlashCommand } from './search.js';

export type CommandOptionChoice<T> = [name: string, value: T]

export interface SlashCommand {
    createBuilder(): Pick<SlashCommandBuilder, "toJSON" | "name">,
    execute(interaction: CommandInteraction): Promise<void>
}

export { SearchSlashCommand, DebugSlashCommand };
