import { createClient } from './client.js';
import { loadCommands } from './handlers/commandHandler.js';
import { registerInteractionEvent } from './events/interactionCreate.js';
import { registerReadyEvent } from './events/ready.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';
import { checkDatabaseConnection } from './database/database.js';
import { startAnnouncementScheduler } from './services/announcementScheduler.js';
import { REST, Routes } from 'discord.js';

async function registerCommands(commands: Map<string, { data: any }>): Promise<void> {
  const body = [...commands.values()].map((command) => command.data.toJSON());
  const rest = new REST({ version: '10' }).setToken(env.discordToken);

  if (env.discordGuildId) {
    logger.info(`Registering ${body.length} guild command(s) to ${env.discordGuildId}.`);
    await rest.put(Routes.applicationGuildCommands(env.discordClientId, env.discordGuildId), { body });
    logger.info('Guild command registration complete.');
    return;
  }

  logger.info(`Registering ${body.length} global command(s).`);
  await rest.put(Routes.applicationCommands(env.discordClientId), { body });
  logger.info('Global command registration complete.');
}

async function main(): Promise<void> {
  const commands = await loadCommands();

  const client = createClient();

  registerReadyEvent(client);
  registerInteractionEvent(client, commands);

  await checkDatabaseConnection();

  await client.login(env.discordToken);
  startAnnouncementScheduler(client);

  try {
    await registerCommands(commands);
  } catch (err) {
    logger.warn('Command registration at startup failed, continuing', err);
  }
}

main().catch((error: unknown) => {
  console.error('\n❌ FATAL STARTUP ERROR:\n', error);
  logger.error('Fatal startup error');
  process.exit(1);
});