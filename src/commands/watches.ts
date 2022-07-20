import { ActionRowBuilder, bold, ButtonBuilder, ButtonInteraction, ButtonStyle, ChatInputCommandInteraction, EmbedBuilder, inlineCode, MessageActionRowComponentBuilder, MessagePayload, SlashCommandBuilder, WebhookEditMessageOptions } from 'discord.js';
import { Watch } from '../models/watch.js';
import { NyaaCategoryDisplayNames, NyaaFilterDisplayNames } from '../services/nyaaClient.js';
import { WatchRepository } from '../services/watchRepository.js';
import { PagedResult } from '../types.js';
import { error, notNull } from '../util.js';
import { BaseCommand } from './base.js';
import { CommandTypes } from './index.js';

export class WatchesCommand extends BaseCommand {
    public commandTypes: CommandTypes = {
        isSlashCommand: true,
        isButtonCommand: true
    };

    private watchRepository: WatchRepository;

    public constructor(watchRepository: WatchRepository) {
        super()
        this.watchRepository = watchRepository;
    }

    public createSlashCommandBuilder() {
        return new SlashCommandBuilder().setName("watches").setDescription("List active watches")
    }

    public isButtonCommandExecutor(customId: string): boolean {
        return customId === 'watches-previous' || customId === 'watches-next'
    }

    public async executeSlashCommand(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply({ ephemeral: true })

        const page = await this.watchRepository.getWatches({ userId: interaction.user.id })

        const message = this.createMessage(page)

        await interaction.editReply(message)
    }

    public async executeButtonCommand(interaction: ButtonInteraction): Promise<void> {
        await interaction.deferUpdate()

        const embed = interaction.message.embeds[0]

        if (!embed.fields || !embed.footer) {
            throw Error("Invalid embed type")
        }

        const pagingParameters = embed.footer ? this.parsePagingParameters(embed.footer.text) : error("Paging text not found")
        pagingParameters.pageNumber += interaction.customId === 'watches-next' ? 1 : -1

        const page = await this.watchRepository.getWatches({
            ...pagingParameters,
            userId: interaction.user.id
        })

        const message = this.createMessage(page)

        await interaction.editReply(message);
    }

    private parsePagingParameters(text: string) {
        const parts = text.split(' ')
        const pageStart = Number(parts[1])
        const offset = pageStart - 1
        const pageNumber = offset / 10
        return {
            pageNumber,
            pageSize: 10
        }
    }

    private formatItem(item: Watch, prefix: string) {
        const filterDisplayName = item.filter ? NyaaFilterDisplayNames.get(item.filter) : null
        const categoryDisplayName = item.category ? NyaaCategoryDisplayNames.get(item.category) : null
        const properties = [ item.query, filterDisplayName, categoryDisplayName, item.user ].filter(notNull)
        return `${bold(prefix)}${properties.join(', ')} [${item.id}]`
    }

    private createMessage(page: PagedResult<Watch>): string | MessagePayload | WebhookEditMessageOptions {
        const { items } = page

        const embed = new EmbedBuilder().setTimestamp()

        const offset = page.pageNumber * page.pageSize
        const pageStart = Math.min(offset + 1, page.total)
        const pageEnd = Math.min(offset + page.pageSize, page.total)
        embed.setFooter({ text: `Showing ${pageStart} to ${pageEnd} of ${page.total} results` })

        const resultText = items.map((value, i) => this.formatItem(value, `${i + pageStart}. `)).join('\n')
        const description = `Active watches are listed below with IDs in [square brackets].\n\nUse ${inlineCode('/unwatch')} to remove a watch.\n\n${resultText}`
        embed.setDescription(description)

        const next = new ActionRowBuilder<MessageActionRowComponentBuilder>()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('watches-previous')
                    .setLabel('Previous page')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(!page.hasPrevious),
                new ButtonBuilder()
                    .setCustomId('watches-next')
                    .setLabel('Next page')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(!page.hasNext),
            );

        return ({
            embeds: [embed],
            components: [next]
        })
    }
}