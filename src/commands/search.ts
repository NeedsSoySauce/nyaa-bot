import { SlashCommandBuilder } from '@discordjs/builders';
import { NyaaCategory, NyaaCategoryDisplayNames, NyaaClient, NyaaFilterDisplayNames } from "../nyaa.js";
import { Command, CommandOptionChoice } from './index.js';

const nyaa = new NyaaClient()

const filterChoices: CommandOptionChoice<number>[] = Array.from(NyaaFilterDisplayNames, ([filter, name]) => [name, filter])
const categoryChoices: CommandOptionChoice<string>[] = Array.from(NyaaCategoryDisplayNames, ([filter, name]) => [name, filter])

export const search: Command = {
    builder: new SlashCommandBuilder()
        .setName("search")
        .setDescription("Nyaa")
        .addStringOption(option =>
            option.setName('query')
                .setDescription("Search query")
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('filter')
                .setDescription('Filter option')
                .addChoices(filterChoices))
        .addStringOption(option =>
            option.setName('category')
                .setDescription('Category option')
                .addChoices(categoryChoices)),
    execute: async (interaction) => {
        const query = interaction.options.getString('query', true)
        const filter = interaction.options.getInteger('filter')
        const category = interaction.options.getString('category') as NyaaCategory

        const results = await nyaa.search({ query, filter, category })

        await interaction.reply(`${interaction.user}, your search for '${query}' returned ${results.length} result(s).`,)
    }
}