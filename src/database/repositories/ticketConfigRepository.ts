import { pool } from '../database.js';

export interface TicketConfig {
  guild_id: string;
  ticket_enabled: boolean;
  ticket_category_id: string | null;
  ticket_support_role_id: string | null;
  ticket_logs_channel_id: string | null;
}

export async function getTicketConfig(
  guildId: string,
): Promise<TicketConfig | null> {
  const result = await pool.query<TicketConfig>(
    `SELECT
      guild_id,
      ticket_enabled,
      ticket_category_id,
      ticket_support_role_id,
      ticket_logs_channel_id
    FROM guild_config
    WHERE guild_id = $1
    LIMIT 1`,
    [guildId],
  );

  return result.rows[0] ?? null;
}

export async function ensureTicketConfig(
  guildId: string,
): Promise<TicketConfig> {
  const result = await pool.query<TicketConfig>(
    `INSERT INTO guild_config (
      guild_id,
      ticket_enabled
    )
    VALUES ($1, TRUE)
    ON CONFLICT (guild_id)
    DO UPDATE SET
      updated_at = NOW()
    RETURNING
      guild_id,
      ticket_enabled,
      ticket_category_id,
      ticket_support_role_id,
      ticket_logs_channel_id`,
    [guildId],
  );

  const config = result.rows[0];

  if (!config) {
    throw new Error(
      'Ticket configuration could not be loaded after initialization.',
    );
  }

  return config;
}

export async function updateTicketConfig(
  guildId: string,
  updates: {
    ticketEnabled?: boolean;
    ticketCategoryId?: string | null;
    ticketSupportRoleId?: string | null;
    ticketLogsChannelId?: string | null;
  },
): Promise<TicketConfig> {
  const result = await pool.query<TicketConfig>(
    `UPDATE guild_config
    SET
      ticket_enabled = COALESCE($2, ticket_enabled),
      ticket_category_id = COALESCE($3, ticket_category_id),
      ticket_support_role_id = COALESCE($4, ticket_support_role_id),
      ticket_logs_channel_id = COALESCE($5, ticket_logs_channel_id),
      updated_at = NOW()
    WHERE guild_id = $1
    RETURNING
      guild_id,
      ticket_enabled,
      ticket_category_id,
      ticket_support_role_id,
      ticket_logs_channel_id`,
    [
      guildId,
      updates.ticketEnabled ?? null,
      updates.ticketCategoryId ?? null,
      updates.ticketSupportRoleId ?? null,
      updates.ticketLogsChannelId ?? null,
    ],
  );

  const config = result.rows[0];

  if (!config) {
    throw new Error(
      'Guild configuration was not found. Initialize the guild first.',
    );
  }

  return config;
}