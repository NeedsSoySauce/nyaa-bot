import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { BaseCommand } from './base.js';
import { CommandTypes } from './index.js';

const replacer = (key: string, value: unknown) => {
    if (typeof value === 'bigint') {
        return value.toString()
    }
    return value
}

export class DebugSlashCommand extends BaseCommand {
    public commandTypes: CommandTypes = {
        isSlashCommand: true
    }

    public createSlashCommandBuilder() {
        return new SlashCommandBuilder().setName("debug").setDescription("Print debug information");
    }

    public async executeSlashCommand(interaction: ChatInputCommandInteraction) {
        await interaction.reply({ content: JSON.stringify(interaction, replacer, 2, ), ephemeral: true })
    }
}