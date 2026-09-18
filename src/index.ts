import { createClient } from './client.js';
import { loadCommands } from './handlers/commandHandler.js';
import { registerInteractionEvent } from './events/interactionCreate.js';
import { registerReadyEvent } from './events/ready.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';
import { checkDatabaseConnection } from './database/database.js';
import { startAnnouncementScheduler } from './services/announcementScheduler.js';

async function main(): Promise<void> {
  const commands = await loadCommands();

  const client = createClient();

  registerReadyEvent(client);
  registerInteractionEvent(client, commands);

  await checkDatabaseConnection();

  await client.login(env.discordToken);
  startAnnouncementScheduler(client);
}

main().catch((error: unknown) => {
  console.error('\n❌ FATAL STARTUP ERROR:\n', error);
  logger.error('Fatal startup error');
  process.exit(1);
});