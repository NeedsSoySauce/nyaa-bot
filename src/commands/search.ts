import { APIApplicationCommandOptionChoice, APIEmbedField, ButtonStyle } from 'discord-api-types/v10';
import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ChatInputCommandInteraction, Embed, EmbedBuilder, InteractionEditReplyOptions, MessageActionRowComponentBuilder, MessagePayload, SlashCommandBuilder, bold, hyperlink, inlineCode } from 'discord.js';
import { SearchCommand } from '../models/searchCommand.js';
import { User } from '../models/user.js';
import { Watch } from '../models/watch.js';
import { CommandRepository } from '../services/commandRepository.js';
import { NyaaCategory, NyaaCategoryDisplayNames, NyaaClient, NyaaFilter, NyaaFilterDisplayNames, NyaaSearchPagedResult, NyaaSearchParameters, NyaaSearchResult, ReverseNyaaCategoryDisplayNames, ReverseNyaaFilterDisplayNames } from "../services/nyaaClient.js";
import { UserRepository } from "../services/userRepository.js";
import { WatchRepository } from '../services/watchRepository.js';
import { ellipsis, error, escapeDiscordMarkdown } from '../util.js';
import { BaseCommand } from './base.js';
import { CommandTypes } from './index.js';

const filterChoices: APIApplicationCommandOptionChoice<number>[] = Array.from(NyaaFilterDisplayNames, ([filter, name]) => ({
    name,
    value: filter
}))
const categoryChoices: APIApplicationCommandOptionChoice<string>[] = Array.from(NyaaCategoryDisplayNames, ([filter, name]) => ({
    name,
    value: filter
}))

export interface SearchParameters extends NyaaSearchParameters {
    pageNumber: number;
    pageSize: number;
}

export interface SearchSlashCommandConstructorParameters {
    nyaaClient: NyaaClient;
    userRepository: UserRepository;
    commandRepository: CommandRepository;
    watchRepository: WatchRepository;
}

export class SearchSlashCommand extends BaseCommand {
    public commandTypes: CommandTypes = {
        isButtonCommand: true,
        isSlashCommand: true
    }

    private name = 'search'
    private nyaaClient: NyaaClient;
    private userRepository: UserRepository;
    private commandRepository: CommandRepository;
    private watchRepository: WatchRepository;
    private pageSize = 10;

    public constructor({ nyaaClient, userRepository, commandRepository, watchRepository }: SearchSlashCommandConstructorParameters) {
        super()
        this.nyaaClient = nyaaClient;
        this.userRepository = userRepository;
        this.commandRepository = commandRepository;
        this.watchRepository = watchRepository;
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
                    .setChoices(...filterChoices))
            .addStringOption(option =>
                option.setName('category')
                    .setDescription("Category filter, e.g. 'Anime - English Translated'")
                    .setChoices(...categoryChoices))
            .addStringOption(option =>
                option.setName('user')
                    .setDescription("User filter, e.g. 'subsplease'"))
    }

    public async executeSlashCommand(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply({ ephemeral: true })

        const searchParameters = this.getSearchParameters(interaction)

        const page = await this.nyaaClient.search(searchParameters)

        const userId = interaction.user.id

        const promises: Promise<unknown>[] = [
            this.userRepository.addOrUpdateUser(new User(userId)),
            this.commandRepository.addCommand(new SearchCommand({ ...searchParameters, userId }))
        ]

        await Promise.all(promises)

        const message = this.createMessage(page, searchParameters)

        await interaction.editReply(message)
    }

    private getSearchParameters(interaction: ChatInputCommandInteraction): SearchParameters {
        const query = interaction.options.getString('query', true)
        const filter = interaction.options.getInteger('filter') as NyaaFilter | null
        const category = interaction.options.getString('category') as NyaaCategory | null
        const user = interaction.options.getString('user')
        return { query, filter, category, user, pageNumber: 0, pageSize: this.pageSize }
    }

    public isButtonCommandExecutor(id: string): boolean {
        return id === 'search-previous' || id === 'search-next' || id ==='search-watch'
    }

    public async executeButtonCommand(interaction: ButtonInteraction): Promise<void> {
        await interaction.deferUpdate()

        const embed = interaction.message.embeds[0]
        const searchParameters = this.parseSearchParameters(embed)

        if (interaction.customId === 'search-watch') {
            searchParameters.pageNumber = 0
        } else {
            searchParameters.pageNumber += interaction.customId === 'search-next' ? 1 : -1
        }

        const page = await this.nyaaClient.search(searchParameters)

        const userId = interaction.user.id

        const command = new SearchCommand({ ...searchParameters, userId })

        if (interaction.customId === 'search-watch') {
            const watch = await this.watch(interaction.user.id, command, page.items);
            const watchEmbed = this.createWatchEmbed(watch)
            await interaction.followUp({ embeds: [watchEmbed], ephemeral: true })
            // await interaction.user.send({ embeds: [watchEmbed] })
            return;
        }

        const promises: Promise<unknown>[] = [
            this.userRepository.addOrUpdateUser(new User(userId)),
            this.commandRepository.addCommand(command)
        ]

        await Promise.all(promises)

        const message = this.createMessage(page, searchParameters)

        await interaction.editReply(message);
    }

    private async watch(userId: string, searchCommand: SearchCommand, searchResults: NyaaSearchResult[]) {
        const infoHashes = searchResults.map(r => r.nyaaInfoHash)
        return this.watchRepository.addOrUpdateWatch(new Watch(userId, { ...searchCommand, infoHashes }))
    }

    private parseSearchParameters(embed: Embed): SearchParameters {
        const query = embed.fields?.find(f => f.name === 'Query')?.value ?? error("'Query' field not found")
        const user = embed.fields?.find(f => f.name === 'User')?.value
        const filterDisplayName = embed.fields?.find(f => f.name === 'Filter')?.value
        const filter = filterDisplayName ? ReverseNyaaFilterDisplayNames.get(filterDisplayName) : null
        const categoryDisplayName = embed.fields?.find(f => f.name === 'Category')?.value
        const category = categoryDisplayName ? ReverseNyaaCategoryDisplayNames.get(categoryDisplayName) : null

        const pagingText = embed.footer?.text;
        const pagingParamters = this.parsePagingParameters(pagingText)

        return {
            ...pagingParamters,
            query,
            user,
            filter,
            category
        }
    }

    private parsePagingParameters(text?: string): Pick<SearchParameters, 'pageNumber' | 'pageSize'> {
        if (!text) {
            return {
                pageNumber: 0,
                pageSize: this.pageSize
            }
        }
        const parts = text.split(' ')
        const pageStart = Number(parts[1])
        const offset = pageStart - 1
        const pageNumber = offset / this.pageSize
        return {
            pageNumber,
            pageSize: this.pageSize
        }
    }

    private formatItem(item: NyaaSearchResult, prefix: string) {
        const text = ellipsis(escapeDiscordMarkdown(item.title.trim()), 200)
        return `${bold(prefix)}${hyperlink(text, item.guid)}`
    }

    private createMessage(page: NyaaSearchPagedResult, searchParameters: SearchParameters): string | MessagePayload | InteractionEditReplyOptions {
        const { items } = page
        const { query, filter, category, user } = searchParameters

        const embed = new EmbedBuilder().setTimestamp()
        const filterDisplayName = filter != null ? NyaaFilterDisplayNames.get(filter) ?? `Error (${filter})` : null
        const categoryDisplayName = category != null ? NyaaCategoryDisplayNames.get(category) ?? `Error (${category})` : null

        const embedFieldData: APIEmbedField[] = [{ name: 'Query', value: query, inline: true }]

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

        if (items.length) {
            const offset = page.pageNumber * page.pageSize
            const pageStart = Math.min(offset + 1, page.total)
            const pageEnd = Math.min(offset + page.pageSize, page.total)
            embed.setFooter({ text: `Showing ${pageStart} to ${pageEnd} of ${page.total} results` })
            const description = items.map((value, i) => this.formatItem(value, `${i + pageStart}. `)).join('\n')
            embed.setDescription(description)
        } else {
            embed.setDescription("No results found")
        }

        const actionRowBuilder = new ActionRowBuilder<MessageActionRowComponentBuilder>()
            .setComponents(
                new ButtonBuilder()
                    .setCustomId('search-watch')
                    .setLabel('Watch')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setLabel('Nyaa')
                    .setStyle(ButtonStyle.Link)
                    .setURL(page.urL)
            );

        if (items.length) {
            actionRowBuilder.addComponents(
                new ButtonBuilder()
                    .setCustomId('search-previous')
                    .setLabel('Previous page')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(!page.hasPrevious),
                new ButtonBuilder()
                    .setCustomId('search-next')
                    .setLabel('Next page')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(!page.hasNext)
            );
        }

        return {
            embeds: [embed],
            components: [actionRowBuilder]
        }
    }

    private createWatchEmbed(watch: Watch) {
        const { filter, category, query, user } = watch
        const embed = new EmbedBuilder()

        const filterDisplayName = filter != null ? NyaaFilterDisplayNames.get(filter) ?? `Error (${filter})` : null
        const categoryDisplayName = category != null ? NyaaCategoryDisplayNames.get(category) ?? `Error (${category})` : null

        const embedFieldData: APIEmbedField[] = [{ name: 'Query', value: query, inline: true }]

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

        const description = `The following search is now being watched. Enter ${inlineCode('/unwatch')} followed by ${inlineCode(watch.id)} to stop watching for changes.`
        embed.setDescription(description)

        return embed
    }
}