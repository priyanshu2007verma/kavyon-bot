import { pool } from '../database.js';

export type TicketLogAction =
  | 'created'
  | 'closed'
  | 'reopened'
  | 'deleted';

export interface TicketLogRecord {
  id: string;
  ticket_id: string;
  guild_id: string;
  action: TicketLogAction;
  actor_id: string;
  channel_id: string | null;
  details: string | null;
  created_at: Date;
}

export interface CreateTicketLogInput {
  ticketId: string;
  guildId: string;
  action: TicketLogAction;
  actorId: string;
  channelId?: string | null;
  details?: string | null;
}

export async function createTicketLog(
  input: CreateTicketLogInput,
): Promise<TicketLogRecord> {
  const result = await pool.query<TicketLogRecord>(
    `INSERT INTO ticket_logs (
       ticket_id,
       guild_id,
       action,
       actor_id,
       channel_id,
       details
     )
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [
      input.ticketId,
      input.guildId,
      input.action,
      input.actorId,
      input.channelId ?? null,
      input.details ?? null,
    ],
  );

  const log = result.rows[0];

  if (!log) {
    throw new Error('Ticket log was created but no record was returned.');
  }

  return log;
}

export async function getTicketLogs(
  ticketId: string,
): Promise<TicketLogRecord[]> {
  const result = await pool.query<TicketLogRecord>(
    `SELECT *
     FROM ticket_logs
     WHERE ticket_id = $1
     ORDER BY created_at ASC`,
    [ticketId],
  );

  return result.rows;
}

export async function getGuildTicketLogs(
  guildId: string,
  limit = 50,
): Promise<TicketLogRecord[]> {
  const result = await pool.query<TicketLogRecord>(
    `SELECT *
     FROM ticket_logs
     WHERE guild_id = $1
     ORDER BY created_at DESC
     LIMIT $2`,
    [guildId, limit],
  );

  return result.rows;
}