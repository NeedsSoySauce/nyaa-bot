import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v10';
import { IntentsBitField, Partials } from 'discord.js';
import { MongoClient } from 'mongodb';
import { EOL } from 'node:os';
import { CommandClient } from './services/commandClient.js';
import { HelpSlashCommand } from './commands/help.js';
import { Command, DebugSlashCommand, SearchSlashCommand } from './commands/index.js';
import { UnwatchCommand } from './commands/unwatch.js';
import { WatchesCommand } from './commands/watches.js';
import { getEnvironmentVariable } from './env.js';
import { CommandRepository, DatabaseCommandRepository } from './services/commandRepository.js';
import { NyaaClient } from './services/nyaaClient.js';
import { DatabaseUserRepository, UserRepository } from './services/userRepository.js';
import { NyaaWatcher } from './services/nyaaWatcher.js';
import { DatabaseWatchRepository, WatchRepository } from './services/watchRepository.js';
import { notNull } from './util.js';

const databaseUrl = getEnvironmentVariable("DATABASE_URL")
const mongoClient = new MongoClient(databaseUrl);
const db = mongoClient.db();

const main = async () => {
  const nyaaClient = new NyaaClient()
  const userRepository: UserRepository = new DatabaseUserRepository(db)
  const commandRepository: CommandRepository = new DatabaseCommandRepository(db)
  const watchRepository: WatchRepository = new DatabaseWatchRepository(db)

  const slashCommands: Command[] = [
    new DebugSlashCommand(),
    new SearchSlashCommand({ nyaaClient, userRepository, commandRepository, watchRepository }),
    new WatchesCommand(watchRepository),
    new UnwatchCommand(watchRepository)
  ]

  const helpCommand = new HelpSlashCommand(slashCommands)
  slashCommands.push(helpCommand)

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

        await rest.put(
          Routes.applicationCommands(applicationId),
          { body: builders.map(builder => builder.toJSON()) },
        );

        console.log('Successfully reloaded application (/) commands.');
      } catch (error) {
        console.error(error);
      }
      process.exit(0)
  }

  const startApplication = async (commands: Command[]) => {
    const commandClient = new CommandClient({
        intents: new IntentsBitField("Guilds")
          .add("DirectMessages")
          .add('DirectMessageReactions')
          .add('GuildMessages')
          .add('GuildMessageTyping'),
        partials: [Partials.Channel],
        commands
    });
    const watcher = new NyaaWatcher({ nyaaClient, nyaaNotificationService: commandClient, watchRepository, userRepository })

    await commandClient.login(getEnvironmentVariable('DISCORD_TOKEN'));
    watcher.start()
  }

  if (process.argv.some(value => value === 'deploy-commands')) {
    await deployCommands(slashCommands)
  } else {
    await startApplication(slashCommands);
  }
}

mongoClient.connect(async err => {
  if (err) {
    console.error(err)
  } else {
    await main()
  }
});