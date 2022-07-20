/* eslint-disable @typescript-eslint/no-unused-vars */
import { ButtonInteraction, ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { Command, CommandTypes } from './index.js';

export abstract class BaseCommand implements Command {
    public readonly abstract commandTypes: CommandTypes;

    public createSlashCommandBuilder(): Pick<SlashCommandBuilder, 'toJSON' | 'name' | 'description'> | null {
        return null
    }

    public executeSlashCommand(interaction: ChatInputCommandInteraction): Promise<void> {
        return Promise.resolve()
    }

    public isButtonCommandExecutor(customId: string): boolean {
        return false
    }

    public executeButtonCommand(interaction: ButtonInteraction): Promise<void> {
        return Promise.resolve()
    }
}