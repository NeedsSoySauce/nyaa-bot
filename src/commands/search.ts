import { bold, hyperlink, SlashCommandBuilder } from '@discordjs/builders';
import { APIEmbed } from 'discord-api-types';
import { ButtonInteraction, CacheType, CommandInteraction, EmbedFieldData, MessageActionRow, MessageButton, MessageEmbed, MessagePayload, WebhookEditMessageOptions } from 'discord.js';
import { SearchCommand } from '../models/searchCommand.js';
import { User } from '../models/user.js';
import { Watch } from '../models/watch.js';
import { CommandRepository } from '../services/commandRepository.js';
import { NyaaCategory, NyaaCategoryDisplayNames, NyaaClient, NyaaFilter, NyaaFilterDisplayNames, NyaaSearchParameters, NyaaSearchResult, ReverseNyaaCategoryDisplayNames, ReverseNyaaFilterDisplayNames } from "../services/nyaa.js";
import { UserRepository } from "../services/userRepository.js";
import { WatchRepository } from '../services/watchRepository.js';
import { PagedResult } from '../types.js';
import { ellipsis, error } from '../util.js';
import { BaseCommand } from './base.js';
import { CommandOptionChoice, CommandTypes } from './index.js';

const filterChoices: CommandOptionChoice<number>[] = Array.from(NyaaFilterDisplayNames, ([filter, name]) => [name, filter])
const categoryChoices: CommandOptionChoice<string>[] = Array.from(NyaaCategoryDisplayNames, ([filter, name]) => [name, filter])

export interface SearchParameters extends NyaaSearchParameters {
    pageNumber: number;
    pageSize: number;
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

    public constructor(nyaaClient: NyaaClient, userRepository: UserRepository, commandRepository: CommandRepository, watchRepository: WatchRepository) {
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

    private getSearchParameters(interaction: CommandInteraction<CacheType>): SearchParameters {
        const query = interaction.options.getString('query', true)
        const filter = interaction.options.getInteger('filter') as NyaaFilter | null
        const category = interaction.options.getString('category') as NyaaCategory | null
        const user = interaction.options.getString('user')
        return { query, filter, category, user, pageNumber: 0, pageSize: 10 }
    }

    public isButtonCommandExecutor(id: string): boolean {
        return id === 'search-previous' || id === 'search-next' || id ==='search-watch'
    }

    public async executeButtonCommand(interaction: ButtonInteraction<CacheType>): Promise<void> {
        await interaction.deferUpdate()

        const embed = interaction.message.embeds[0]

        if (!embed.fields || !embed.footer) {
            throw Error("Invalid embed type")
        }

        const searchParameters = this.parseSearchParameters(embed)

        if (interaction.customId !== 'watch') {
            searchParameters.pageNumber += interaction.customId === 'next' ? 1 : -1
        }

        const page = await this.nyaaClient.search(searchParameters)

        const userId = interaction.user.id

        const command = new SearchCommand({ ...searchParameters, userId })

        if (interaction.customId === 'watch') {
            await this.watch(interaction.user.id, command);
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

    private async watch(userId: string, searchCommand: SearchCommand) {
        console.log('watch', searchCommand)
        return this.watchRepository.addOrUpdateWatch(new Watch(userId, { ...searchCommand, lastInfoHash: null }))
    }

    private parseSearchParameters(embed: Pick<MessageEmbed | APIEmbed, 'fields' | 'footer'>): SearchParameters {
        const query = embed.fields?.find(f => f.name === 'Query')?.value ?? error("'Query' field not found")
        const user = embed.fields?.find(f => f.name === 'User')?.value
        const filterDisplayName = embed.fields?.find(f => f.name === 'Filter')?.value
        const filter = filterDisplayName ? ReverseNyaaFilterDisplayNames.get(filterDisplayName) : null
        const categoryDisplayName = embed.fields?.find(f => f.name === 'Category')?.value
        const category = categoryDisplayName ? ReverseNyaaCategoryDisplayNames.get(categoryDisplayName) : null

        const pagingText = embed.footer?.text ?? error("Paging text not found")
        const pagingParamters = this.parsePagingParameters(pagingText)

        return {
            ...pagingParamters,
            query,
            user,
            filter,
            category
        }
    }

    private parsePagingParameters(text: string): Pick<SearchParameters, 'pageNumber' | 'pageSize'> {
        const parts = text.split(' ')
        const pageStart = Number(parts[1])
        const offset = pageStart - 1
        const pageNumber = offset / 10
        return {
            pageNumber,
            pageSize: 10
        }
    }

    private escapeMarkdown(text: string) {
        const characters = ['*', '_', '>', '`']
        return characters
            .reduce((prev, curr) => prev.replace(new RegExp(`\\${curr}`, 'g'), `\\${curr}`), text)
            .replace(/\[/g, '(')
            .replace(/\]/g, ')')
    }

    private formatItem(item: NyaaSearchResult, prefix: string) {
        const text = ellipsis(this.escapeMarkdown(item.title.trim()), 200)
        return `${bold(prefix)}${hyperlink(text, item.guid)}`
    }

    private createMessage(page: PagedResult<NyaaSearchResult>, searchParameters: SearchParameters): string | MessagePayload | WebhookEditMessageOptions {
        const { items } = page
        const { query, filter, category, user } = searchParameters

        const embed = new MessageEmbed().setTimestamp()

        const offset = page.pageNumber * page.pageSize
        const pageStart = Math.min(offset + 1, page.total)
        const pageEnd = Math.min(offset + page.pageSize, page.total)
        embed.setFooter(`Showing ${pageStart} to ${pageEnd} of ${page.total} results`)

        const filterDisplayName = filter != null ? NyaaFilterDisplayNames.get(filter) ?? `Error (${filter})` : null
        const categoryDisplayName = category != null ? NyaaCategoryDisplayNames.get(category) ?? `Error (${category})` : null

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

        const description = items.map((value, i) => this.formatItem(value, `${i + pageStart}. `)).join('\n')
        embed.setDescription(description)

        const next = new MessageActionRow()
            .addComponents(
                new MessageButton()
                    .setCustomId('search-previous')
                    .setLabel('Previous page')
                    .setStyle('PRIMARY')
                    .setDisabled(!page.hasPrevious),
                new MessageButton()
                    .setCustomId('search-next')
                    .setLabel('Next page')
                    .setStyle('PRIMARY')
                    .setDisabled(!page.hasNext),
                new MessageButton()
                    .setCustomId('search-watch')
                    .setLabel('Watch')
                    .setStyle('SECONDARY')
            );

        return ({
            embeds: [embed],
            components: [next]
        })
    }
}