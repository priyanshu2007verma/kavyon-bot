import {
  ActionRowBuilder,
  AttachmentBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  EmbedBuilder,
  PermissionFlagsBits,
  TextChannel,
} from 'discord.js';

import {
  closeTicket,
  getTicket,
  markTicketDeleted,
  reopenTicket,
} from '../../database/repositories/ticketRepository.js';
import { getTicketConfig } from '../../database/repositories/ticketConfigRepository.js';
import { createTicketLog } from '../../database/repositories/ticketLogRepository.js';
import { createUserTicket } from './ticketService.js';
import { generateTicketTranscript } from './ticketTranscript.js';

export async function handleTicketButton(
  interaction: ButtonInteraction,
): Promise<boolean> {
  if (!interaction.customId.startsWith('ticket:')) {
    return false;
  }

  if (!interaction.guild) {
    await interaction.reply({
      content: '❌ Tickets can only be used inside a server.',
      ephemeral: true,
    });

    return true;
  }

  if (interaction.customId === 'ticket:create') {
    await handleCreateTicket(interaction);
    return true;
  }

  if (interaction.customId.startsWith('ticket:close:')) {
    const ticketId = interaction.customId.split(':')[2];

    if (!ticketId) {
      await interaction.reply({
        content: '❌ Invalid ticket ID.',
        ephemeral: true,
      });

      return true;
    }

    await handleCloseTicket(interaction, ticketId);
    return true;
  }

  if (interaction.customId.startsWith('ticket:reopen:')) {
    const ticketId = interaction.customId.split(':')[2];

    if (!ticketId) {
      await interaction.reply({
        content: '❌ Invalid ticket ID.',
        ephemeral: true,
      });

      return true;
    }

    await handleReopenTicket(interaction, ticketId);
    return true;
  }

  if (interaction.customId.startsWith('ticket:delete:')) {
    const ticketId = interaction.customId.split(':')[2];

    if (!ticketId) {
      await interaction.reply({
        content: '❌ Invalid ticket ID.',
        ephemeral: true,
      });

      return true;
    }

    await handleDeleteTicket(interaction, ticketId);
    return true;
  }

  return false;
}

async function handleCreateTicket(
  interaction: ButtonInteraction,
): Promise<void> {
  await interaction.deferReply({
    ephemeral: true,
  });

  const result = await createUserTicket(
    interaction.guild!,
    interaction.user.id,
    interaction.user.username,
  );

  if (result.status === 'disabled') {
    await interaction.editReply({
      content: '❌ Tickets are currently disabled.',
    });

    return;
  }

  if (result.status === 'already_open') {
    await interaction.editReply({
      content: `❌ You already have an open ticket: <#${result.existingChannelId}>`,
    });

    return;
  }

  if (result.status === 'category_missing') {
    await interaction.editReply({
      content: '❌ The ticket category has not been configured yet.',
    });

    return;
  }

  if (result.status === 'creation_failed') {
    await interaction.editReply({
      content:
        '❌ I could not create your ticket. Please try again later.',
    });

    return;
  }

  if (!result.channel || !result.ticketId) {
    await interaction.editReply({
      content:
        '❌ The ticket was created but its information could not be loaded.',
    });

    return;
  }

  const embed = new EmbedBuilder()
    .setTitle('🎫 Kavyon Support Ticket')
    .setDescription(
      `Welcome ${interaction.user}!\n\n` +
        'Please describe your issue and a member of the support team will assist you.',
    )
    .addFields(
      {
        name: '📋 Ticket ID',
        value: `\`#${result.ticketId}\``,
        inline: true,
      },
      {
        name: '👤 Created By',
        value: `${interaction.user}`,
        inline: true,
      },
    )
    .setFooter({
      text: 'Kavyon Support',
    })
    .setTimestamp();

  const closeButton = new ButtonBuilder()
    .setCustomId(`ticket:close:${result.ticketId}`)
    .setLabel('Close Ticket')
    .setEmoji('🔒')
    .setStyle(ButtonStyle.Danger);

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    closeButton,
  );

  await result.channel.send({
    content: `${interaction.user}`,
    embeds: [embed],
    components: [row],
    allowedMentions: {
      users: [interaction.user.id],
    },
  });

  await createTicketLog({
    ticketId: result.ticketId,
    guildId: interaction.guild!.id,
    action: 'created',
    actorId: interaction.user.id,
    channelId: result.channel.id,
    details: `Ticket created by ${interaction.user.username}.`,
  }).catch((error) => {
    console.error('Failed to create ticket creation log:', error);
  });

  await interaction.editReply({
    content: `✅ Your ticket has been created: ${result.channel}`,
  });
}

async function handleCloseTicket(
  interaction: ButtonInteraction,
  ticketId: string,
): Promise<void> {
  await interaction.deferReply({
    ephemeral: true,
  });

  const ticket = await getTicket(
    ticketId,
    interaction.guild!.id,
  );

  if (!ticket) {
    await interaction.editReply({
      content: '❌ This ticket no longer exists in the database.',
    });

    return;
  }

  if (ticket.channel_id !== interaction.channelId) {
    await interaction.editReply({
      content: '❌ This button does not belong to this ticket channel.',
    });

    return;
  }

  if (ticket.status !== 'open') {
    await interaction.editReply({
      content: '❌ This ticket is already closed.',
    });

    return;
  }

  const config = await getTicketConfig(interaction.guild!.id);

  const isCreator = ticket.creator_id === interaction.user.id;

  const member = await interaction.guild!.members.fetch(
    interaction.user.id,
  );

  const isSupport = Boolean(
    config?.ticket_support_role_id &&
      member.roles.cache.has(config.ticket_support_role_id),
  );

  const isManager = interaction.memberPermissions?.has(
    PermissionFlagsBits.ManageGuild,
  );

  if (!isCreator && !isSupport && !isManager) {
    await interaction.editReply({
      content:
        '❌ Only the ticket creator, support staff, or server managers can close this ticket.',
    });

    return;
  }

  const closedTicket = await closeTicket(
    ticket.id,
    interaction.guild!.id,
    interaction.user.id,
  );

  if (!closedTicket) {
    await interaction.editReply({
      content:
        '❌ The ticket could not be closed. It may have already been closed.',
    });

    return;
  }

  await createTicketLog({
    ticketId: ticket.id,
    guildId: interaction.guild!.id,
    action: 'closed',
    actorId: interaction.user.id,
    channelId: interaction.channelId,
    details: `Ticket closed by ${interaction.user.username}.`,
  }).catch((error) => {
    console.error('Failed to create ticket closure log:', error);
  });

  const channel = interaction.channel;

  if (channel && 'setName' in channel) {
    const currentName = 'name' in channel ? channel.name : 'ticket';

    if (!currentName.startsWith('closed-')) {
      await channel
        .setName(
          `closed-${currentName.replace(/^ticket-/, '').slice(0, 85)}`,
          'Ticket closed',
        )
        .catch(() => undefined);
    }
  }

  if (channel && 'permissionOverwrites' in channel) {
    await channel.permissionOverwrites
      .edit(ticket.creator_id, {
        SendMessages: false,
      })
      .catch(() => undefined);
  }

  const reopenButton = new ButtonBuilder()
    .setCustomId(`ticket:reopen:${ticket.id}`)
    .setLabel('Reopen Ticket')
    .setEmoji('🔓')
    .setStyle(ButtonStyle.Success);

  const deleteButton = new ButtonBuilder()
    .setCustomId(`ticket:delete:${ticket.id}`)
    .setLabel('Delete Ticket')
    .setEmoji('🗑️')
    .setStyle(ButtonStyle.Danger);

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    reopenButton,
    deleteButton,
  );

  if (channel && 'send' in channel) {
    await channel.send({
      embeds: [
        new EmbedBuilder()
          .setTitle('🔒 Ticket Closed')
          .setDescription(
            `This ticket was closed by ${interaction.user}.`,
          )
          .setColor(0xff0000)
          .setTimestamp(),
      ],
      components: [row],
    });
  }

  await interaction.editReply({
    content: '🔒 Ticket closed successfully.',
  });
}

async function handleReopenTicket(
  interaction: ButtonInteraction,
  ticketId: string,
): Promise<void> {
  await interaction.deferReply({
    ephemeral: true,
  });

  const ticket = await getTicket(
    ticketId,
    interaction.guild!.id,
  );

  if (!ticket) {
    await interaction.editReply({
      content: '❌ This ticket no longer exists in the database.',
    });

    return;
  }

  if (ticket.channel_id !== interaction.channelId) {
    await interaction.editReply({
      content: '❌ This button does not belong to this ticket channel.',
    });

    return;
  }

  if (ticket.status !== 'closed') {
    await interaction.editReply({
      content: '❌ This ticket is not currently closed.',
    });

    return;
  }

  const config = await getTicketConfig(interaction.guild!.id);

  const isCreator = ticket.creator_id === interaction.user.id;

  const member = await interaction.guild!.members.fetch(
    interaction.user.id,
  );

  const isSupport = Boolean(
    config?.ticket_support_role_id &&
      member.roles.cache.has(config.ticket_support_role_id),
  );

  const isManager = interaction.memberPermissions?.has(
    PermissionFlagsBits.ManageGuild,
  );

  if (!isCreator && !isSupport && !isManager) {
    await interaction.editReply({
      content:
        '❌ Only the ticket creator, support staff, or server managers can reopen this ticket.',
    });

    return;
  }

  const reopenedTicket = await reopenTicket(
    ticket.id,
    interaction.guild!.id,
  );

  if (!reopenedTicket) {
    await interaction.editReply({
      content:
        '❌ The ticket could not be reopened. It may already be open.',
    });

    return;
  }

  await createTicketLog({
    ticketId: ticket.id,
    guildId: interaction.guild!.id,
    action: 'reopened',
    actorId: interaction.user.id,
    channelId: interaction.channelId,
    details: `Ticket reopened by ${interaction.user.username}.`,
  }).catch((error) => {
    console.error('Failed to create ticket reopen log:', error);
  });

  const channel = interaction.channel;

  if (channel && 'setName' in channel) {
    const currentName = 'name' in channel ? channel.name : 'ticket';

    if (currentName.startsWith('closed-')) {
      await channel
        .setName(
          `ticket-${currentName
            .replace(/^closed-/, '')
            .slice(0, 80)}`,
          'Ticket reopened',
        )
        .catch(() => undefined);
    }
  }

  if (channel && 'permissionOverwrites' in channel) {
    await channel.permissionOverwrites
      .edit(ticket.creator_id, {
        ViewChannel: true,
        SendMessages: true,
        ReadMessageHistory: true,
      })
      .catch(() => undefined);
  }

  const closeButton = new ButtonBuilder()
    .setCustomId(`ticket:close:${ticket.id}`)
    .setLabel('Close Ticket')
    .setEmoji('🔒')
    .setStyle(ButtonStyle.Danger);

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    closeButton,
  );

  if (channel && 'send' in channel) {
    await channel.send({
      embeds: [
        new EmbedBuilder()
          .setTitle('🔓 Ticket Reopened')
          .setDescription(
            `This ticket was reopened by ${interaction.user}.`,
          )
          .setColor(0x00ff00)
          .setTimestamp(),
      ],
      components: [row],
    });
  }

  await interaction.editReply({
    content: '🔓 Ticket reopened successfully.',
  });
}

async function handleDeleteTicket(
  interaction: ButtonInteraction,
  ticketId: string,
): Promise<void> {
  await interaction.deferReply({
    ephemeral: true,
  });

  try {
    const guild = interaction.guild;

    if (!guild) {
      await interaction.editReply({
        content: '❌ This ticket can only be deleted inside a server.',
      });

      return;
    }

    const ticket = await getTicket(ticketId, guild.id);

    if (!ticket) {
      await interaction.editReply({
        content: '❌ This ticket no longer exists in the database.',
      });

      return;
    }

    if (ticket.channel_id !== interaction.channelId) {
      await interaction.editReply({
        content: '❌ This button does not belong to this ticket channel.',
      });

      return;
    }

    const config = await getTicketConfig(guild.id);

    const member = await guild.members.fetch(interaction.user.id);

    const isSupport = Boolean(
      config?.ticket_support_role_id &&
        member.roles.cache.has(config.ticket_support_role_id),
    );

    const isManager = interaction.memberPermissions?.has(
      PermissionFlagsBits.ManageGuild,
    );

    if (!isSupport && !isManager) {
      await interaction.editReply({
        content:
          '❌ Only support staff or server managers can permanently delete tickets.',
      });

      return;
    }

    /*
     * The ticket must be a text channel because the transcript
     * generator reads Discord messages from the channel.
     */
    const channel = interaction.channel;

    if (!channel || !(channel instanceof TextChannel)) {
      await interaction.editReply({
        content:
          '❌ This ticket channel does not support transcript generation.',
      });

      return;
    }

    /*
     * Generate the transcript BEFORE deleting anything.
     */
    const transcript = await generateTicketTranscript(channel);

    /*
     * The ticket logs channel is configured through /ticket-config.
     */
    if (!config?.ticket_logs_channel_id) {
      await interaction.editReply({
        content:
          '❌ Ticket logs channel is not configured. Configure it with `/ticket-config` before deleting tickets.',
      });

      return;
    }

    const logsChannel = await guild.channels
      .fetch(config.ticket_logs_channel_id)
      .catch(() => null);

    if (!logsChannel || !(logsChannel instanceof TextChannel)) {
      await interaction.editReply({
        content:
          '❌ The configured ticket logs channel could not be found or is not a text channel.',
      });

      return;
    }

    /*
     * Create the transcript file in memory.
     */
    const transcriptAttachment = new AttachmentBuilder(
      Buffer.from(transcript.content, 'utf8'),
      {
        name: transcript.filename,
      },
    );

    /*
     * Send the transcript to the configured logs channel.
     */
    await logsChannel.send({
      embeds: [
        new EmbedBuilder()
          .setTitle('🎫 Ticket Transcript')
          .setDescription(
            `Transcript for ticket **#${ticket.id}**`,
          )
          .addFields(
            {
              name: 'Ticket ID',
              value: `\`${ticket.id}\``,
              inline: true,
            },
            {
              name: 'Created By',
              value: `<@${ticket.creator_id}>`,
              inline: true,
            },
            {
              name: 'Deleted By',
              value: `${interaction.user}`,
              inline: true,
            },
            {
              name: 'Messages',
              value: `${transcript.messageCount}`,
              inline: true,
            },
            {
              name: 'Channel',
              value: `\`${channel.name}\``,
              inline: true,
            },
          )
          .setColor(0xff0000)
          .setTimestamp(),
      ],
      files: [transcriptAttachment],
    });

    /*
     * Mark the ticket as deleted only after the transcript
     * has successfully reached the logs channel.
     */
    const deletedTicket = await markTicketDeleted(
      ticket.id,
      guild.id,
    );

    if (!deletedTicket) {
      await interaction.editReply({
        content:
          '❌ The transcript was saved, but the ticket could not be marked as deleted.',
      });

      return;
    }

    /*
     * Record the deletion in the database audit log.
     */
    await createTicketLog({
      ticketId: ticket.id,
      guildId: guild.id,
      action: 'deleted',
      actorId: interaction.user.id,
      channelId: interaction.channelId,
      details:
        `Ticket permanently deleted by ${interaction.user.username}. ` +
        `Transcript saved with ${transcript.messageCount} messages.`,
    }).catch((error) => {
      console.error('Failed to create ticket deletion log:', error);
    });

    /*
     * Confirm before deleting the Discord channel.
     */
    await interaction.editReply({
      content:
        `🗑️ Ticket deleted successfully. Transcript saved with ${transcript.messageCount} messages.`,
    });

    /*
     * Finally delete the Discord channel.
     */
    await channel
      .delete('Ticket permanently deleted')
      .catch((error) => {
        console.error('Failed to delete ticket channel:', error);
      });
  } catch (error) {
    console.error('Ticket deletion failed:', error);

    if (interaction.deferred || interaction.replied) {
      await interaction
        .editReply({
          content:
            '❌ Something went wrong while creating the ticket transcript. The ticket was NOT deleted.',
        })
        .catch(() => undefined);
    }
  }
}