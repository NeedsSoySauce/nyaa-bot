import { hyperlink, SlashCommandBuilder } from '@discordjs/builders';
import { ButtonInteraction, CacheType, CommandInteraction, EmbedFieldData, MessageActionRow, MessageButton, MessageEmbed, MessagePayload, WebhookEditMessageOptions } from 'discord.js';
import { SearchCommand } from '../models/searchCommand.js';
import { User } from '../models/user.js';
import { CommandRepository } from '../services/commandRepository.js';
import { NyaaCategory, NyaaCategoryDisplayNames, NyaaClient, NyaaFilter, NyaaFilterDisplayNames, NyaaSearchParameters, NyaaSearchResult } from "../services/nyaa.js";
import { UserRepository } from "../services/userRepository.js";
import { ellipsis } from '../util.js';
import { BaseCommand } from './base.js';
import { CommandOptionChoice, CommandTypes } from './index.js';

const filterChoices: CommandOptionChoice<number>[] = Array.from(NyaaFilterDisplayNames, ([filter, name]) => [name, filter])
const categoryChoices: CommandOptionChoice<string>[] = Array.from(NyaaCategoryDisplayNames, ([filter, name]) => [name, filter])

export class SearchSlashCommand extends BaseCommand {
    public commandTypes: CommandTypes = {
        isButtonCommand: true,
        isSlashCommand: true
    }

    private name = 'search'
    private nyaaClient: NyaaClient;
    private userRepository: UserRepository;
    private commandRepository: CommandRepository;

    public constructor(nyaaClient: NyaaClient, userRepository: UserRepository, commandRepository: CommandRepository) {
        super()
        this.nyaaClient = nyaaClient;
        this.userRepository = userRepository;
        this.commandRepository = commandRepository;
    }

    public isButtonCommandExecutor(id: string): boolean {
        return id === 'previous' || id === 'next'
    }

    public async executeButtonCommand(interaction: ButtonInteraction<CacheType>): Promise<void> {
        await interaction.deferUpdate()
        await interaction.editReply({ content: `${interaction.customId} clicked!` });
    }

    public createSlashCommandBuilder() {
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

    public async executeSlashCommand(interaction: CommandInteraction<CacheType>) {
        await interaction.deferReply({ ephemeral: true })

        const searchParameters = this.getSearchParameters(interaction)

        const results = await this.nyaaClient.search(searchParameters)

        const userId = interaction.user.id

        const promises: Promise<unknown>[] = [
            this.userRepository.addOrUpdateUser(new User(userId)),
            this.commandRepository.addCommand(new SearchCommand({ ...searchParameters, userId, name: this.name }))
        ]

        await Promise.all(promises)

        const message = this.createMessage(results, searchParameters)

        await interaction.editReply(message)
    }

    private getSearchParameters(interaction: CommandInteraction<CacheType>): NyaaSearchParameters {
        const query = interaction.options.getString('query', true)
        const filter = interaction.options.getInteger('filter') as NyaaFilter | null
        const category = interaction.options.getString('category') as NyaaCategory | null
        const user = interaction.options.getString('user')
        return { query, filter, category, user }
    }

    private createMessage(results: NyaaSearchResult[], searchParameters: NyaaSearchParameters): string | MessagePayload | WebhookEditMessageOptions {
        const { query, filter, category, user } = searchParameters

        const embed = new MessageEmbed().setTimestamp()

        const filterDisplayName = filter ? NyaaFilterDisplayNames.get(filter) ?? `Error (${filter})` : null
        const categoryDisplayName = category ? NyaaCategoryDisplayNames.get(category) ?? `Error (${category})` : null

        const embedFieldData: EmbedFieldData[] = [{ name: 'Query', value: query, inline: true }]

        if (filterDisplayName) {
            embedFieldData.push({ name: 'Filter', value: filterDisplayName, inline: true })
        }

        if (categoryDisplayName) {
            embedFieldData.push({ name: 'Category', value: categoryDisplayName, inline: true })
        }

        if (user) {
            embedFieldData.push({ name: 'User', value: user, inline: true })
        }

        embed.addFields(embedFieldData)

        const description = results.slice(0, 10).map(result => hyperlink(ellipsis(result.title, 42), result.link)).join('\n')
        embed.addField("Results", description)

        if (results.length > 10) {
            embed.setFooter(`Showing 10 of ${results.length} results`)
        }

        const next = new MessageActionRow()
            .addComponents(
                new MessageButton()
                    .setCustomId('previous')
                    .setLabel('Previous page')
                    .setStyle('PRIMARY'),
                new MessageButton()
                    .setCustomId('next')
                    .setLabel('Next page')
                    .setStyle('PRIMARY')
            );

        return ({
            embeds: [embed],
            components: [next]
        })
    }
}