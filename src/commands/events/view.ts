import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
} from 'discord.js';

import {
  getEvent,
  getParticipantCount,
} from '../../database/repositories/eventRepository.js';
import type { Command } from '../../types/command.js';

const data = new SlashCommandBuilder()
  .setName('event-view')
  .setDescription('View details of a specific event');

data.addStringOption((option) =>
  option
    .setName('event_id')
    .setDescription('The ID of the event')
    .setRequired(true),
);

const command: Command = {
  data,

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!interaction.guild) {
      await interaction.reply({
        content: 'This command can only be used inside a server.',
        ephemeral: true,
      });

      return;
    }

    const eventId = interaction.options.getString('event_id', true);

    const event = await getEvent(interaction.guild.id, eventId);

    if (!event) {
      await interaction.reply({
        content: `❌ No event with ID \`${eventId}\` was found.`,
        ephemeral: true,
      });

      return;
    }

    const participantCount = await getParticipantCount(
      interaction.guild.id,
      event.id,
    );

    const startTimestamp = Math.floor(
      new Date(event.starts_at).getTime() / 1000,
    );

    const durationText = event.duration_minutes
      ? `${event.duration_minutes} minute${
          event.duration_minutes === 1 ? '' : 's'
        }`
      : 'Not specified';

    const participantText = event.max_participants
      ? `${participantCount} / ${event.max_participants}`
      : `${participantCount} / Unlimited`;

    const statusText = {
      scheduled: '🟢 Scheduled',
      cancelled: '🔴 Cancelled',
      completed: '⚪ Completed',
    }[event.status];

    const embed = new EmbedBuilder()
      .setTitle(`🎉 ${event.name}`)
      .setDescription(event.description)
      .addFields(
        {
          name: '📅 Date & Time',
          value: `<t:${startTimestamp}:F>\n<t:${startTimestamp}:R>`,
          inline: true,
        },
        {
          name: '⏱ Duration',
          value: durationText,
          inline: true,
        },
        {
          name: '👥 Participants',
          value: participantText,
          inline: true,
        },
        {
          name: '📍 Location',
          value: event.location ?? 'Not specified',
          inline: false,
        },
        {
          name: '📢 Status',
          value: statusText,
          inline: true,
        },
        {
          name: '🆔 Event ID',
          value: `\`${event.id}\``,
          inline: true,
        },
      )
      .setFooter({
        text: `Created by ${event.created_by}`,
      })
      .setTimestamp(new Date(event.created_at));

    if (event.image_url) {
      embed.setImage(event.image_url);
    }

    await interaction.reply({
      embeds: [embed],
    });
  },
};

export default command;