import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
} from 'discord.js';

import type { Command } from '../../types/command.js';

const data = new SlashCommandBuilder()
  .setName('snowflake')
  .setDescription('Decode a Discord Snowflake ID.');

data.addStringOption((option) =>
  option
    .setName('id')
    .setDescription('The Discord Snowflake ID to decode.')
    .setRequired(true),
);

const DISCORD_EPOCH = 1420070400000n;

const command: Command = {
  data,

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const id = interaction.options.getString('id', true).trim();

    if (!/^\d{17,20}$/.test(id)) {
      await interaction.reply({
        content: '❌ Please provide a valid Discord Snowflake ID.',
        ephemeral: true,
      });

      return;
    }

    try {
      const snowflake = BigInt(id);

      const timestampMs =
        Number((snowflake >> 22n) + DISCORD_EPOCH);

      const createdAt = new Date(timestampMs);

      if (Number.isNaN(createdAt.getTime())) {
        throw new Error('Invalid timestamp');
      }

      const unixTimestamp = Math.floor(timestampMs / 1000);

      const embed = new EmbedBuilder()
        .setTitle('❄️ Discord Snowflake')
        .addFields(
          {
            name: '🆔 ID',
            value: `\`${id}\``,
            inline: false,
          },
          {
            name: '📅 Created',
            value: `<t:${unixTimestamp}:F>`,
            inline: true,
          },
          {
            name: '⏱️ Relative',
            value: `<t:${unixTimestamp}:R>`,
            inline: true,
          },
          {
            name: '🔢 Unix Timestamp',
            value: `\`${unixTimestamp}\``,
            inline: true,
          },
          {
            name: '🌐 ISO',
            value: `\`${createdAt.toISOString()}\``,
            inline: false,
          },
        )
        .setFooter({
          text: `Requested by ${interaction.user.username}`,
        })
        .setTimestamp();

      await interaction.reply({
        embeds: [embed],
      });
    } catch {
      await interaction.reply({
        content: '❌ That Snowflake ID could not be decoded.',
        ephemeral: true,
      });
    }
  },
};

export default command;