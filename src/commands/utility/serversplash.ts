import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
} from 'discord.js';

import type { Command } from '../../types/command.js';

const data = new SlashCommandBuilder()
  .setName('server-splash')
  .setDescription('View the server invite splash image.');

const command: Command = {
  data,

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!interaction.guild) {
      await interaction.reply({
        content: '❌ This command can only be used inside a server.',
        ephemeral: true,
      });

      return;
    }

    const splashUrl = interaction.guild.splashURL({
      size: 4096,
      extension: 'png',
    });

    if (!splashUrl) {
      await interaction.reply({
        content: '❌ This server does not have an invite splash image.',
        ephemeral: true,
      });

      return;
    }

    const embed = new EmbedBuilder()
      .setTitle(`🖼️ ${interaction.guild.name} — Server Splash`)
      .setImage(splashUrl)
      .addFields({
        name: '🌐 Splash URL',
        value: splashUrl,
        inline: false,
      })
      .setFooter({
        text: `Requested by ${interaction.user.username}`,
      })
      .setTimestamp();

    await interaction.reply({
      embeds: [embed],
    });
  },
};

export default command;