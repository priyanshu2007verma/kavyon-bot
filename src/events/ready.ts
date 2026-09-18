import type { Client } from 'discord.js';

import { ensureGuild } from '../database/repositories/guildRepository.js';
import { logger } from '../utils/logger.js';

export function registerReadyEvent(client: Client): void {
  client.once('ready', async (readyClient) => {
    logger.info(`Logged in as ${readyClient.user.tag}`);
    logger.info(`Serving ${readyClient.guilds.cache.size} guild(s).`);

    for (const guild of readyClient.guilds.cache.values()) {
      try {
        await ensureGuild(guild.id, guild.name);

        logger.info(`Database initialized for guild: ${guild.name}`);
      } catch (error) {
        logger.error(
          `Failed to initialize database for guild: ${guild.name}`,
          error,
        );
      }
    }
  });
}