import { EmbedFieldData } from 'discord.js';

const ZERO_WIDTH_SPACE = '\u200B'

export const EMBED_SPACER: EmbedFieldData = { name: ZERO_WIDTH_SPACE, value: ZERO_WIDTH_SPACE, inline: true }
export const INLINE_EMBED_SPACER: EmbedFieldData = { ...EMBED_SPACER, inline: true }