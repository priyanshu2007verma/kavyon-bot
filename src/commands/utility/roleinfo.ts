import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  PermissionFlagsBits,
  Role,
  SlashCommandBuilder,
} from 'discord.js';

import type { Command } from '../../types/command.js';

const data = new SlashCommandBuilder()
  .setName('roleinfo')
  .setDescription('View information about a server role.');

data.addRoleOption((option) =>
  option
    .setName('role')
    .setDescription('The role to inspect.')
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

    const importantPermissions: string[] = [];

    if (role.permissions.has(PermissionFlagsBits.Administrator)) {
      importantPermissions.push('Administrator');
    }

    if (role.permissions.has(PermissionFlagsBits.ManageGuild)) {
      importantPermissions.push('Manage Server');
    }

    if (role.permissions.has(PermissionFlagsBits.ManageChannels)) {
      importantPermissions.push('Manage Channels');
    }

    if (role.permissions.has(PermissionFlagsBits.ManageRoles)) {
      importantPermissions.push('Manage Roles');
    }

    if (role.permissions.has(PermissionFlagsBits.ManageMessages)) {
      importantPermissions.push('Manage Messages');
    }

    if (role.permissions.has(PermissionFlagsBits.KickMembers)) {
      importantPermissions.push('Kick Members');
    }

    if (role.permissions.has(PermissionFlagsBits.BanMembers)) {
      importantPermissions.push('Ban Members');
    }

    if (role.permissions.has(PermissionFlagsBits.ModerateMembers)) {
      importantPermissions.push('Moderate Members');
    }

    if (role.permissions.has(PermissionFlagsBits.MentionEveryone)) {
      importantPermissions.push('Mention Everyone');
    }

    const embed = new EmbedBuilder()
      .setTitle(`🎭 ${role.name}`)
      .addFields(
        {
          name: '🆔 Role ID',
          value: `\`${role.id}\``,
          inline: true,
        },
        {
          name: '📌 Position',
          value: role.position.toString(),
          inline: true,
        },
        {
          name: '👥 Members',
          value: role.members.size.toString(),
          inline: true,
        },
        {
          name: '🎨 Color',
          value: role.hexColor,
          inline: true,
        },
        {
          name: '📢 Mentionable',
          value: role.mentionable ? 'Yes' : 'No',
          inline: true,
        },
        {
          name: '🔗 Mention',
          value: role.toString(),
          inline: true,
        },
        {
          name: '🔐 Important Permissions',
          value:
            importantPermissions.length > 0
              ? importantPermissions.join(', ')
              : 'None',
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