import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v9';
import { Intents } from 'discord.js';
import { MongoClient } from 'mongodb';
import { EOL } from 'node:os';
import { CommandClient } from './commandClient.js';
import { HelpSlashCommand } from './commands/help.js';
import { Command, DebugSlashCommand, SearchSlashCommand } from './commands/index.js';
import { UnwatchCommand } from './commands/unwatch.js';
import { WatchesCommand } from './commands/watches.js';
import { getEnvironmentVariable } from './env.js';
import { CommandRepository, DatabaseCommandRepository } from './services/commandRepository.js';
import { NyaaClient } from './services/nyaa.js';
import { DatabaseUserRepository, UserRepository } from './services/userRepository.js';
import { DatabaseWatchRepository, WatchRepository } from './services/watchRepository.js';
import { notNull } from './util.js';

const databaseUrl = getEnvironmentVariable("DATABASE_URL")
const mongoClient = new MongoClient(databaseUrl);
const db = mongoClient.db("nyaaDB");

const deployCommands = async (commands: Command[]) => {
  const applicationId = getEnvironmentVariable('DISCORD_APPLICATION_ID');
  const guildId = getEnvironmentVariable('DISCORD_GUILD_ID');

  const rest = new REST({ version: '9' }).setToken(getEnvironmentVariable('DISCORD_TOKEN'));

    try {
      console.log('Started refreshing application (/) commands.');

      const builders = commands.map(c => c.createSlashCommandBuilder()).filter(notNull)

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
    process.exit(0)
}

const startCommandClient = (commands: Command[]) => {
  const commandClient = new CommandClient({
      intents: [
          Intents.FLAGS.GUILDS,
          Intents.FLAGS.DIRECT_MESSAGES,
          Intents.FLAGS.DIRECT_MESSAGE_REACTIONS,
          Intents.FLAGS.GUILD_MESSAGES,
          Intents.FLAGS.GUILD_MESSAGE_REACTIONS
      ],
      partials: ["CHANNEL"],
      commands
  });

  commandClient.login(process.env.DISCORD_TOKEN);
}

const main = async () => {
  const nyaaClient = new NyaaClient()
  const userRepository: UserRepository = new DatabaseUserRepository(db)
  const commandRepository: CommandRepository = new DatabaseCommandRepository(db)
  const watchRepository: WatchRepository = new DatabaseWatchRepository(db)

  const commands: Command[] = [
    new DebugSlashCommand(),
    new SearchSlashCommand(nyaaClient, userRepository, commandRepository, watchRepository),
    new WatchesCommand(watchRepository),
    new UnwatchCommand(watchRepository)
  ]

  const helpCommand = new HelpSlashCommand(commands)
  commands.push(helpCommand)

  if (process.argv.some(value => value === 'deploy-commands')) {
    await deployCommands(commands)
  } else {
    startCommandClient(commands);
  }
}

mongoClient.connect(async err => {
  if (err) {
    console.error(err)
  } else {
    await main()
  }
});