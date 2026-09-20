import {
  ChannelType,
  Guild,
  PermissionFlagsBits,
  TextChannel,
} from 'discord.js';

import {
  createTicket,
  getOpenTicketByCreator,
} from '../../database/repositories/ticketRepository.js';
import {
  ensureTicketConfig,
} from '../../database/repositories/ticketConfigRepository.js';

export interface CreateTicketResult {
  status:
    | 'created'
    | 'disabled'
    | 'already_open'
    | 'category_missing'
    | 'creation_failed';

  ticketId?: string;
  channel?: TextChannel;
  existingChannelId?: string;
}

function sanitizeChannelName(username: string): string {
  const sanitized = username
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 70);

  return sanitized || 'user';
}

export async function createUserTicket(
  guild: Guild,
  userId: string,
  username: string,
): Promise<CreateTicketResult> {
  const config = await ensureTicketConfig(guild.id);

  if (!config.ticket_enabled) {
    return {
      status: 'disabled',
    };
  }

  const existingTicket = await getOpenTicketByCreator(
    guild.id,
    userId,
  );

  if (existingTicket) {
    const existingChannel = guild.channels.cache.get(
      existingTicket.channel_id,
    );

    return {
      status: 'already_open',
      existingChannelId:
        existingChannel?.id ?? existingTicket.channel_id,
    };
  }

  if (!config.ticket_category_id) {
    return {
      status: 'category_missing',
    };
  }

  const category = guild.channels.cache.get(
    config.ticket_category_id,
  );

  if (!category || category.type !== ChannelType.GuildCategory) {
    return {
      status: 'category_missing',
    };
  }

  const channelName = `ticket-${sanitizeChannelName(username)}`;

  const permissionOverwrites = [
    {
      id: guild.roles.everyone.id,
      deny: [PermissionFlagsBits.ViewChannel],
    },
    {
      id: userId,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.AttachFiles,
        PermissionFlagsBits.EmbedLinks,
      ],
    },
  ];

  if (config.ticket_support_role_id) {
    const supportRole = guild.roles.cache.get(
      config.ticket_support_role_id,
    );

    if (supportRole) {
      permissionOverwrites.push({
        id: supportRole.id,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory,
          PermissionFlagsBits.AttachFiles,
          PermissionFlagsBits.EmbedLinks,
        ],
      });
    }
  }

  let channel: TextChannel;

  try {
    channel = await guild.channels.create({
      name: channelName,
      type: ChannelType.GuildText,
      parent: category.id,
      permissionOverwrites,
      topic: `Kavyon ticket • Created by ${userId}`,
    });
  } catch (error) {
    console.error('Failed to create ticket channel:', error);

    return {
      status: 'creation_failed',
    };
  }

  try {
    const ticket = await createTicket({
      guildId: guild.id,
      channelId: channel.id,
      creatorId: userId,
      subject: `Support request from ${username}`,
    });

    return {
      status: 'created',
      ticketId: ticket.id,
      channel,
    };
  } catch (error) {
    await channel.delete('Ticket database registration failed').catch(
      () => undefined,
    );

    console.error('Failed to register ticket:', error);

    return {
      status: 'creation_failed',
    };
  }
}