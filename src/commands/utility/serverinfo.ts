import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
} from 'discord.js';

import type { Command } from '../../types/command.js';

const data = new SlashCommandBuilder()
  .setName('serverinfo')
  .setDescription('View information about this Discord server.');

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

    const guild = interaction.guild;

    const owner = await guild.fetchOwner().catch(() => null);

    const createdTimestamp = Math.floor(
      guild.createdTimestamp / 1000,
    );

    const memberCount = guild.memberCount;

    const channelCount = guild.channels.cache.size;

    const textChannels = guild.channels.cache.filter(
      (channel) => channel.isTextBased(),
    ).size;

    const voiceChannels = guild.channels.cache.filter(
      (channel) => channel.isVoiceBased(),
    ).size;

    const roleCount = guild.roles.cache.size - 1;

    const emojiCount = guild.emojis.cache.size;

    const embed = new EmbedBuilder()
      .setTitle(`🏠 ${guild.name}`)
      .setThumbnail(
        guild.iconURL({
          size: 256,
        }) ?? null,
      )
      .addFields(
        {
          name: '🆔 Server ID',
          value: `\`${guild.id}\``,
          inline: true,
        },
        {
          name: '👑 Owner',
          value: owner ? `<@${owner.id}>` : 'Unknown',
          inline: true,
        },
        {
          name: '👥 Members',
          value: memberCount.toString(),
          inline: true,
        },
        {
          name: '💬 Channels',
          value: channelCount.toString(),
          inline: true,
        },
        {
          name: '📝 Text Channels',
          value: textChannels.toString(),
          inline: true,
        },
        {
          name: '🔊 Voice Channels',
          value: voiceChannels.toString(),
          inline: true,
        },
        {
          name: '🎭 Roles',
          value: roleCount.toString(),
          inline: true,
        },
        {
          name: '😀 Emojis',
          value: emojiCount.toString(),
          inline: true,
        },
        {
          name: '🚀 Boost Level',
          value: String(guild.premiumTier),
          inline: true,
        },
        {
          name: '📅 Created',
          value: `<t:${createdTimestamp}:F>\n<t:${createdTimestamp}:R>`,
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
  },
};

export default command;