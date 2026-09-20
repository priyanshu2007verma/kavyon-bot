import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
} from 'discord.js';

import type { Command } from '../../types/command.js';

const data = new SlashCommandBuilder()
  .setName('serverbanner')
  .setDescription('View the server banner.');

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

    const bannerUrl = interaction.guild.bannerURL({
      size: 4096,
      extension: 'png',
    });

    if (!bannerUrl) {
      await interaction.reply({
        content: '❌ This server does not have a banner.',
        ephemeral: true,
      });

      return;
    }

    const embed = new EmbedBuilder()
      .setTitle(`🖼️ ${interaction.guild.name} — Server Banner`)
      .setImage(bannerUrl)
      .addFields({
        name: '🌐 Banner URL',
        value: bannerUrl,
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