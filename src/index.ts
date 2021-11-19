import { Client, Intents } from 'discord.js';
import { NyaaClient, NyaaCategory } from './nyaa.js';

const nyaa = new NyaaClient();

const client = new Client({
    intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.DIRECT_MESSAGES,
        Intents.FLAGS.DIRECT_MESSAGE_REACTIONS,
        Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
    ],
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

    if (interaction.commandName === 'ping') {
        await interaction.reply('Pong!');
    }
});

client.login(process.env.DISCORD_TOKEN);
