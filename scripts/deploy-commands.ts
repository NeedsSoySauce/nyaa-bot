import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v9';
import { search, debug } from '../src/commands/index.js';
import { getEnvironmentVariable } from '../src/env.js';

const applicationId = getEnvironmentVariable('DISCORD_APPLICATION_ID');
const guildId = getEnvironmentVariable('DISCORD_GUILD_ID');

const rest = new REST({ version: '9' }).setToken(getEnvironmentVariable('DISCORD_TOKEN'));

const commands = [search, debug];

try {
	console.log('Started refreshing application (/) commands.');

	await rest.put(
		Routes.applicationGuildCommands(applicationId, guildId),
		{ body: commands.map(command => command.builder.toJSON()) },
	);

	console.log('Successfully reloaded application (/) commands.');
} catch (error) {
	console.error(error);
}