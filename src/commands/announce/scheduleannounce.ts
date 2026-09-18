import {
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from 'discord.js';

import { createScheduledAnnouncement } from '../../modules/announcements/announcementRepository.js';

const command = {
  data: new SlashCommandBuilder()
    .setName('scheduleannounce')
    .setDescription('Schedule an announcement for a future time.')
    .addChannelOption((option) =>
      option
        .setName('channel')
        .setDescription('Channel where the announcement will be sent.')
        .setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName('title')
        .setDescription('Announcement title.')
        .setRequired(true)
        .setMaxLength(256),
    )
    .addStringOption((option) =>
      option
        .setName('message')
        .setDescription('Announcement message.')
        .setRequired(true)
        .setMaxLength(4000),
    )
    .addStringOption((option) =>
      option
        .setName('time')
        .setDescription('UTC time in ISO format, e.g. 2026-09-17T07:00:00Z')
        .setRequired(true)
        .setMaxLength(30),
    )
    .addBooleanOption((option) =>
      option
        .setName('everyone')
        .setDescription('Mention @everyone when the announcement is sent.')
        .setRequired(false),
    )
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
          'You need the **Manage Messages** permission to use `/scheduleannounce`.',
        ephemeral: true,
      });
      return;
    }

    const channel = interaction.options.getChannel('channel', true);
    const title = interaction.options.getString('title', true).trim();
    const message = interaction.options.getString('message', true).trim();
    const timeInput = interaction.options.getString('time', true).trim();
    const mentionEveryone =
      interaction.options.getBoolean('everyone') ?? false;

    if (!('send' in channel)) {
      await interaction.reply({
        content: 'The selected channel cannot receive messages.',
        ephemeral: true,
      });
      return;
    }

    const scheduledFor = new Date(timeInput);

    if (Number.isNaN(scheduledFor.getTime())) {
      await interaction.reply({
        content:
          'Invalid time. Use ISO format such as `2026-09-17T07:00:00Z`.',
        ephemeral: true,
      });
      return;
    }

    if (scheduledFor.getTime() <= Date.now()) {
      await interaction.reply({
        content: 'The scheduled time must be in the future.',
        ephemeral: true,
      });
      return;
    }

    const announcement = await createScheduledAnnouncement(
      interaction.guild.id,
      channel.id,
      interaction.user.id,
      title,
      message,
      mentionEveryone,
      scheduledFor,
    );

    await interaction.reply({
      content: [
        '⏰ **Announcement Scheduled**',
        '',
        `**ID:** \`${announcement.id}\``,
        `**Channel:** <#${channel.id}>`,
        `**Title:** ${title}`,
        `**Scheduled:** <t:${Math.floor(scheduledFor.getTime() / 1000)}:F>`,
        `**Everyone:** ${mentionEveryone ? 'Yes' : 'No'}`,
      ].join('\n'),
      ephemeral: true,
    });
  },
};

export default command;