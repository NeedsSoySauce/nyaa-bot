import { SlashCommandBuilder } from '@discordjs/builders';
import { ButtonInteraction, CommandInteraction } from 'discord.js';
import { NullableUndefined } from "../types.js";
import { DebugSlashCommand } from './debug.js';
import { SearchSlashCommand } from './search.js';

export type CommandOptionChoice<T> = [name: string, value: T]

export interface CommandTypes extends NullableUndefined<{
    isSlashCommand?: boolean
    isButtonCommand?: boolean
}> {}

export interface Command {
    readonly commandTypes: CommandTypes
    createSlashCommandBuilder(): Pick<SlashCommandBuilder, "toJSON" | "name"> | null,
    executeSlashCommand(interaction: CommandInteraction): Promise<void>
    isButtonCommandExecutor(customId: string): boolean;
    executeButtonCommand(interaction: ButtonInteraction): Promise<void>
}

export { SearchSlashCommand, DebugSlashCommand };
