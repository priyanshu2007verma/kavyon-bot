import {
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from 'discord.js';

import { createModerationLog } from '../../modules/moderation/moderationRepository.js';

const command = {
  data: new SlashCommandBuilder()
    .setName('untimeout')
    .setDescription('Remove a member timeout.')
    .addUserOption((option) =>
      option
        .setName('user')
        .setDescription('The member whose timeout you want to remove.')
        .setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName('reason')
        .setDescription('Reason for removing the timeout.')
        .setRequired(true)
        .setMaxLength(500),
    )
    .setDefaultMemberPermissions(
      PermissionFlagsBits.ModerateMembers.toString(),
    ),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!interaction.guild) {
      await interaction.reply({
        content: 'This command can only be used inside a server.',
        ephemeral: true,
      });
      return;
    }

    if (
      !interaction.memberPermissions?.has(
        PermissionFlagsBits.ModerateMembers,
      )
    ) {
      await interaction.reply({
        content:
          'You need the **Moderate Members** permission to use `/untimeout`.',
        ephemeral: true,
      });
      return;
    }

    const target = interaction.options.getUser('user', true);
    const reason = interaction.options.getString('reason', true).trim();

    if (target.id === interaction.user.id) {
      await interaction.reply({
        content: 'You cannot remove a timeout from yourself using this command.',
        ephemeral: true,
      });
      return;
    }

    const member = await interaction.guild.members
      .fetch(target.id)
      .catch(() => null);

    if (!member) {
      await interaction.reply({
        content: 'That user is not a member of this server.',
        ephemeral: true,
      });
      return;
    }

    if (!member.moderatable) {
      await interaction.reply({
        content:
          'I cannot modify this member. Check my role position and permissions.',
        ephemeral: true,
      });
      return;
    }

    if (!member.communicationDisabledUntilTimestamp) {
      await interaction.reply({
        content: `ℹ️ <@${target.id}> is not currently timed out.`,
        ephemeral: true,
      });
      return;
    }

    await member.timeout(null, reason);

    await createModerationLog(
      interaction.guild.id,
      'UNTIMEOUT',
      target.id,
      interaction.user.id,
      reason,
    );

    await interaction.reply({
      content: [
        '🔓 **Timeout Removed**',
        '',
        `**Member:** <@${target.id}>`,
        `**Reason:** ${reason}`,
      ].join('\n'),
    });
  },
};

export default command;
