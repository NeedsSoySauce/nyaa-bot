import { SlashCommandBuilder } from '@discordjs/builders';
import { CommandInteraction, MessageEmbed, MessagePayload, WebhookEditMessageOptions } from 'discord.js';
import { Watch } from '../models/watch.js';
import { WatchRepository } from '../services/watchRepository.js';
import { BaseCommand } from './base.js';
import { CommandTypes } from './index.js';

export class UnwatchCommand extends BaseCommand {
    public commandTypes: CommandTypes = {
        isSlashCommand: true
    };

    private watchRepository: WatchRepository;

    public constructor(watchRepository: WatchRepository) {
        super()
        this.watchRepository = watchRepository;
    }

    public createSlashCommandBuilder() {
        return new SlashCommandBuilder()
            .setName("unwatch")
            .setDescription("Remove an active watch")
            .addStringOption(option =>
                option.setName('id')
                    .setDescription("Watch ID, e.g. '61a376d5dd50f0a4ac703188'.")
                    .setRequired(true))
    }

    public async executeSlashCommand(interaction: CommandInteraction) {
        await interaction.deferReply({ ephemeral: true })

        const watchId = interaction.options.getString('id', true)
        const watch = await this.watchRepository.deleteWatch(interaction.user.id, watchId)

        const message = this.createMessage(watchId, watch)

        await interaction.editReply(message)
    }

    private createMessage(watchId: string, watch: Watch | null): string | MessagePayload | WebhookEditMessageOptions {
        const embed = new MessageEmbed()

        const description = watch ? `Deleted watch ${watch.id}.` : `No watch with ID '${watchId}' was found.`
        embed.setDescription(description)

        return ({
            embeds: [embed]
        })
    }
}