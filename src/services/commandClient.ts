import { bold, hyperlink } from '@discordjs/builders';
import { ButtonInteraction, Client, ClientOptions, Collection, CommandInteraction, Interaction, Message, MessageEmbed } from 'discord.js';
import { Command } from '../commands/index.js';
import { Watch } from '../models/watch.js';
import { NyaaSearchResult } from './nyaaClient.js';

export interface NyaaNotificationService {
    notifyWatchChanged(userId: string, changes: [Watch, NyaaSearchResult[]][]): Promise<void>
}

export interface CommandClientConstructorParameters extends ClientOptions {
    commands?: Command[];
}

export class CommandClient extends Client implements NyaaNotificationService {
    public buttonCommands: Command[] = []
    public slashCommands: Collection<string, Command> = new Collection()

    public constructor(params: CommandClientConstructorParameters) {
        super(params)
        if (params.commands) {
            this.registerCommands(params.commands)
        }
        this.on('interactionCreate', this.handleInteraction.bind(this))
        this.on('messageCreate', this.handleMessageCreate.bind(this))
        this.on('ready', this.handleReady.bind(this))
    }

    public registerCommands(commands: Command[]) {
        commands.forEach(command => {
            const { isButtonCommand, isSlashCommand } = command.commandTypes
            if (isButtonCommand) this.buttonCommands.push(command)
            if (!isSlashCommand) return;
            const builder = command.createSlashCommandBuilder()
            if (!builder) return;
            this.slashCommands.set(builder.name, command)
        })
    }

    private async handleButtonInteraction(interaction: ButtonInteraction): Promise<void> {
        const command = this.buttonCommands.find(c => c.isButtonCommandExecutor(interaction.customId))
        try {
            await command?.executeButtonCommand(interaction)
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
        }
    }

    private async handleCommandInteraction(interaction: CommandInteraction): Promise<void> {
        const command = this.slashCommands.get(interaction.commandName)
        try {
            await command?.executeSlashCommand(interaction)
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
        }
    }

    private async handleInteraction(interaction: Interaction) {
        if (interaction.isButton()) {
            await this.handleButtonInteraction(interaction)
        } else if (interaction.isCommand()) {
            await this.handleCommandInteraction(interaction)
        }
    }

    private async handleMessageCreate(message: Message) {
        const prefix = '!nyaa';
        if (message.author.id === this.user?.id) return;
        if (!message.content.startsWith(prefix)) return;
        message.channel.send(`${message.author} (=｀ω´=)`,);
    }

    private async handleReady() {
        console.log(`Logged in as ${this.user?.tag}!`);
    }

    public async notifyWatchChanged(userId: string, changes: [Watch, NyaaSearchResult[]][]): Promise<void> {
        const user = await this.users.fetch(userId)

        const embed = new MessageEmbed()

        const results = changes.flatMap(c => c[1])

        const description = results
            .map(result => ` ${bold('•')} ${hyperlink(result.title, result.guid)}`)
            .join('\n')
        embed.setDescription(description)

        user.send({
            embeds: [embed]
        })
    }
}