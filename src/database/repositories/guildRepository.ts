import { pool } from '../database.js';

export interface GuildRecord {
  guildId: string;
  guildName: string;
}

export async function ensureGuild(
  guildId: string,
  guildName: string,
): Promise<void> {
  await pool.query(
    `
      INSERT INTO guilds (guild_id, guild_name)
      VALUES ($1, $2)
      ON CONFLICT (guild_id)
      DO UPDATE SET
        guild_name = EXCLUDED.guild_name,
        updated_at = NOW()
    `,
    [guildId, guildName],
  );

  await pool.query(
    `
      INSERT INTO guild_config (guild_id)
      VALUES ($1)
      ON CONFLICT (guild_id) DO NOTHING
    `,
    [guildId],
  );
}

export async function getGuild(
  guildId: string,
): Promise<GuildRecord | null> {
  const result = await pool.query<{
    guild_id: string;
    guild_name: string;
  }>(
    `
      SELECT guild_id, guild_name
      FROM guilds
      WHERE guild_id = $1
    `,
    [guildId],
  );

  const row = result.rows[0];

  if (!row) {
    return null;
  }

  return {
    guildId: row.guild_id,
    guildName: row.guild_name,
  };
}