import { SlashCommandBuilder } from '@discordjs/builders';
import { CommandInteraction } from 'discord.js';
import { SlashCommand } from './index.js';

const replacer = (key: string, value: unknown) => {
    if (typeof value === 'bigint') {
        return value.toString()
    }
    return value
}

export class DebugSlashCommand implements SlashCommand {
    public createBuilder(): Pick<SlashCommandBuilder, 'toJSON' | 'name'> {
        return new SlashCommandBuilder().setName("debug").setDescription("Print debug information");
    }

    public async execute(interaction: CommandInteraction) {
        await interaction.reply({ content: JSON.stringify(interaction, replacer, 2, ), ephemeral: true })
    }
}