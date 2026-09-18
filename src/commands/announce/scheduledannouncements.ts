import {
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from 'discord.js';

import { pool } from '../../database/database.js';

const command = {
  data: new SlashCommandBuilder()
    .setName('scheduledannouncements')
    .setDescription('View pending scheduled announcements.')
    .setDefaultMemberPermissions(
      PermissionFlagsBits.ManageMessages.toString(),
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
        PermissionFlagsBits.ManageMessages,
      )
    ) {
      await interaction.reply({
        content:
          'You need the **Manage Messages** permission to use this command.',
        ephemeral: true,
      });
      return;
    }

    const result = await pool.query<{
      id: string;
      channel_id: string;
      title: string;
      message: string;
      mention_everyone: boolean;
      scheduled_for: Date;
    }>(
      `
      SELECT
        id,
        channel_id,
        title,
        message,
        mention_everyone,
        scheduled_for
      FROM scheduled_announcements
      WHERE guild_id = $1
        AND sent_at IS NULL
      ORDER BY scheduled_for ASC
      LIMIT 10
      `,
      [interaction.guild.id],
    );

    if (result.rows.length === 0) {
      await interaction.reply({
        content: '📭 There are no pending scheduled announcements.',
        ephemeral: true,
      });
      return;
    }

    const lines = result.rows.map((announcement, index) => {
      const timestamp = Math.floor(
        announcement.scheduled_for.getTime() / 1000,
      );

      return [
        `**${index + 1}. ${announcement.title}**`,
        `ID: \`${announcement.id}\``,
        `Channel: <#${announcement.channel_id}>`,
        `Scheduled: <t:${timestamp}:F>`,
        `Everyone: ${announcement.mention_everyone ? 'Yes' : 'No'}`,
      ].join('\n');
    });

    await interaction.reply({
      content: [
        '📅 **Pending Scheduled Announcements**',
        '',
        ...lines,
      ].join('\n\n'),
      ephemeral: true,
    });
  },
};

export default command;