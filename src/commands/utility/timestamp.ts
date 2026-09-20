import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
} from 'discord.js';

import type { Command } from '../../types/command.js';

const data = new SlashCommandBuilder()
  .setName('timestamp')
  .setDescription('Generate Discord timestamp formats.');

data.addStringOption((option) =>
  option
    .setName('datetime')
    .setDescription('Date/time, e.g. 2026-12-25 18:30')
    .setRequired(true),
);

const command: Command = {
  data,

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const input = interaction.options.getString('datetime', true).trim();

    const parsedDate = new Date(input);

    if (Number.isNaN(parsedDate.getTime())) {
      await interaction.reply({
        content:
          '❌ Invalid date/time. Example: `2026-12-25 18:30`',
        ephemeral: true,
      });

      return;
    }

    const unixTimestamp = Math.floor(parsedDate.getTime() / 1000);

    const formats = [
      {
        name: 'Short Time',
        code: 't',
        value: `<t:${unixTimestamp}:t>`,
      },
      {
        name: 'Long Time',
        code: 'T',
        value: `<t:${unixTimestamp}:T>`,
      },
      {
        name: 'Short Date',
        code: 'd',
        value: `<t:${unixTimestamp}:d>`,
      },
      {
        name: 'Long Date',
        code: 'D',
        value: `<t:${unixTimestamp}:D>`,
      },
      {
        name: 'Short Date/Time',
        code: 'f',
        value: `<t:${unixTimestamp}:f>`,
      },
      {
        name: 'Long Date/Time',
        code: 'F',
        value: `<t:${unixTimestamp}:F>`,
      },
      {
        name: 'Relative Time',
        code: 'R',
        value: `<t:${unixTimestamp}:R>`,
      },
    ];

    const embed = new EmbedBuilder()
      .setTitle('⏱️ Discord Timestamp Generator')
      .addFields(
        {
          name: '📅 Input',
          value: `\`${input}\``,
          inline: false,
        },
        {
          name: '🔢 Unix Timestamp',
          value: `\`${unixTimestamp}\``,
          inline: false,
        },
        ...formats.map((format) => ({
          name: `${format.name} — \`<t:${unixTimestamp}:${format.code}>\``,
          value: format.value,
          inline: true,
        })),
      )
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