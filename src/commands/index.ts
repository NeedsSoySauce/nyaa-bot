import { ButtonInteraction, ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { NullableUndefined } from "../types.js";
import { DebugSlashCommand } from './debug.js';
import { SearchSlashCommand } from './search.js';

export interface CommandTypes extends NullableUndefined<{
    isSlashCommand?: boolean
    isButtonCommand?: boolean
}> {}

export interface Command {
    readonly commandTypes: CommandTypes
    createSlashCommandBuilder(): Pick<SlashCommandBuilder, "toJSON" | "name" | "description"> | null,
    executeSlashCommand(interaction: ChatInputCommandInteraction): Promise<void>
    isButtonCommandExecutor(customId: string): boolean;
    executeButtonCommand(interaction: ButtonInteraction): Promise<void>
}

export { SearchSlashCommand, DebugSlashCommand };

