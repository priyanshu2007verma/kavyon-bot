import { pool } from '../database.js';

export interface UserRecord {
  userId: string;
  guildId: string;
  username: string;
  xp: number;
  level: number;
  coins: number;
}

export async function ensureUser(
  userId: string,
  guildId: string,
  username: string,
): Promise<void> {
  await pool.query(
    `
      INSERT INTO users (
        user_id,
        guild_id,
        username
      )
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id, guild_id)
      DO UPDATE SET
        username = EXCLUDED.username,
        updated_at = NOW()
    `,
    [userId, guildId, username],
  );
}

export async function getUser(
  userId: string,
  guildId: string,
): Promise<UserRecord | null> {
  const result = await pool.query<{
    user_id: string;
    guild_id: string;
    username: string;
    xp: string;
    level: number;
    coins: string;
  }>(
    `
      SELECT
        user_id,
        guild_id,
        username,
        xp,
        level,
        coins
      FROM users
      WHERE user_id = $1
        AND guild_id = $2
    `,
    [userId, guildId],
  );

  const row = result.rows[0];

  if (!row) {
    return null;
  }

  return {
    userId: row.user_id,
    guildId: row.guild_id,
    username: row.username,
    xp: Number(row.xp),
    level: row.level,
    coins: Number(row.coins),
  };
}