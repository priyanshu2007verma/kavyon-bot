import {
  ChannelType,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from 'discord.js';

import type { Command } from '../../types/command.js';
import {
  ensureTicketConfig,
  updateTicketConfig,
} from '../../database/repositories/ticketConfigRepository.js';

const data = new SlashCommandBuilder()
  .setName('ticket-config')
  .setDescription('Configure the Kavyon ticket system.')
  .setDefaultMemberPermissions(
    PermissionFlagsBits.ManageGuild.toString(),
  );

data.addBooleanOption((option) =>
  option
    .setName('enabled')
    .setDescription('Enable or disable the ticket system.')
    .setRequired(false),
);

data.addChannelOption((option) =>
  option
    .setName('category')
    .setDescription('Category where ticket channels will be created.')
    .addChannelTypes(ChannelType.GuildCategory)
    .setRequired(false),
);

data.addRoleOption((option) =>
  option
    .setName('support_role')
    .setDescription('Role that can access support tickets.')
    .setRequired(false),
);

data.addChannelOption((option) =>
  option
    .setName('logs')
    .setDescription('Channel where ticket logs will eventually be sent.')
    .addChannelTypes(ChannelType.GuildText)
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
      !interaction.memberPermissions?.has(
        PermissionFlagsBits.ManageGuild,
      )
    ) {
      await interaction.reply({
        content:
          '❌ You need the **Manage Server** permission to configure tickets.',
        ephemeral: true,
      });

      return;
    }

    const enabled = interaction.options.getBoolean('enabled');
    const category = interaction.options.getChannel('category');
    const supportRole = interaction.options.getRole('support_role');
    const logs = interaction.options.getChannel('logs');

    if (!enabled && enabled !== false && !category && !supportRole && !logs) {
      const config = await ensureTicketConfig(interaction.guild.id);

      await interaction.reply({
        content:
          `🎫 **Ticket Configuration**\n\n` +
          `Status: **${config.ticket_enabled ? 'Enabled' : 'Disabled'}**\n` +
          `Category: ${
            config.ticket_category_id
              ? `<#${config.ticket_category_id}>`
              : 'Not configured'
          }\n` +
          `Support Role: ${
            config.ticket_support_role_id
              ? `<@&${config.ticket_support_role_id}>`
              : 'Not configured'
          }\n` +
          `Logs: ${
            config.ticket_logs_channel_id
              ? `<#${config.ticket_logs_channel_id}>`
              : 'Not configured'
          }`,
        ephemeral: true,
      });

      return;
    }

    if (category && category.type !== ChannelType.GuildCategory) {
      await interaction.reply({
        content: '❌ The selected category is not a valid category.',
        ephemeral: true,
      });

      return;
    }

    if (logs && logs.type !== ChannelType.GuildText) {
      await interaction.reply({
        content:
          '❌ The selected logs channel is not a normal text channel.',
        ephemeral: true,
      });

      return;
    }

    await ensureTicketConfig(interaction.guild.id);

    const updates: {
      ticketEnabled?: boolean;
      ticketCategoryId?: string | null;
      ticketSupportRoleId?: string | null;
      ticketLogsChannelId?: string | null;
    } = {};

    if (enabled !== null) {
      updates.ticketEnabled = enabled;
    }

    if (category) {
      updates.ticketCategoryId = category.id;
    }

    if (supportRole) {
      updates.ticketSupportRoleId = supportRole.id;
    }

    if (logs) {
      updates.ticketLogsChannelId = logs.id;
    }

    const config = await updateTicketConfig(
      interaction.guild.id,
      updates,
    );

    await interaction.reply({
      content:
        `✅ **Ticket configuration updated.**\n\n` +
        `Status: **${config.ticket_enabled ? 'Enabled' : 'Disabled'}**\n` +
        `Category: ${
          config.ticket_category_id
            ? `<#${config.ticket_category_id}>`
            : 'Not configured'
        }\n` +
        `Support Role: ${
          config.ticket_support_role_id
            ? `<@&${config.ticket_support_role_id}>`
            : 'Not configured'
        }\n` +
        `Logs: ${
          config.ticket_logs_channel_id
            ? `<#${config.ticket_logs_channel_id}>`
            : 'Not configured'
        }`,
      ephemeral: true,
    });
  },
};

export default command;