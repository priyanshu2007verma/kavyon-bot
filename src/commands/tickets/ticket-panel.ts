import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  ChatInputCommandInteraction,
  EmbedBuilder,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from 'discord.js';

import type { Command } from '../../types/command.js';
import { ensureTicketConfig } from '../../database/repositories/ticketConfigRepository.js';

const data = new SlashCommandBuilder()
  .setName('ticket-panel')
  .setDescription('Create the Kavyon ticket panel.')
  .setDefaultMemberPermissions(
    PermissionFlagsBits.ManageGuild.toString(),
  );

data.addStringOption((option) =>
  option
    .setName('title')
    .setDescription('Title of the ticket panel.')
    .setRequired(false),
);

data.addStringOption((option) =>
  option
    .setName('description')
    .setDescription('Description shown on the ticket panel.')
    .setRequired(false),
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
      !interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)
    ) {
      await interaction.reply({
        content:
          '❌ You need the **Manage Server** permission to create a ticket panel.',
        ephemeral: true,
      });

      return;
    }

    const channel = interaction.guild.channels.cache.get(
      interaction.channelId,
    );

    if (!channel || channel.type !== ChannelType.GuildText) {
      await interaction.reply({
        content:
          '❌ The ticket panel must be created inside a normal text channel.',
        ephemeral: true,
      });

      return;
    }

    await ensureTicketConfig(interaction.guild.id);

    const title =
      interaction.options.getString('title') ?? '🎫 Kavyon Support';

    const description =
      interaction.options.getString('description') ??
      'Need help from the Kavyon team? Click the button below to create a private support ticket.';

    if (title.length > 256) {
      await interaction.reply({
        content: '❌ The panel title cannot exceed 256 characters.',
        ephemeral: true,
      });

      return;
    }

    if (description.length > 4096) {
      await interaction.reply({
        content: '❌ The panel description cannot exceed 4096 characters.',
        ephemeral: true,
      });

      return;
    }

    const embed = new EmbedBuilder()
      .setTitle(title)
      .setDescription(description)
      .addFields({
        name: '📩 Create a Ticket',
        value:
          'Click **Create Ticket** below. A private channel will be created for you.',
      })
      .setFooter({
        text: `Powered by Kavyon • ${interaction.guild.name}`,
      })
      .setTimestamp();

    const button = new ButtonBuilder()
      .setCustomId('ticket:create')
      .setLabel('Create Ticket')
      .setEmoji('🎫')
      .setStyle(ButtonStyle.Primary);

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(button);

    await channel.send({
      embeds: [embed],
      components: [row],
    });

    await interaction.reply({
      content: '✅ Ticket panel created successfully.',
      ephemeral: true,
    });
  },
};

export default command;