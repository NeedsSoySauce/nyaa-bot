import { ChatInputCommandInteraction, EmbedBuilder, inlineCode, InteractionReplyOptions, MessagePayload, SlashCommandBuilder } from 'discord.js';
import { notNull } from '../util.js';
import { BaseCommand } from './base.js';
import { Command, CommandTypes } from './index.js';

export class HelpSlashCommand extends BaseCommand {
    public commandTypes: CommandTypes = {
        isSlashCommand: true
    }

    private helpMessage: MessagePayload | InteractionReplyOptions

    public constructor(commands: Command[]) {
        super()
        this.helpMessage = this.createMessage(commands)
    }

    public createSlashCommandBuilder() {
        return new SlashCommandBuilder().setName("help").setDescription("List available commands");
    }

    public async executeSlashCommand(interaction: ChatInputCommandInteraction) {
        await interaction.reply(this.helpMessage)
    }

    private formatCommand(builder: Pick<SlashCommandBuilder, "toJSON" | "name" | "description">
    ) {
        const { name, description } = builder
        return `${inlineCode(`/${name}`)} - ${description}`
    }

    private createMessage(commands: Command[]): MessagePayload | InteractionReplyOptions {
        const embed = new EmbedBuilder()
        const description = commands
            .map(c => c.createSlashCommandBuilder())
            .filter(notNull)
            .sort((a, b) => a.name.localeCompare(b.name))
            .map(b => this.formatCommand(b))
            .join('\n')
        embed.setDescription(description)
        return { embeds: [embed], ephemeral: true }
    }
}