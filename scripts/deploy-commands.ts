import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v9';
import { EOL } from 'os';
import { debug, search } from '../src/commands/index.js';
import { getEnvironmentVariable } from '../src/env.js';

const applicationId = getEnvironmentVariable('DISCORD_APPLICATION_ID');
const guildId = getEnvironmentVariable('DISCORD_GUILD_ID');

const rest = new REST({ version: '9' }).setToken(getEnvironmentVariable('DISCORD_TOKEN'));

const commands = [search, debug];

const main = async () => {
	try {
		console.log('Started refreshing application (/) commands.');

		console.log(`Found ${commands.length} command(s):`)
		console.log(`${commands.map(c => `/${  c.builder.name}`).join(EOL)}`)

		await rest.put(
			Routes.applicationGuildCommands(applicationId, guildId),
			{ body: commands.map(command => command.builder.toJSON()) },
		);

		console.log('Successfully reloaded application (/) commands.');
	} catch (error) {
		console.error(error);
	}
}

main()