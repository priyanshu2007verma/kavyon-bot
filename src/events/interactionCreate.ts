import type {
  Client,
  ChatInputCommandInteraction,
  Interaction,
} from 'discord.js';

import { ensureUser } from '../database/repositories/userRepository.js';
import { logger } from '../utils/logger.js';

export function registerInteractionEvent(
  client: Client,
  commands: ReadonlyMap<
    string,
    {
      execute: (
        interaction: ChatInputCommandInteraction,
      ) => Promise<void>;
    }
  >,
): void {
  client.on('interactionCreate', async (interaction: Interaction) => {
    try {
      if (interaction.isChatInputCommand()) {
        if (interaction.guild) {
          await ensureUser(
            interaction.user.id,
            interaction.guild.id,
            interaction.user.username,
          );
        }

        const command = commands.get(interaction.commandName);

        if (!command) {
          await interaction.reply({
            content: 'That command is not available right now.',
            ephemeral: true,
          });

          return;
        }

        await command.execute(interaction);
        return;
      }

      if (
        interaction.isButton() &&
        interaction.customId === 'kavyon:help:modules'
      ) {
        await interaction.reply({
          content:
            'Module architecture is active. Database/configuration comes next, followed by moderation, announcements, resources, events, economy, tickets, founder tools, and optional AI.',
          ephemeral: true,
        });
      }
    } catch (error) {
      logger.error('Interaction failed', error);

      const message =
        'Something went wrong while processing that interaction. The issue has been logged.';

      if (interaction.isRepliable()) {
        if (interaction.replied || interaction.deferred) {
          await interaction
            .followUp({
              content: message,
              ephemeral: true,
            })
            .catch(() => undefined);
        } else {
          await interaction
            .reply({
              content: message,
              ephemeral: true,
            })
            .catch(() => undefined);
        }
      }
    }
  });
}