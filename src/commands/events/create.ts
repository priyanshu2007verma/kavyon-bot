import {
  ChannelType,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  SlashCommandBuilder,
  TextChannel,
} from 'discord.js';

import {
  createEvent,
  CreateEventInput,
} from '../../database/repositories/eventRepository.js';

import { buildEventCard } from '../../modules/events/eventCard.js';

export default {
  data: new SlashCommandBuilder()
    .setName('event-create')
    .setDescription('Create a new Kavyon event.')
    .setDefaultMemberPermissions(
      PermissionFlagsBits.ManageEvents.toString(),
    )
    .addStringOption((option) =>
      option
        .setName('name')
        .setDescription('Name of the event.')
        .setRequired(true)
        .setMaxLength(100),
    )
    .addStringOption((option) =>
      option
        .setName('description')
        .setDescription('Description of the event.')
        .setRequired(true)
        .setMaxLength(1000),
    )
    .addStringOption((option) =>
      option
        .setName('date')
        .setDescription('Event date in YYYY-MM-DD format.')
        .setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName('time')
        .setDescription('Event time in HH:MM 24-hour format.')
        .setRequired(true),
    )
    .addIntegerOption((option) =>
      option
        .setName('duration')
        .setDescription('Duration in minutes.')
        .setRequired(false)
        .setMinValue(1)
        .setMaxValue(1440),
    )
    .addStringOption((option) =>
      option
        .setName('location')
        .setDescription('Physical location or meeting link.')
        .setRequired(false)
        .setMaxLength(500),
    )
    .addIntegerOption((option) =>
      option
        .setName('max_participants')
        .setDescription('Maximum number of participants.')
        .setRequired(false)
        .setMinValue(1)
        .setMaxValue(10000),
    )
    .addChannelOption((option) =>
      option
        .setName('channel')
        .setDescription('Discord channel associated with the event.')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(false),
    )
    .addStringOption((option) =>
      option
        .setName('image')
        .setDescription('Optional image URL.')
        .setRequired(false)
        .setMaxLength(1000),
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guildId) {
      await interaction.reply({
        content: '❌ This command can only be used inside a server.',
        ephemeral: true,
      });

      return;
    }

    const name = interaction.options.getString('name', true).trim();
    const description = interaction.options
      .getString('description', true)
      .trim();

    const date = interaction.options.getString('date', true).trim();
    const time = interaction.options.getString('time', true).trim();

    const duration = interaction.options.getInteger('duration');
    const location = interaction.options.getString('location')?.trim() ?? null;
    const maxParticipants =
      interaction.options.getInteger('max_participants');

    const channel = interaction.options.getChannel('channel');
    const imageUrl = interaction.options.getString('image')?.trim() ?? null;

    // Validate date.
    const datePattern = /^\d{4}-\d{2}-\d{2}$/;

    if (!datePattern.test(date)) {
      await interaction.reply({
        content:
          '❌ Invalid date. Use the format `YYYY-MM-DD`, for example `2026-10-05`.',
        ephemeral: true,
      });

      return;
    }

    // Validate time.
    const timePattern = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

    if (!timePattern.test(time)) {
      await interaction.reply({
        content:
          '❌ Invalid time. Use the 24-hour format `HH:MM`, for example `18:30`.',
        ephemeral: true,
      });

      return;
    }

    // Interpret the supplied date/time as UTC.
    //
    // We will improve timezone handling in the next event-service layer.
    const startsAt = new Date(`${date}T${time}:00.000Z`);

    if (Number.isNaN(startsAt.getTime())) {
      await interaction.reply({
        content: '❌ The supplied date/time could not be parsed.',
        ephemeral: true,
      });

      return;
    }

    if (startsAt.getTime() <= Date.now()) {
      await interaction.reply({
        content: '❌ The event must be scheduled for a future date/time.',
        ephemeral: true,
      });

      return;
    }

    if (imageUrl) {
      try {
        const parsedImageUrl = new URL(imageUrl);

        if (!['http:', 'https:'].includes(parsedImageUrl.protocol)) {
          throw new Error('Invalid protocol.');
        }
      } catch {
        await interaction.reply({
          content: '❌ The image must be a valid HTTP/HTTPS URL.',
          ephemeral: true,
        });

        return;
      }
    }

    let channelId: string | null = null;

    if (channel) {
      if (channel.type !== ChannelType.GuildText) {
        await interaction.reply({
          content: '❌ The event channel must be a text channel.',
          ephemeral: true,
        });

        return;
      }

      channelId = channel.id;
    }

    const input: CreateEventInput = {
      guildId: interaction.guildId,
      name,
      description,
      startsAt,
      durationMinutes: duration,
      channelId,
      location,
      maxParticipants,
      imageUrl,
      createdBy: interaction.user.id,
    };

    try {
      const event = await createEvent(input);
      
      const eventCard = await buildEventCard(event);
      
      await interaction.reply(eventCard);
    
    } catch (error) {
      console.error('Failed to create event:', error);

      await interaction.reply({
        content:
          '❌ Something went wrong while creating the event. Please try again.',
        ephemeral: true,
      });
    }
  },
};