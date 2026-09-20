import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
} from 'discord.js';

import type { Command } from '../../types/command.js';

const data = new SlashCommandBuilder()
  .setName('rolelist')
  .setDescription('View the roles available in this server.');

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

    const roles = interaction.guild.roles.cache
      .filter((role) => role.id !== interaction.guild?.id)
      .sort((a, b) => b.position - a.position);

    if (roles.size === 0) {
      await interaction.reply({
        content: '❌ This server does not have any additional roles.',
        ephemeral: true,
      });

      return;
    }

    const roleLines = roles.map((role) => {
      const memberCount = role.members.size;

      return [
        `${role}`,
        `\`${role.id}\` • Position ${role.position} • ${memberCount} member${memberCount === 1 ? '' : 's'}`,
        role.mentionable ? 'Mentionable' : 'Not mentionable',
      ].join('\n');
    });

    const chunks: string[] = [];
    let currentChunk = '';

    for (const line of roleLines) {
      if (`${currentChunk}${currentChunk ? '\n\n' : ''}${line}`.length > 3900) {
        chunks.push(currentChunk);
        currentChunk = line;
      } else {
        currentChunk += `${currentChunk ? '\n\n' : ''}${line}`;
      }
    }

    if (currentChunk) {
      chunks.push(currentChunk);
    }

    const embeds = chunks.slice(0, 10).map((chunk, index) =>
      new EmbedBuilder()
        .setTitle(
          `🎭 Server Roles${chunks.length > 1 ? ` — Page ${index + 1}/${chunks.length}` : ''}`,
        )
        .setDescription(chunk)
        .setFooter({
          text: `${roles.size} role${roles.size === 1 ? '' : 's'} • Requested by ${interaction.user.username}`,
        })
        .setTimestamp(),
    );

    await interaction.reply({
      embeds,
    });
  },
};

export default command;