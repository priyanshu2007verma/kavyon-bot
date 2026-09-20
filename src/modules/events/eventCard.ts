import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} from 'discord.js';

import {
  EventRecord,
  getParticipantCount,
} from '../../database/repositories/eventRepository.js';

export interface EventCard {
  embeds: EmbedBuilder[];
  components: ActionRowBuilder<ButtonBuilder>[];
}

export async function buildEventCard(
  event: EventRecord,
): Promise<EventCard> {
  const participantCount = await getParticipantCount(
    event.guild_id,
    event.id,
  );

  const capacityText = event.max_participants
    ? `${participantCount} / ${event.max_participants}`
    : `${participantCount}`;

  const startTimestamp = Math.floor(
    new Date(event.starts_at).getTime() / 1000,
  );

  const dateText = `<t:${startTimestamp}:F>`;
  const relativeText = `<t:${startTimestamp}:R>`;

  const durationText = event.duration_minutes
    ? `${event.duration_minutes} minute${
        event.duration_minutes === 1 ? '' : 's'
      }`
    : 'Not specified';

  const embed = new EmbedBuilder()
    .setTitle(`🎉 ${event.name}`)
    .setDescription(event.description)
    .addFields(
      {
        name: '📅 Date & Time',
        value: `${dateText}\n${relativeText}`,
        inline: true,
      },
      {
        name: '⏱ Duration',
        value: durationText,
        inline: true,
      },
      {
        name: '👥 Participants',
        value: capacityText,
        inline: true,
      },
      {
        name: '📍 Location',
        value: event.location ?? 'Not specified',
        inline: false,
      },
    )
    .setFooter({
      text: `Event ID: ${event.id}`,
    })
    .setTimestamp(new Date(event.created_at));

  if (event.image_url) {
    embed.setImage(event.image_url);
  }

  const isFull =
    event.max_participants !== null &&
    participantCount >= event.max_participants;

  const joinButton = new ButtonBuilder()
    .setCustomId(`event:join:${event.id}`)
    .setLabel(isFull ? 'Event Full' : 'Join Event')
    .setEmoji('🟢')
    .setStyle(ButtonStyle.Success)
    .setDisabled(isFull || event.status !== 'scheduled');

  const leaveButton = new ButtonBuilder()
    .setCustomId(`event:leave:${event.id}`)
    .setLabel('Leave Event')
    .setEmoji('🔴')
    .setStyle(ButtonStyle.Danger)
    .setDisabled(event.status !== 'scheduled');

  const participantsButton = new ButtonBuilder()
    .setCustomId(`event:participants:${event.id}`)
    .setLabel('Participants')
    .setEmoji('👥')
    .setStyle(ButtonStyle.Secondary)
    .setDisabled(event.status !== 'scheduled');

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    joinButton,
    leaveButton,
    participantsButton,
  );

  return {
    embeds: [embed],
    components: [row],
  };
}