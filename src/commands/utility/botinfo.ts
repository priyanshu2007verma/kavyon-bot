import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
} from 'discord.js';

import type { Command } from '../../types/command.js';

const data = new SlashCommandBuilder()
  .setName('botinfo')
  .setDescription('View information about Kavyon.');

const command: Command = {
  data,

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const client = interaction.client;

    const uptimeSeconds = Math.floor(client.uptime / 1000);

    const days = Math.floor(uptimeSeconds / 86400);
    const hours = Math.floor((uptimeSeconds % 86400) / 3600);
    const minutes = Math.floor((uptimeSeconds % 3600) / 60);
    const seconds = uptimeSeconds % 60;

    const uptime = [
      days > 0 ? `${days}d` : null,
      hours > 0 ? `${hours}h` : null,
      minutes > 0 ? `${minutes}m` : null,
      `${seconds}s`,
    ]
      .filter(Boolean)
      .join(' ');

    const memoryUsage = process.memoryUsage();

    const memoryMb = (
      memoryUsage.rss /
      1024 /
      1024
    ).toFixed(1);

    const createdTimestamp = Math.floor(
      client.user.createdTimestamp / 1000,
    );

    const embed = new EmbedBuilder()
      .setTitle('🤖 Kavyon')
      .setThumbnail(
        client.user.displayAvatarURL({
          size: 256,
        }),
      )
      .setDescription(
        'Kavyon — modular Discord infrastructure for the Kavyon community.',
      )
      .addFields(
        {
          name: '🏷️ Bot',
          value: client.user.tag,
          inline: true,
        },
        {
          name: '🆔 Bot ID',
          value: `\`${client.user.id}\``,
          inline: true,
        },
        {
          name: '🏠 Servers',
          value: client.guilds.cache.size.toString(),
          inline: true,
        },
        {
          name: '👥 Cached Users',
          value: client.users.cache.size.toString(),
          inline: true,
        },
        {
          name: '📚 Loaded Commands',
          value: 'Available through the command handler',
          inline: true,
        },
        {
          name: '⚙️ Discord.js',
          value: '14.x',
          inline: true,
        },
        {
          name: '🟢 Uptime',
          value: uptime,
          inline: true,
        },
        {
          name: '💾 Memory',
          value: `${memoryMb} MB`,
          inline: true,
        },
        {
          name: '📅 Bot Created',
          value: `<t:${createdTimestamp}:F>`,
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