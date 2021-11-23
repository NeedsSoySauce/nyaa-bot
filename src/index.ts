import { Intents } from 'discord.js';
import { MongoClient } from 'mongodb';
import { CommandClient } from './commandClient.js';
import { DebugSlashCommand, SearchSlashCommand } from './commands/index.js';
import { getEnvironmentVariable } from './env.js';
import { CommandRepository, DatabaseCommandRepository } from './services/commandRepository.js';
import { DatabaseUserRepository, UserRepository } from './services/userRepository.js';

const databaseUrl = getEnvironmentVariable("DATABASE_URL")
const mongoClient = new MongoClient(databaseUrl);
const db = mongoClient.db("nyaaDB");

const main = async () => {
  const userRepository: UserRepository = new DatabaseUserRepository(db)
  const commandRepository: CommandRepository = new DatabaseCommandRepository(db)

  const slashCommands = [new DebugSlashCommand(), new SearchSlashCommand(userRepository, commandRepository)]

  const commandClient = new CommandClient({
      intents: [
          Intents.FLAGS.GUILDS,
          Intents.FLAGS.DIRECT_MESSAGES,
          Intents.FLAGS.DIRECT_MESSAGE_REACTIONS,
          Intents.FLAGS.GUILD_MESSAGES,
          Intents.FLAGS.GUILD_MESSAGE_REACTIONS
      ],
      partials: ["CHANNEL"],
      commands: slashCommands
  });

  commandClient.login(process.env.DISCORD_TOKEN);
}

mongoClient.connect(async err => {
  if (err) {
    console.error(err)
  } else {
    main()
  }
});
