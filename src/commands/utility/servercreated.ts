import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
} from 'discord.js';

import type { Command } from '../../types/command.js';

const data = new SlashCommandBuilder()
  .setName('server-created')
  .setDescription('View when this server was created.');

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

    const createdAt = interaction.guild.createdAt;
    const createdTimestamp = Math.floor(createdAt.getTime() / 1000);

    const now = Date.now();
    const ageInDays = Math.floor(
      (now - createdAt.getTime()) / (1000 * 60 * 60 * 24),
    );

    const years = Math.floor(ageInDays / 365);
    const remainingDays = ageInDays % 365;
    const months = Math.floor(remainingDays / 30);
    const days = remainingDays % 30;

    const ageParts: string[] = [];

    if (years > 0) {
      ageParts.push(`${years} year${years === 1 ? '' : 's'}`);
    }

    if (months > 0) {
      ageParts.push(`${months} month${months === 1 ? '' : 's'}`);
    }

    if (days > 0 || ageParts.length === 0) {
      ageParts.push(`${days} day${days === 1 ? '' : 's'}`);
    }

    const embed = new EmbedBuilder()
      .setTitle(`📅 ${interaction.guild.name}`)
      .addFields(
        {
          name: '🆔 Server ID',
          value: `\`${interaction.guild.id}\``,
          inline: true,
        },
        {
          name: '📅 Created',
          value: `<t:${createdTimestamp}:F>`,
          inline: true,
        },
        {
          name: '⏳ Age',
          value: ageParts.join(', '),
          inline: true,
        },
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