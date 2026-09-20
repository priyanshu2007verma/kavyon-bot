import { pool } from '../database.js';

export type TicketStatus = 'open' | 'closed' | 'deleted';

export interface TicketRecord {
  id: string;
  guild_id: string;
  channel_id: string;
  creator_id: string;
  subject: string;
  status: TicketStatus;
  closed_by: string | null;
  closed_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface CreateTicketInput {
  guildId: string;
  channelId: string;
  creatorId: string;
  subject: string;
}

export async function createTicket(
  input: CreateTicketInput,
): Promise<TicketRecord> {
  const result = await pool.query<TicketRecord>(
    `INSERT INTO tickets (
      guild_id,
      channel_id,
      creator_id,
      subject
    )
    VALUES ($1, $2, $3, $4)
    RETURNING
      id,
      guild_id,
      channel_id,
      creator_id,
      subject,
      status,
      closed_by,
      closed_at,
      created_at,
      updated_at`,
    [input.guildId, input.channelId, input.creatorId, input.subject],
  );

  const ticket = result.rows[0];

  if (!ticket) {
    throw new Error('Ticket was created but no ticket record was returned.');
  }

  return ticket;
}

export async function getTicket(
  ticketId: string,
  guildId: string,
): Promise<TicketRecord | null> {
  const result = await pool.query<TicketRecord>(
    `SELECT
      id,
      guild_id,
      channel_id,
      creator_id,
      subject,
      status,
      closed_by,
      closed_at,
      created_at,
      updated_at
    FROM tickets
    WHERE id = $1
      AND guild_id = $2
    LIMIT 1`,
    [ticketId, guildId],
  );

  return result.rows[0] ?? null;
}

export async function getTicketByChannel(
  channelId: string,
): Promise<TicketRecord | null> {
  const result = await pool.query<TicketRecord>(
    `SELECT
      id,
      guild_id,
      channel_id,
      creator_id,
      subject,
      status,
      closed_by,
      closed_at,
      created_at,
      updated_at
    FROM tickets
    WHERE channel_id = $1
    LIMIT 1`,
    [channelId],
  );

  return result.rows[0] ?? null;
}

export async function getOpenTicketByCreator(
  guildId: string,
  creatorId: string,
): Promise<TicketRecord | null> {
  const result = await pool.query<TicketRecord>(
    `SELECT
      id,
      guild_id,
      channel_id,
      creator_id,
      subject,
      status,
      closed_by,
      closed_at,
      created_at,
      updated_at
    FROM tickets
    WHERE guild_id = $1
      AND creator_id = $2
      AND status = 'open'
    ORDER BY created_at DESC
    LIMIT 1`,
    [guildId, creatorId],
  );

  return result.rows[0] ?? null;
}

export async function getGuildTickets(
  guildId: string,
  status?: TicketStatus,
): Promise<TicketRecord[]> {
  if (status) {
    const result = await pool.query<TicketRecord>(
      `SELECT
        id,
        guild_id,
        channel_id,
        creator_id,
        subject,
        status,
        closed_by,
        closed_at,
        created_at,
        updated_at
      FROM tickets
      WHERE guild_id = $1
        AND status = $2
      ORDER BY created_at DESC`,
      [guildId, status],
    );

    return result.rows;
  }

  const result = await pool.query<TicketRecord>(
    `SELECT
      id,
      guild_id,
      channel_id,
      creator_id,
      subject,
      status,
      closed_by,
      closed_at,
      created_at,
      updated_at
    FROM tickets
    WHERE guild_id = $1
    ORDER BY created_at DESC`,
    [guildId],
  );

  return result.rows;
}

export async function closeTicket(
  ticketId: string,
  guildId: string,
  closedBy: string,
): Promise<TicketRecord | null> {
  const result = await pool.query<TicketRecord>(
    `UPDATE tickets
    SET
      status = 'closed',
      closed_by = $3,
      closed_at = NOW(),
      updated_at = NOW()
    WHERE id = $1
      AND guild_id = $2
      AND status = 'open'
    RETURNING
      id,
      guild_id,
      channel_id,
      creator_id,
      subject,
      status,
      closed_by,
      closed_at,
      created_at,
      updated_at`,
    [ticketId, guildId, closedBy],
  );

  return result.rows[0] ?? null;
}

export async function reopenTicket(
  ticketId: string,
  guildId: string,
): Promise<TicketRecord | null> {
  const result = await pool.query<TicketRecord>(
    `UPDATE tickets
    SET
      status = 'open',
      closed_by = NULL,
      closed_at = NULL,
      updated_at = NOW()
    WHERE id = $1
      AND guild_id = $2
      AND status = 'closed'
    RETURNING
      id,
      guild_id,
      channel_id,
      creator_id,
      subject,
      status,
      closed_by,
      closed_at,
      created_at,
      updated_at`,
    [ticketId, guildId],
  );

  return result.rows[0] ?? null;
}

export async function markTicketDeleted(
  ticketId: string,
  guildId: string,
): Promise<TicketRecord | null> {
  const result = await pool.query<TicketRecord>(
    `UPDATE tickets
    SET
      status = 'deleted',
      updated_at = NOW()
    WHERE id = $1
      AND guild_id = $2
      AND status != 'deleted'
    RETURNING
      id,
      guild_id,
      channel_id,
      creator_id,
      subject,
      status,
      closed_by,
      closed_at,
      created_at,
      updated_at`,
    [ticketId, guildId],
  );

  return result.rows[0] ?? null;
}