import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  EmbedBuilder,
} from 'discord.js';

import {
  addParticipantSafely,
  getEvent,
  getEventParticipants,
  isParticipant,
  removeParticipant,
} from '../../database/repositories/eventRepository.js';

import { buildEventCard } from './eventCard.js';

const PARTICIPANTS_PER_PAGE = 25;

export async function handleEventButton(
  interaction: ButtonInteraction,
): Promise<boolean> {
  const parts = interaction.customId.split(':');

  if (parts.length < 3 || parts[0] !== 'event') {
    return false;
  }

  const action = parts[1];
  const eventId = parts[2];

  if (!action || !eventId) {
    return false;
  }

  if (!interaction.guildId) {
    await interaction.reply({
      content: '❌ This button can only be used inside a server.',
      ephemeral: true,
    });

    return true;
  }

  const event = await getEvent(interaction.guildId, eventId);

  if (!event) {
    await interaction.reply({
      content: '❌ This event no longer exists.',
      ephemeral: true,
    });

    return true;
  }

  switch (action) {
    case 'join':
      await handleJoin(interaction, event);
      return true;

    case 'leave':
      await handleLeave(interaction, event);
      return true;

    case 'participants': {
      const page = parts[3] ? Number(parts[3]) : 1;

      await handleParticipants(interaction, event, page);
      return true;
    }

    default:
      return false;
  }
}

async function handleJoin(
  interaction: ButtonInteraction,
  event: NonNullable<Awaited<ReturnType<typeof getEvent>>>,
): Promise<void> {
  const result = await addParticipantSafely(
    event.guild_id,
    event.id,
    interaction.user.id,
  );

  switch (result) {
    case 'not_found':
      await interaction.reply({
        content: '❌ This event no longer exists.',
        ephemeral: true,
      });
      return;

    case 'not_scheduled':
      await interaction.reply({
        content: '❌ This event is no longer open for registration.',
        ephemeral: true,
      });
      return;

    case 'already_joined':
      await interaction.reply({
        content: '⚠️ You are already registered for this event.',
        ephemeral: true,
      });
      return;

    case 'full':
      await interaction.reply({
        content: '❌ This event is full.',
        ephemeral: true,
      });
      return;

    case 'joined':
      break;
  }

  const updatedEvent = await getEvent(
    event.guild_id,
    event.id,
  );

  if (!updatedEvent) {
    await interaction.reply({
      content:
        '✅ You joined the event, but the event could not be refreshed.',
      ephemeral: true,
    });

    return;
  }

  const updatedCard = await buildEventCard(updatedEvent);

  await interaction.update(updatedCard);

  await interaction.followUp({
    content: `✅ You joined **${updatedEvent.name}**.`,
    ephemeral: true,
  });
}

async function handleLeave(
  interaction: ButtonInteraction,
  event: NonNullable<Awaited<ReturnType<typeof getEvent>>>,
): Promise<void> {
  if (event.status !== 'scheduled') {
    await interaction.reply({
      content: `❌ This event is ${event.status} and is no longer accepting registrations.`,
      ephemeral: true,
    });

    return;
  }

  const participant = await isParticipant(
    event.guild_id,
    event.id,
    interaction.user.id,
  );

  if (!participant) {
    await interaction.reply({
      content: '⚠️ You are not registered for this event.',
      ephemeral: true,
    });

    return;
  }

  const removed = await removeParticipant(
    event.guild_id,
    event.id,
    interaction.user.id,
  );

  if (!removed) {
    await interaction.reply({
      content: '❌ Your registration could not be removed.',
      ephemeral: true,
    });

    return;
  }

  const updatedEvent = await getEvent(
    event.guild_id,
    event.id,
  );

  if (!updatedEvent) {
    await interaction.reply({
      content: '✅ You left the event.',
      ephemeral: true,
    });

    return;
  }

  const updatedCard = await buildEventCard(updatedEvent);

  await interaction.update(updatedCard);

  await interaction.followUp({
    content: `✅ You left **${updatedEvent.name}**.`,
    ephemeral: true,
  });
}

async function handleParticipants(
  interaction: ButtonInteraction,
  event: NonNullable<Awaited<ReturnType<typeof getEvent>>>,
  requestedPage: number,
): Promise<void> {
  const participants = await getEventParticipants(
    event.guild_id,
    event.id,
  );

  if (participants.length === 0) {
    await interaction.reply({
      content: '👥 No one has joined this event yet.',
      ephemeral: true,
    });

    return;
  }

  const totalPages = Math.ceil(
    participants.length / PARTICIPANTS_PER_PAGE,
  );

  const page = Math.min(
    Math.max(Number.isFinite(requestedPage) ? requestedPage : 1, 1),
    totalPages,
  );

  const startIndex = (page - 1) * PARTICIPANTS_PER_PAGE;
  const pageParticipants = participants.slice(
    startIndex,
    startIndex + PARTICIPANTS_PER_PAGE,
  );

  const lines = pageParticipants.map(
    (participant, index) =>
      `**${startIndex + index + 1}.** <@${participant.discord_user_id}>`,
  );

  const embed = new EmbedBuilder()
    .setTitle(`👥 Participants — ${event.name}`)
    .setDescription(lines.join('\n'))
    .setFooter({
      text: `Page ${page}/${totalPages} • ${participants.length} participant${
        participants.length === 1 ? '' : 's'
      }`,
    });

  const components: ActionRowBuilder<ButtonBuilder>[] = [];

  if (totalPages > 1) {
    const previousButton = new ButtonBuilder()
      .setCustomId(`event:participants:${event.id}:${page - 1}`)
      .setLabel('Previous')
      .setEmoji('⬅️')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page <= 1);

    const nextButton = new ButtonBuilder()
      .setCustomId(`event:participants:${event.id}:${page + 1}`)
      .setLabel('Next')
      .setEmoji('➡️')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page >= totalPages);

    components.push(
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        previousButton,
        nextButton,
      ),
    );
  }

  await interaction.reply({
    embeds: [embed],
    components,
    ephemeral: true,
  });
}