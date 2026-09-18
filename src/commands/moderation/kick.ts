import {
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from 'discord.js';

import { createModerationLog } from '../../modules/moderation/moderationRepository.js';

const command = {
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Kick a member from the server.')
    .addUserOption((option) =>
      option
        .setName('user')
        .setDescription('The member you want to kick.')
        .setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName('reason')
        .setDescription('Reason for the kick.')
        .setRequired(true)
        .setMaxLength(500),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers.toString()),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!interaction.guild) {
      await interaction.reply({
        content: 'This command can only be used inside a server.',
        ephemeral: true,
      });
      return;
    }

    if (
      !interaction.memberPermissions?.has(PermissionFlagsBits.KickMembers)
    ) {
      await interaction.reply({
        content: 'You need the **Kick Members** permission to use `/kick`.',
        ephemeral: true,
      });
      return;
    }

    const target = interaction.options.getUser('user', true);
    const reason = interaction.options.getString('reason', true).trim();

    if (target.id === interaction.user.id) {
      await interaction.reply({
        content: 'You cannot kick yourself.',
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

    if (!member.kickable) {
      await interaction.reply({
        content:
          'I cannot kick this member. Check my role position and permissions.',
        ephemeral: true,
      });
      return;
    }

    await member.kick(reason);

    await createModerationLog(
      interaction.guild.id,
      'KICK',
      target.id,
      interaction.user.id,
      reason,
    );

    await interaction.reply({
      content: [
        '👢 **Member Kicked**',
        '',
        `**Member:** <@${target.id}>`,
        `**Reason:** ${reason}`,
      ].join('\n'),
    });
  },
};

export default command;