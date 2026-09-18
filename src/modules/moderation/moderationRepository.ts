import { pool } from '../../database/database.js';

export interface WarningRecord {
  id: number;
  guildId: string;
  userId: string;
  moderatorId: string;
  reason: string;
  createdAt: Date;
}

export async function createWarning(
  guildId: string,
  userId: string,
  moderatorId: string,
  reason: string,
): Promise<WarningRecord> {
  const result = await pool.query<{
    id: number;
    guild_id: string;
    user_id: string;
    moderator_id: string;
    reason: string;
    created_at: Date;
  }>(
    `
      INSERT INTO warnings (
        guild_id,
        user_id,
        moderator_id,
        reason
      )
      VALUES ($1, $2, $3, $4)
      RETURNING
        id,
        guild_id,
        user_id,
        moderator_id,
        reason,
        created_at
    `,
    [guildId, userId, moderatorId, reason],
  );

  const row = result.rows[0];

  if (!row) {
    throw new Error('Failed to create warning.');
  }

  return {
    id: row.id,
    guildId: row.guild_id,
    userId: row.user_id,
    moderatorId: row.moderator_id,
    reason: row.reason,
    createdAt: row.created_at,
  };
}

export async function getWarnings(
  guildId: string,
  userId: string,
): Promise<WarningRecord[]> {
  const result = await pool.query<{
    id: number;
    guild_id: string;
    user_id: string;
    moderator_id: string;
    reason: string;
    created_at: Date;
  }>(
    `
      SELECT
        id,
        guild_id,
        user_id,
        moderator_id,
        reason,
        created_at
      FROM warnings
      WHERE guild_id = $1
        AND user_id = $2
      ORDER BY created_at DESC
    `,
    [guildId, userId],
  );

  return result.rows.map((row) => ({
    id: row.id,
    guildId: row.guild_id,
    userId: row.user_id,
    moderatorId: row.moderator_id,
    reason: row.reason,
    createdAt: row.created_at,
  }));
}

export async function clearWarnings(
  guildId: string,
  userId: string,
): Promise<number> {
  const result = await pool.query(
    `
      DELETE FROM warnings
      WHERE guild_id = $1
        AND user_id = $2
    `,
    [guildId, userId],
  );

  return result.rowCount ?? 0;
}

export async function createModerationLog(
  guildId: string,
  action: string,
  targetUserId: string | null,
  moderatorId: string,
  reason?: string,
): Promise<void> {
  await pool.query(
    `
      INSERT INTO moderation_logs (
        guild_id,
        action,
        target_user_id,
        moderator_id,
        reason
      )
      VALUES ($1, $2, $3, $4, $5)
    `,
    [
      guildId,
      action,
      targetUserId,
      moderatorId,
      reason ?? null,
    ],
  );
}