import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  Role,
  SlashCommandBuilder,
} from 'discord.js';

import type { Command } from '../../types/command.js';

const data = new SlashCommandBuilder()
  .setName('role-members')
  .setDescription('View members who have a specific role.');

data.addRoleOption((option) =>
  option
    .setName('role')
    .setDescription('The role whose members you want to view.')
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

    const selectedRole = interaction.options.getRole('role');

    if (!selectedRole) {
      await interaction.reply({
        content: '❌ That role could not be found.',
        ephemeral: true,
      });

      return;
    }

    const role: Role | undefined = interaction.guild.roles.cache.get(
      selectedRole.id,
    );

    if (!role) {
      await interaction.reply({
        content: '❌ That role is not available in the server cache.',
        ephemeral: true,
      });

      return;
    }

    await interaction.deferReply();

    try {
      const members = await interaction.guild.members.fetch();

      const roleMembers = [...members.values()]
        .filter((member) => member.roles.cache.has(role.id))
        .sort((a, b) =>
          a.user.username.localeCompare(b.user.username),
        );

      const memberLines =
        roleMembers.length > 0
          ? roleMembers.map(
              (member) =>
                `• ${member} — \`${member.user.username}\``,
            )
          : ['*No members found with this role.*'];

      const chunks: string[] = [];
      let currentChunk = '';

      for (const line of memberLines) {
        const nextChunk = currentChunk
          ? `${currentChunk}\n${line}`
          : line;

        if (nextChunk.length > 3900) {
          if (currentChunk) {
            chunks.push(currentChunk);
          }

          currentChunk = line;
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
            `👥 ${role.name}${
              chunks.length > 1
                ? ` — Page ${index + 1}/${chunks.length}`
                : ''
            }`,
          )
          .setDescription(chunk)
          .addFields(
            {
              name: '🆔 Role ID',
              value: `\`${role.id}\``,
              inline: true,
            },
            {
              name: '👤 Members',
              value: roleMembers.length.toString(),
              inline: true,
            },
          )
          .setFooter({
            text: `Requested by ${interaction.user.username}`,
          })
          .setTimestamp(),
      );

      await interaction.editReply({
        embeds,
      });
    } catch (error) {
      console.error('Failed to fetch guild members:', error);

      await interaction.editReply({
        content:
          '❌ I could not fetch the server members. Please try again.',
      });
    }
  },
};

export default command;