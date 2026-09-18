import {
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from 'discord.js';

import { createModerationLog } from '../../modules/moderation/moderationRepository.js';

const DURATION_REGEX = /^(\d+)(m|h|d)$/i;

function parseDuration(value: string): number | null {
  const match = value.trim().match(DURATION_REGEX);

  if (!match) {
    return null;
  }

  const amountText = match[1];
  const unit = match[2];

  if (!amountText || !unit) {
    return null;
  }

  const amount = Number(amountText);
  const normalizedUnit = unit.toLowerCase();

  if (!Number.isSafeInteger(amount) || amount <= 0) {
    return null;
  }

  const multipliers: Record<string, number> = {
    m: 60_000,
    h: 60 * 60_000,
    d: 24 * 60 * 60_000,
  };

  const multiplier = multipliers[normalizedUnit];

  if (!multiplier) {
    return null;
  }

  const duration = amount * multiplier;

  // Discord's maximum timeout is 28 days.
  if (duration > 28 * 24 * 60 * 60_000) {
    return null;
  }

  return duration;
}

const command = {
  data: new SlashCommandBuilder()
    .setName('timeout')
    .setDescription('Temporarily timeout a member.')
    .addUserOption((option) =>
      option
        .setName('user')
        .setDescription('The member you want to timeout.')
        .setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName('duration')
        .setDescription('Duration, for example 10m, 2h, or 1d.')
        .setRequired(true)
        .setMaxLength(10),
    )
    .addStringOption((option) =>
      option
        .setName('reason')
        .setDescription('Reason for the timeout.')
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
          'You need the **Moderate Members** permission to use `/timeout`.',
        ephemeral: true,
      });
      return;
    }

    const target = interaction.options.getUser('user', true);
    const durationInput = interaction.options.getString('duration', true);
    const reason = interaction.options.getString('reason', true).trim();

    if (target.id === interaction.user.id) {
      await interaction.reply({
        content: 'You cannot timeout yourself.',
        ephemeral: true,
      });
      return;
    }

    const duration = parseDuration(durationInput);

    if (duration === null) {
      await interaction.reply({
        content:
          'Invalid duration. Use a format such as `10m`, `2h`, or `1d`. Maximum is `28d`.',
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
          'I cannot timeout this member. Check my role position and permissions.',
        ephemeral: true,
      });
      return;
    }

    await member.timeout(duration, reason);

    await createModerationLog(
      interaction.guild.id,
      'TIMEOUT',
      target.id,
      interaction.user.id,
      `${durationInput} — ${reason}`,
    );

    await interaction.reply({
      content: [
        '⏳ **Member Timed Out**',
        '',
        `**Member:** <@${target.id}>`,
        `**Duration:** ${durationInput}`,
        `**Reason:** ${reason}`,
      ].join('\n'),
    });
  },
};

export default command;