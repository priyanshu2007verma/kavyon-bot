import {
  ChannelType,
  ChatInputCommandInteraction,
  EmbedBuilder,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from 'discord.js';

import {
  getEvent,
  updateEvent,
} from '../../database/repositories/eventRepository.js';
import type { Command } from '../../types/command.js';

const data = new SlashCommandBuilder()
  .setName('event-edit')
  .setDescription('Edit an existing event')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageEvents.toString());

data.addStringOption((option) =>
  option
    .setName('event_id')
    .setDescription('The ID of the event to edit')
    .setRequired(true),
);

data.addStringOption((option) =>
  option
    .setName('name')
    .setDescription('New event name')
    .setMaxLength(100),
);

data.addStringOption((option) =>
  option
    .setName('description')
    .setDescription('New event description')
    .setMaxLength(4000),
);

data.addStringOption((option) =>
  option
    .setName('date')
    .setDescription('New date in YYYY-MM-DD format'),
);

data.addStringOption((option) =>
  option
    .setName('time')
    .setDescription('New time in HH:MM format, UTC'),
);

data.addIntegerOption((option) =>
  option
    .setName('duration')
    .setDescription('New duration in minutes')
    .setMinValue(1)
    .setMaxValue(1440),
);

data.addStringOption((option) =>
  option
    .setName('location')
    .setDescription('New event location')
    .setMaxLength(200),
);

data.addIntegerOption((option) =>
  option
    .setName('max_participants')
    .setDescription('New participant limit')
    .setMinValue(1)
    .setMaxValue(100000),
);

data.addChannelOption((option) =>
  option
    .setName('channel')
    .setDescription('New event channel')
    .addChannelTypes(ChannelType.GuildText),
);

data.addStringOption((option) =>
  option
    .setName('image')
    .setDescription('New image URL'),
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

    if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageEvents)) {
      await interaction.reply({
        content: '❌ You need the **Manage Events** permission to edit events.',
        ephemeral: true,
      });

      return;
    }

    const eventId = interaction.options.getString('event_id', true);

    const existingEvent = await getEvent(interaction.guild.id, eventId);

    if (!existingEvent) {
      await interaction.reply({
        content: `❌ No event with ID \`${eventId}\` was found.`,
        ephemeral: true,
      });

      return;
    }

    if (existingEvent.status !== 'scheduled') {
      await interaction.reply({
        content: `❌ This event is **${existingEvent.status}** and cannot be edited.`,
        ephemeral: true,
      });

      return;
    }

    const name = interaction.options.getString('name');
    const description = interaction.options.getString('description');
    const date = interaction.options.getString('date');
    const time = interaction.options.getString('time');
    const duration = interaction.options.getInteger('duration');
    const location = interaction.options.getString('location');
    const maxParticipants =
      interaction.options.getInteger('max_participants');
    const channel = interaction.options.getChannel('channel');
    const image = interaction.options.getString('image');

    const hasDate = date !== null;
    const hasTime = time !== null;

    if (hasDate !== hasTime) {
      await interaction.reply({
        content:
          '❌ To change the event date/time, provide **both** `date` and `time`.',
        ephemeral: true,
      });

      return;
    }

    if (
      name === null &&
      description === null &&
      date === null &&
      time === null &&
      duration === null &&
      location === null &&
      maxParticipants === null &&
      channel === null &&
      image === null
    ) {
      await interaction.reply({
        content: '❌ You must provide at least one field to update.',
        ephemeral: true,
      });

      return;
    }

    let startsAt: Date | undefined;

    if (date !== null && time !== null) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        await interaction.reply({
          content: '❌ Date must use `YYYY-MM-DD` format.',
          ephemeral: true,
        });

        return;
      }

      if (!/^\d{2}:\d{2}$/.test(time)) {
        await interaction.reply({
          content: '❌ Time must use `HH:MM` format.',
          ephemeral: true,
        });

        return;
      }

      startsAt = new Date(`${date}T${time}:00.000Z`);

      if (Number.isNaN(startsAt.getTime())) {
        await interaction.reply({
          content: '❌ The provided date or time is invalid.',
          ephemeral: true,
        });

        return;
      }

      if (startsAt.getTime() <= Date.now()) {
        await interaction.reply({
          content: '❌ The new event date/time must be in the future.',
          ephemeral: true,
        });

        return;
      }
    }

    if (image !== null) {
      try {
        const imageUrl = new URL(image);

        if (!['http:', 'https:'].includes(imageUrl.protocol)) {
          throw new Error('Invalid protocol');
        }
      } catch {
        await interaction.reply({
          content: '❌ Please provide a valid image URL.',
          ephemeral: true,
        });

        return;
      }
    }

   const updates: Parameters<typeof updateEvent>[2] = {};

        if (name !== null) {
        updates.name = name;
        }

        if (description !== null) {
        updates.description = description;
        }

        if (startsAt !== undefined) {
        updates.startsAt = startsAt;
        }

        if (duration !== null) {
        updates.durationMinutes = duration;
        }

        if (location !== null) {
        updates.location = location;
        }

        if (maxParticipants !== null) {
        updates.maxParticipants = maxParticipants;
        }

        if (channel !== null) {
        updates.channelId = channel.id;
        }

        if (image !== null) {
        updates.imageUrl = image;
        }

        const updatedEvent = await updateEvent(
        interaction.guild.id,
        eventId,
        updates,
        );


    if (!updatedEvent) {
      await interaction.reply({
        content: '❌ The event could not be updated.',
        ephemeral: true,
      });

      return;
    }

    const startTimestamp = Math.floor(
      new Date(updatedEvent.starts_at).getTime() / 1000,
    );

    const durationText = updatedEvent.duration_minutes
      ? `${updatedEvent.duration_minutes} minute${
          updatedEvent.duration_minutes === 1 ? '' : 's'
        }`
      : 'Not specified';

    const embed = new EmbedBuilder()
      .setTitle(`✏️ ${updatedEvent.name}`)
      .setDescription(updatedEvent.description)
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
          name: '📍 Location',
          value: updatedEvent.location ?? 'Not specified',
          inline: false,
        },
        {
          name: '👥 Max Participants',
          value: updatedEvent.max_participants
            ? String(updatedEvent.max_participants)
            : 'Unlimited',
          inline: true,
        },
        {
          name: '📢 Status',
          value: '🟢 Scheduled',
          inline: true,
        },
        {
          name: '🆔 Event ID',
          value: `\`${updatedEvent.id}\``,
          inline: true,
        },
      )
      .setFooter({
        text: 'Event updated successfully',
      })
      .setTimestamp();

    if (updatedEvent.image_url) {
      embed.setImage(updatedEvent.image_url);
    }

    await interaction.reply({
      content: '✅ Event updated successfully.',
      embeds: [embed],
    });
  },
};

export default command;