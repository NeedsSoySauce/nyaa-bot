import { SlashCommandBuilder } from '@discordjs/builders';
import { Command } from './index.js';

export const search: Command = {
    builder: new SlashCommandBuilder().setName("search").setDescription("Nyaa"),
    execute: async (interaction) => {
        await interaction.reply("pog")
    }
}