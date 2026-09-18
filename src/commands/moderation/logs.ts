import {
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from 'discord.js';

import { pool } from '../../database/database.js';

const command = {
  data: new SlashCommandBuilder()
    .setName('logs')
    .setDescription('View recent moderation actions.')
    .addIntegerOption((option) =>
      option
        .setName('amount')
        .setDescription('Number of recent logs to show.')
        .setRequired(false)
        .setMinValue(1)
        .setMaxValue(10),
    )
    .setDefaultMemberPermissions(
      PermissionFlagsBits.ViewAuditLog.toString(),
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
      !interaction.memberPermissions?.has(PermissionFlagsBits.ViewAuditLog)
    ) {
      await interaction.reply({
        content: 'You need the **View Audit Log** permission to use `/logs`.',
        ephemeral: true,
      });
      return;
    }

    const amount = interaction.options.getInteger('amount') ?? 5;

    const result = await pool.query<{
      action: string;
      target_user_id: string | null;
      moderator_id: string;
      reason: string | null;
      created_at: Date;
    }>(
      `
      SELECT
        action,
        target_user_id,
        moderator_id,
        reason,
        created_at
      FROM moderation_logs
      WHERE guild_id = $1
      ORDER BY created_at DESC
      LIMIT $2
      `,
      [interaction.guild.id, amount],
    );

    if (result.rows.length === 0) {
      await interaction.reply({
        content: '📋 No moderation logs have been recorded yet.',
        ephemeral: true,
      });
      return;
    }

    const lines = result.rows.map((log, index) => {
      const target = log.target_user_id
        ? `<@${log.target_user_id}>`
        : 'Channel';

      const reason = log.reason ?? 'No reason provided';

      return [
        `**${index + 1}. ${log.action}**`,
        `Target: ${target}`,
        `Moderator: <@${log.moderator_id}>`,
        `Reason: ${reason}`,
        `Time: <t:${Math.floor(log.created_at.getTime() / 1000)}:R>`,
      ].join('\n');
    });

    await interaction.reply({
      content: ['📋 **Recent Moderation Logs**', '', ...lines].join('\n\n'),
      ephemeral: true,
    });
  },
};

export default command;