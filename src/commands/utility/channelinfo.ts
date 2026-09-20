import {
  ChannelType,
  ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
} from 'discord.js';

import type { Command } from '../../types/command.js';

const data = new SlashCommandBuilder()
  .setName('channelinfo')
  .setDescription('View information about a server channel.');

data.addChannelOption((option) =>
  option
    .setName('channel')
    .setDescription('The channel to inspect.')
    .setRequired(true),
);

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

    const channel = interaction.options.getChannel('channel');

    if (!channel) {
      await interaction.reply({
        content: '❌ That channel could not be found.',
        ephemeral: true,
      });

      return;
    }

    const channelTypeMap: Record<number, string> = {
      [ChannelType.GuildText]: 'Text Channel',
      [ChannelType.GuildVoice]: 'Voice Channel',
      [ChannelType.GuildCategory]: 'Category',
      [ChannelType.GuildAnnouncement]: 'Announcement Channel',
      [ChannelType.GuildStageVoice]: 'Stage Channel',
      [ChannelType.GuildForum]: 'Forum Channel',
      [ChannelType.GuildMedia]: 'Media Channel',
    };

    const channelType =
      channelTypeMap[channel.type] ?? 'Unknown Channel Type';

    const parentName =
      'parent' in channel && channel.parent
        ? channel.parent.name
        : 'None';

    const topic =
      'topic' in channel && typeof channel.topic === 'string'
        ? channel.topic
        : 'None';

    const slowmode =
      'rateLimitPerUser' in channel &&
      typeof channel.rateLimitPerUser === 'number'
        ? `${channel.rateLimitPerUser} seconds`
        : 'Not applicable';

    const nsfw =
      'nsfw' in channel && typeof channel.nsfw === 'boolean'
        ? channel.nsfw
          ? 'Yes'
          : 'No'
        : 'Not applicable';

    const embed = new EmbedBuilder()
      .setTitle(`📺 ${channel.name}`)
      .addFields(
        {
          name: '🆔 Channel ID',
          value: `\`${channel.id}\``,
          inline: true,
        },
        {
          name: '📁 Type',
          value: channelType,
          inline: true,
        },
        {
          name: '📌 Position',
          value:
            'position' in channel
              ? String(channel.position)
              : 'Not available',
          inline: true,
        },
        {
          name: '🗂️ Category',
          value: parentName,
          inline: true,
        },
        {
          name: '🐌 Slowmode',
          value: slowmode,
          inline: true,
        },
        {
          name: '🔞 NSFW',
          value: nsfw,
          inline: true,
        },
        {
          name: '📝 Topic',
          value: topic,
          inline: false,
        },
        {
          name: '🔗 Mention',
          value:
            'isTextBased' in channel && channel.isTextBased()
              ? `<#${channel.id}>`
              : 'Not mentionable',
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