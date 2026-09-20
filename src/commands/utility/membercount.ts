import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
} from 'discord.js';

import type { Command } from '../../types/command.js';

const data = new SlashCommandBuilder()
  .setName('membercount')
  .setDescription('View the member count of this server.');

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

    const members = interaction.guild.members.cache;

    const totalMembers = interaction.guild.memberCount;

    const bots = members.filter((member) => member.user.bot).size;

    const humans = members.filter((member) => !member.user.bot).size;

    const online = members.filter(
      (member) =>
        member.presence?.status === 'online' ||
        member.presence?.status === 'idle' ||
        member.presence?.status === 'dnd',
    ).size;

    const offline = members.filter(
      (member) =>
        !member.presence ||
        member.presence.status === 'offline',
    ).size;

    const embed = new EmbedBuilder()
      .setTitle(`👥 ${interaction.guild.name}`)
      .setThumbnail(interaction.guild.iconURL({ size: 256 }))
      .addFields(
        {
          name: '👥 Total Members',
          value: totalMembers.toString(),
          inline: true,
        },
        {
          name: '👤 Humans',
          value: humans.toString(),
          inline: true,
        },
        {
          name: '🤖 Bots',
          value: bots.toString(),
          inline: true,
        },
        {
          name: '🟢 Online / Active',
          value: online.toString(),
          inline: true,
        },
        {
          name: '⚫ Offline',
          value: offline.toString(),
          inline: true,
        },
        {
          name: '📦 Cached Members',
          value: members.size.toString(),
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