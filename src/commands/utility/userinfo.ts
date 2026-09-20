import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  GuildMember,
  SlashCommandBuilder,
  User,
} from 'discord.js';

import type { Command } from '../../types/command.js';

const data = new SlashCommandBuilder()
  .setName('userinfo')
  .setDescription('View information about a server member.');

data.addUserOption((option) =>
  option
    .setName('user')
    .setDescription('The user to inspect.')
    .setRequired(false),
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

    const targetUser: User =
      interaction.options.getUser('user') ?? interaction.user;

    const member: GuildMember | null = await interaction.guild.members
      .fetch(targetUser.id)
      .catch(() => null);

    const accountCreatedTimestamp = Math.floor(
      targetUser.createdTimestamp / 1000,
    );

    const embed = new EmbedBuilder()
      .setTitle(`👤 ${targetUser.username}`)
      .setThumbnail(targetUser.displayAvatarURL({ size: 256 }))
      .addFields(
        {
          name: '🏷️ Display Name',
          value: targetUser.globalName ?? targetUser.username,
          inline: true,
        },
        {
          name: '🆔 User ID',
          value: `\`${targetUser.id}\``,
          inline: true,
        },
        {
          name: '🤖 Account Type',
          value: targetUser.bot ? 'Bot' : 'User',
          inline: true,
        },
        {
          name: '📅 Account Created',
          value: `<t:${accountCreatedTimestamp}:F>\n<t:${accountCreatedTimestamp}:R>`,
          inline: false,
        },
      );

    if (member) {
      const joinedTimestamp = member.joinedTimestamp
        ? Math.floor(member.joinedTimestamp / 1000)
        : null;

      const roles = member.roles.cache
        .filter((role) => role.id !== interaction.guild!.id)
        .sort((a, b) => b.position - a.position);

      const roleText =
        roles.size > 0
          ? roles
              .map((role) => `<@&${role.id}>`)
              .slice(0, 15)
              .join(', ')
          : 'No roles';

      embed.addFields(
        {
          name: '📥 Joined Server',
          value: joinedTimestamp
            ? `<t:${joinedTimestamp}:F>\n<t:${joinedTimestamp}:R>`
            : 'Unknown',
          inline: true,
        },
        {
          name: '🎭 Highest Role',
          value:
            member.roles.highest.id === interaction.guild.id
              ? 'Everyone'
              : member.roles.highest.toString(),
          inline: true,
        },
        {
          name: '🎨 Roles',
          value:
            roles.size > 15
              ? `${roleText}\n…and ${roles.size - 15} more`
              : roleText,
          inline: false,
        },
      );
    }

    embed
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