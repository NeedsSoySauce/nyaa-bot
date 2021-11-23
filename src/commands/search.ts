import { SlashCommandBuilder } from '@discordjs/builders';
import { CacheType, CommandInteraction } from 'discord.js';
import { SearchCommand } from '../models/searchCommand.js';
import { User } from '../models/user.js';
import { CommandRepository } from '../services/commandRepository.js';
import { NyaaCategory, NyaaCategoryDisplayNames, NyaaClient, NyaaFilter, NyaaFilterDisplayNames } from "../services/nyaa.js";
import { UserRepository } from "../services/userRepository.js";
import { CommandOptionChoice, SlashCommand } from './index.js';

const nyaa = new NyaaClient()

const filterChoices: CommandOptionChoice<number>[] = Array.from(NyaaFilterDisplayNames, ([filter, name]) => [name, filter])
const categoryChoices: CommandOptionChoice<string>[] = Array.from(NyaaCategoryDisplayNames, ([filter, name]) => [name, filter])

export class SearchSlashCommand implements SlashCommand {
    private name = 'search'
    private userRepository: UserRepository;
    private commandRepository: CommandRepository;

    public constructor(userRepository: UserRepository, commandRepository: CommandRepository) {
        this.userRepository = userRepository;
        this.commandRepository = commandRepository;
    }

    public createBuilder() {
        return new SlashCommandBuilder()
            .setName(this.name)
            .setDescription("Search Nyaa's RSS feed")
            .addStringOption(option =>
                option.setName('query')
                    .setDescription("Search query, e.g. 'one punch man'")
                    .setRequired(true))
            .addIntegerOption(option =>
                option.setName('filter')
                    .setDescription("Filter option, e.g. 'No Remakes'")
                    .addChoices(filterChoices))
            .addStringOption(option =>
                option.setName('category')
                    .setDescription("Category filter, e.g. 'Anime - English Translated'")
                    .addChoices(categoryChoices))
            .addStringOption(option =>
                option.setName('user')
                    .setDescription("User filter, e.g. 'subsplease'"))
    }

    public async execute(interaction: CommandInteraction<CacheType>) {
        const query = interaction.options.getString('query', true)
        const filter = interaction.options.getInteger('filter') as NyaaFilter
        const category = interaction.options.getString('category') as NyaaCategory
        const user = interaction.options.getString('user')

        const results = await nyaa.search({ query, filter, category, user })

        const userId = interaction.user.id

        const promises: Promise<unknown>[] = [
            this.userRepository.addOrUpdateUser(new User(userId)),
            this.commandRepository.addCommand(new SearchCommand({ userId, name: this.name, query, filter, category, user })),
            interaction.reply(`${interaction.user}, your search for '${query}' returned ${results.length} result(s).`,)
        ]

        await Promise.all(promises)
    }
}