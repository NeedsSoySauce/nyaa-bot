import { Client, ClientOptions, Collection, Interaction, Message } from 'discord.js'
import { SlashCommand } from './commands/index.js'

export interface CommandClientConstructorParameters extends ClientOptions {
    commands?: SlashCommand[]
}

export class CommandClient extends Client {
    public commands: Collection<string, SlashCommand> = new Collection()

    public constructor(params: CommandClientConstructorParameters) {
        super(params)
        if (params.commands) {
            this.registerCommands(params.commands)
        }
        this.on('interactionCreate', this.handleInteraction.bind(this))
        this.on('messageCreate', this.handleMessageCreate.bind(this))
        this.on('ready', this.handleReady.bind(this))
    }

    public registerCommands(commands: SlashCommand[]) {
        commands.forEach(command => {
            this.commands.set(command.createBuilder().name, command)
        })
    }

    private async handleInteraction(interaction: Interaction) {
        if (!interaction.isCommand()) return;

        const command = this.commands.get(interaction.commandName)

        if (!command) return;

        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
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
}