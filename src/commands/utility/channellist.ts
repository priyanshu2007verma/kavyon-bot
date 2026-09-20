import {
  ChannelType,
  ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
} from 'discord.js';

import type { Command } from '../../types/command.js';

const data = new SlashCommandBuilder()
  .setName('channel-list')
  .setDescription('View the channels in this server.');

const channelTypeNames: Partial<Record<ChannelType, string>> = {
  [ChannelType.GuildText]: 'Text',
  [ChannelType.GuildVoice]: 'Voice',
  [ChannelType.GuildCategory]: 'Category',
  [ChannelType.GuildAnnouncement]: 'Announcement',
  [ChannelType.GuildStageVoice]: 'Stage',
  [ChannelType.GuildForum]: 'Forum',
  [ChannelType.GuildMedia]: 'Media',
};

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

    const allChannels = interaction.guild.channels.cache;

    const categories = allChannels.filter(
      (channel) => channel.type === ChannelType.GuildCategory,
    );

    const uncategorized = allChannels.filter(
      (channel) => channel.parentId === null,
    );

    const sections: string[] = [];

    const sortedCategories = [...categories.values()].sort((a, b) =>
      a.name.localeCompare(b.name),
    );

    for (const category of sortedCategories) {
      const channels = allChannels.filter(
        (channel) => channel.parentId === category.id,
      );

      const sortedChannels = [...channels.values()].sort((a, b) =>
        a.name.localeCompare(b.name),
      );

      if (sortedChannels.length === 0) {
        sections.push(`### 📁 ${category.name}\n*Empty*`);
        continue;
      }

      const lines = sortedChannels.map((channel) => {
        const type = channelTypeNames[channel.type] ?? 'Unknown';

        return `• ${channel} — \`${type}\``;
      });

      sections.push(`### 📁 ${category.name}\n${lines.join('\n')}`);
    }

    const sortedUncategorized = [...uncategorized.values()].sort((a, b) =>
      a.name.localeCompare(b.name),
    );

    if (sortedUncategorized.length > 0) {
      const lines = sortedUncategorized.map((channel) => {
        const type = channelTypeNames[channel.type] ?? 'Unknown';

        return `• ${channel} — \`${type}\``;
      });

      sections.push(`### 📂 Uncategorized\n${lines.join('\n')}`);
    }

    if (sections.length === 0) {
      await interaction.reply({
        content: '❌ No channels were found.',
        ephemeral: true,
      });

      return;
    }

    const chunks: string[] = [];
    let currentChunk = '';

    for (const section of sections) {
      const separator = currentChunk ? '\n\n' : '';
      const nextChunk = currentChunk + separator + section;

      if (nextChunk.length > 3900) {
        if (currentChunk) {
          chunks.push(currentChunk);
        }

        currentChunk = section;
      } else {
        currentChunk = nextChunk;
      }
    }

    if (currentChunk) {
      chunks.push(currentChunk);
    }

    const embeds = chunks.slice(0, 10).map((chunk, index) =>
      new EmbedBuilder()
        .setTitle(
          `📺 Server Channels${
            chunks.length > 1 ? ` — Page ${index + 1}/${chunks.length}` : ''
          }`,
        )
        .setDescription(chunk)
        .setFooter({
          text: `Requested by ${interaction.user.username}`,
        })
        .setTimestamp(),
    );

    await interaction.reply({
      embeds,
    });
  },
};

export default command;