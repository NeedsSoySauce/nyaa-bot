import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v9';
import { MongoClient } from 'mongodb';
import { EOL } from 'os';
import { DebugSlashCommand, SearchSlashCommand } from '../src/commands/index.js';
import { getEnvironmentVariable } from '../src/env.js';
import { CommandRepository, DatabaseCommandRepository } from '../src/services/commandRepository.js';
import { DatabaseUserRepository, UserRepository } from '../src/services/userRepository.js';

const applicationId = getEnvironmentVariable('DISCORD_APPLICATION_ID');
const guildId = getEnvironmentVariable('DISCORD_GUILD_ID');

const rest = new REST({ version: '9' }).setToken(getEnvironmentVariable('DISCORD_TOKEN'));

const databaseUrl = getEnvironmentVariable("DATABASE_URL")
const mongoClient = new MongoClient(databaseUrl);
const db = mongoClient.db("nyaaDB");

const userRepository: UserRepository = new DatabaseUserRepository(db)
const commandRepository: CommandRepository = new DatabaseCommandRepository(db)

const commands = [new DebugSlashCommand(), new SearchSlashCommand(userRepository, commandRepository)]

const main = async () => {
	try {
		console.log('Started refreshing application (/) commands.');

		const builders = commands.map(c => c.createBuilder())

		console.log(`Found ${commands.length} command(s):`)
		console.log(`${builders.map(builder => `/${ builder.name}`).join(EOL)}`)

		await rest.put(
			Routes.applicationGuildCommands(applicationId, guildId),
			{ body: builders.map(builder => builder.toJSON()) },
		);

		console.log('Successfully reloaded application (/) commands.');
	} catch (error) {
		console.error(error);
	}
}

mongoClient.connect(async err => {
	if (err) {
	  console.error(err)
	} else {
	  main()
	}
  });

main()