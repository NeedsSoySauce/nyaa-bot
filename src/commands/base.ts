/* eslint-disable @typescript-eslint/no-unused-vars */
import { SlashCommandBuilder } from '@discordjs/builders';
import { ButtonInteraction, CacheType, CommandInteraction } from 'discord.js';
import { Command, CommandTypes } from './index.js';

export abstract class BaseCommand implements Command {
    public readonly abstract commandTypes: CommandTypes;

    public createSlashCommandBuilder(): Pick<SlashCommandBuilder, 'toJSON' | 'name' | 'description'> | null {
        return null
    }

    public executeSlashCommand(interaction: CommandInteraction<CacheType>): Promise<void> {
        return Promise.resolve()
    }

    public isButtonCommandExecutor(customId: string): boolean {
        return false
    }

    public executeButtonCommand(interaction: ButtonInteraction<CacheType>): Promise<void> {
        return Promise.resolve()
    }
}