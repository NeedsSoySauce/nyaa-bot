import Collection from '@discordjs/collection';
import { Client, Intents } from 'discord.js';
import { Sequelize } from 'sequelize';
import { Command, debug, search } from './commands/index.js';
import { NyaaCategory, NyaaClient } from './nyaa.js';

class CommandClient extends Client {
    public commands: Collection<string, Command> = new Collection()
}

const nyaa = new NyaaClient();

const client = new CommandClient({
    intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.DIRECT_MESSAGES,
        Intents.FLAGS.DIRECT_MESSAGE_REACTIONS,
        Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.GUILD_MESSAGE_REACTIONS
    ],
    partials: ["CHANNEL"]
});

client.on('ready', () => {
    console.log(`Logged in as ${client.user?.tag}!`);
});

client.on('messageCreate', (message) => {
    const prefix = '!nyaa ';
    if (message.author.id === client.user?.id) return;
    if (!message.content.startsWith(prefix)) return;

    const query = message.content.substring(prefix.length);

    console.log(`${message.author.username}#${message.author.discriminator}: ${message.content}`)

    nyaa.search({
        query,
        category: NyaaCategory.AllCategories,
    }).then((res) => {
        message.channel.send(
            `${message.author}, your search for '${query}' returned ${res.length} result(s).`,
        );
    });
});

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isCommand()) return;

    const command = client.commands.get(interaction.commandName)

    if (!command) return;

	try {
		await command.execute(interaction);
	} catch (error) {
		console.error(error);
		await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
	}
});

const commands = [search, debug]

commands.forEach(command => {
    client.commands.set(command.builder.name, command)
})

client.login(process.env.DISCORD_TOKEN);

const sequelize = new Sequelize('sqlite:./test.db')

try {
    await sequelize.authenticate();
    console.log('Connection has been established successfully.');
} catch (error) {
    console.error('Unable to connect to the database:', error);
}