import { SlashCommandBuilder } from '@discordjs/builders';
import { CommandInteraction } from 'discord.js';
import { search } from './search.js';
import { debug } from './debug.js'

export interface Command {
    builder: SlashCommandBuilder,
    execute(interaction: CommandInteraction): Promise<void>
}

export { search, debug };
