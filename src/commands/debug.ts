import { SlashCommandBuilder } from '@discordjs/builders';
import { Command } from './index.js';

const replacer = (key: string, value: unknown) => {
    if (typeof value === 'bigint') {
        return value.toString()
    }
    return value
}

export const debug: Command = {
    builder: new SlashCommandBuilder().setName("debug").setDescription("Print debug information"),
    execute: async (interaction) => {
        await interaction.reply({ content: JSON.stringify(interaction, replacer, 2, ), ephemeral: true })
    }
}