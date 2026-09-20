import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from 'discord.js';

import {
  cancelEvent,
  getEvent,
} from '../../database/repositories/eventRepository.js';
import type { Command } from '../../types/command.js';

const data = new SlashCommandBuilder()
  .setName('event-cancel')
  .setDescription('Cancel an existing event')
  .setDefaultMemberPermissions(
    PermissionFlagsBits.ManageEvents.toString(),
  );

data.addStringOption((option) =>
  option
    .setName('event_id')
    .setDescription('The ID of the event to cancel')
    .setRequired(true),
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

    if (
      !interaction.memberPermissions?.has(
        PermissionFlagsBits.ManageEvents,
      )
    ) {
      await interaction.reply({
        content:
          '❌ You need the **Manage Events** permission to cancel events.',
        ephemeral: true,
      });

      return;
    }

    const eventId = interaction.options.getString('event_id', true);

    const existingEvent = await getEvent(
      interaction.guild.id,
      eventId,
    );

    if (!existingEvent) {
      await interaction.reply({
        content: `❌ No event with ID \`${eventId}\` was found.`,
        ephemeral: true,
      });

      return;
    }

    if (existingEvent.status !== 'scheduled') {
      await interaction.reply({
        content: `❌ This event is already **${existingEvent.status}**.`,
        ephemeral: true,
      });

      return;
    }

    const cancelledEvent = await cancelEvent(
      interaction.guild.id,
      eventId,
    );

    if (!cancelledEvent) {
      await interaction.reply({
        content:
          '❌ The event could not be cancelled. It may have already been changed.',
        ephemeral: true,
      });

      return;
    }

    const startTimestamp = Math.floor(
      new Date(cancelledEvent.starts_at).getTime() / 1000,
    );

    const embed = new EmbedBuilder()
      .setTitle(`🔴 Event Cancelled`)
      .setDescription(
        `**${cancelledEvent.name}** has been cancelled.`,
      )
      .addFields(
        {
          name: '📅 Originally Scheduled',
          value: `<t:${startTimestamp}:F>`,
          inline: true,
        },
        {
          name: '📢 Status',
          value: '🔴 Cancelled',
          inline: true,
        },
        {
          name: '🆔 Event ID',
          value: `\`${cancelledEvent.id}\``,
          inline: true,
        },
      )
      .setFooter({
        text: `Cancelled by ${interaction.user.username}`,
      })
      .setTimestamp();

    await interaction.reply({
      embeds: [embed],
    });
  },
};

export default command;