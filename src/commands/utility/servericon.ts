import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
} from 'discord.js';

import type { Command } from '../../types/command.js';

const data = new SlashCommandBuilder()
  .setName('servericon')
  .setDescription('View the server icon.');

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

    const iconUrl = interaction.guild.iconURL({
      size: 4096,
      extension: 'png',
    });

    if (!iconUrl) {
      await interaction.reply({
        content: '❌ This server does not have an icon.',
        ephemeral: true,
      });

      return;
    }

    const embed = new EmbedBuilder()
      .setTitle(`🖼️ ${interaction.guild.name}`)
      .setImage(iconUrl)
      .addFields({
        name: '🌐 Icon URL',
        value: iconUrl,
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