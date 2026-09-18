import 'dotenv/config';
import { REST, Routes } from 'discord.js';
import { loadCommands } from '../src/handlers/commandHandler.js';
import { env } from '../src/config/env.js';
import { logger } from '../src/utils/logger.js';

async function main(): Promise<void> {
  const commands = await loadCommands();
  const body = [...commands.values()].map((command) => command.data.toJSON());

  const rest = new REST({ version: '10' }).setToken(env.discordToken);

  if (env.discordGuildId) {
    logger.info(`Registering ${body.length} guild command(s) to ${env.discordGuildId}.`);
    await rest.put(
      Routes.applicationGuildCommands(env.discordClientId, env.discordGuildId),
      { body },
    );
    logger.info('Guild command registration complete.');
    return;
  }

  logger.info(`Registering ${body.length} global command(s).`);
  await rest.put(Routes.applicationCommands(env.discordClientId), { body });
  logger.info('Global command registration complete.');
}

main().catch((error) => {
  logger.error('Command registration failed', error);
  process.exit(1);
});