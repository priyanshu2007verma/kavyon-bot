import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
} from 'discord.js';

import { getGuildConfig } from '../../services/guildConfigService.js';

const command = {
  data: new SlashCommandBuilder()
    .setName('configtest')
    .setDescription('Test Kavyon server configuration.'),

  async execute(
    interaction: ChatInputCommandInteraction,
  ): Promise<void> {
    if (!interaction.guild) {
      await interaction.reply({
        content: 'This command can only be used inside a server.',
        ephemeral: true,
      });

      return;
    }

    const config = await getGuildConfig(interaction.guild.id);

    if (!config) {
      await interaction.reply({
        content: 'No configuration was found for this server.',
        ephemeral: true,
      });

      return;
    }

    await interaction.reply({
      content: [
        '**Kavyon Configuration**',
        '',
        `Prefix: \`${config.prefix}\``,
        `Welcome: \`${config.welcomeEnabled}\``,
        `Welcome Channel: \`${config.welcomeChannelId ?? 'Not set'}\``,
        `Announcements Channel: \`${config.announcementsChannelId ?? 'Not set'}\``,
        `Logs Channel: \`${config.logsChannelId ?? 'Not set'}\``,
        `Moderation: \`${config.moderationEnabled}\``,
      ].join('\n'),
      ephemeral: true,
    });
  },
};

export default command;