import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from 'discord.js';

import type { Command } from '../../types/command.js';

const data = new SlashCommandBuilder()
  .setName('permissions')
  .setDescription("View a user's permissions in this channel.");

data.addUserOption((option) =>
  option
    .setName('user')
    .setDescription('The user whose permissions you want to inspect.')
    .setRequired(false),
);

const permissionLabels: Array<[bigint, string]> = [
  [PermissionFlagsBits.Administrator, 'Administrator'],
  [PermissionFlagsBits.ManageGuild, 'Manage Server'],
  [PermissionFlagsBits.ManageChannels, 'Manage Channels'],
  [PermissionFlagsBits.ManageRoles, 'Manage Roles'],
  [PermissionFlagsBits.ManageMessages, 'Manage Messages'],
  [PermissionFlagsBits.KickMembers, 'Kick Members'],
  [PermissionFlagsBits.BanMembers, 'Ban Members'],
  [PermissionFlagsBits.ModerateMembers, 'Timeout Members'],
  [PermissionFlagsBits.MentionEveryone, 'Mention Everyone'],
  [PermissionFlagsBits.ManageWebhooks, 'Manage Webhooks'],
  [PermissionFlagsBits.ManageNicknames, 'Manage Nicknames'],
  [PermissionFlagsBits.ViewChannel, 'View Channel'],
  [PermissionFlagsBits.SendMessages, 'Send Messages'],
  [PermissionFlagsBits.EmbedLinks, 'Embed Links'],
  [PermissionFlagsBits.AttachFiles, 'Attach Files'],
  [PermissionFlagsBits.ReadMessageHistory, 'Read Message History'],
  [PermissionFlagsBits.AddReactions, 'Add Reactions'],
  [PermissionFlagsBits.Connect, 'Connect to Voice'],
  [PermissionFlagsBits.Speak, 'Speak'],
];

const command: Command = {
  data,

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!interaction.guild || !interaction.channelId) {
      await interaction.reply({
        content:
          '❌ This command can only be used inside a server channel.',
        ephemeral: true,
      });

      return;
    }

    const user = interaction.options.getUser('user') ?? interaction.user;

    const member = await interaction.guild.members
      .fetch(user.id)
      .catch(() => null);

    if (!member) {
      await interaction.reply({
        content: '❌ I could not find that member in this server.',
        ephemeral: true,
      });

      return;
    }

    const guildChannel = interaction.guild.channels.cache.get(
      interaction.channelId,
    );

    if (!guildChannel) {
      await interaction.reply({
        content: '❌ I could not find this channel.',
        ephemeral: true,
      });

      return;
    }

    const permissions = guildChannel.permissionsFor(member);

    if (!permissions) {
      await interaction.reply({
        content:
          "❌ I could not determine this user's permissions in this channel.",
        ephemeral: true,
      });

      return;
    }

    const grantedPermissions = permissionLabels
      .filter(([permission]) => permissions.has(permission))
      .map(([, label]) => `✅ ${label}`);

    const deniedPermissions = permissionLabels
      .filter(([permission]) => !permissions.has(permission))
      .map(([, label]) => `❌ ${label}`);

    const embed = new EmbedBuilder()
      .setTitle(`🔐 Permissions — ${user.username}`)
      .setThumbnail(user.displayAvatarURL({ size: 256 }))
      .addFields(
        {
          name: '👤 User',
          value: `${user} (\`${user.id}\`)`,
          inline: false,
        },
        {
          name: '📺 Channel',
          value: `<#${guildChannel.id}>`,
          inline: true,
        },
        {
          name: '🟢 Granted',
          value:
            grantedPermissions.length > 0
              ? grantedPermissions.join('\n')
              : 'None',
          inline: false,
        },
        {
          name: '🔴 Denied',
          value:
            deniedPermissions.length > 0
              ? deniedPermissions.join('\n')
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