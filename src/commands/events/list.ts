import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
} from 'discord.js';

import { getUpcomingEvents } from '../../database/repositories/eventRepository.js';
import type { Command } from '../../types/command.js';

const command: Command = {
  data: new SlashCommandBuilder()
    .setName('event-list')
    .setDescription('View upcoming events'),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!interaction.guild) {
      await interaction.reply({
        content: 'This command can only be used inside a server.',
        ephemeral: true,
      });

      return;
    }

    const events = await getUpcomingEvents(interaction.guild.id, 10);

    if (events.length === 0) {
      await interaction.reply({
        content: '📅 There are no upcoming events right now.',
        ephemeral: true,
      });

      return;
    }

    const embed = new EmbedBuilder()
      .setTitle('📅 Upcoming Kavyon Events')
      .setDescription(
        `Here are the next ${events.length} scheduled event${
          events.length === 1 ? '' : 's'
        }.`,
      )
      .setTimestamp();

    for (const event of events) {
      const timestamp = Math.floor(
        new Date(event.starts_at).getTime() / 1000,
      );

      const duration = event.duration_minutes
        ? `${event.duration_minutes} min`
        : 'Not specified';

      const participants = event.max_participants
        ? `Max ${event.max_participants}`
        : 'Unlimited';

      embed.addFields({
        name: `🎉 ${event.name}`,
        value: [
          `📅 <t:${timestamp}:F>`,
          `⏳ <t:${timestamp}:R>`,
          `⏱ ${duration}`,
          `👥 ${participants}`,
          `🆔 Event ID: \`${event.id}\``,
        ].join('\n'),
        inline: false,
      });
    }

    await interaction.reply({
      embeds: [embed],
    });
  },
};

export default command;