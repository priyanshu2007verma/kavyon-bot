import { pool } from '../database/database.js';

export interface GuildConfig {
  guildId: string;
  prefix: string;
  welcomeEnabled: boolean;
  welcomeChannelId: string | null;
  announcementsChannelId: string | null;
  logsChannelId: string | null;
  moderationEnabled: boolean;
}

export async function getGuildConfig(
  guildId: string,
): Promise<GuildConfig | null> {
  const result = await pool.query<{
    guild_id: string;
    prefix: string;
    welcome_enabled: boolean;
    welcome_channel_id: string | null;
    announcements_channel_id: string | null;
    logs_channel_id: string | null;
    moderation_enabled: boolean;
  }>(
    `
      SELECT
        guild_id,
        prefix,
        welcome_enabled,
        welcome_channel_id,
        announcements_channel_id,
        logs_channel_id,
        moderation_enabled
      FROM guild_config
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
    prefix: row.prefix,
    welcomeEnabled: row.welcome_enabled,
    welcomeChannelId: row.welcome_channel_id,
    announcementsChannelId: row.announcements_channel_id,
    logsChannelId: row.logs_channel_id,
    moderationEnabled: row.moderation_enabled,
  };
}

export async function updateGuildConfig(
  guildId: string,
  updates: Partial<Omit<GuildConfig, 'guildId'>>,
): Promise<GuildConfig | null> {
  const current = await getGuildConfig(guildId);

  if (!current) {
    return null;
  }

  const next = {
    ...current,
    ...updates,
  };

  await pool.query(
    `
      UPDATE guild_config
      SET
        prefix = $1,
        welcome_enabled = $2,
        welcome_channel_id = $3,
        announcements_channel_id = $4,
        logs_channel_id = $5,
        moderation_enabled = $6,
        updated_at = NOW()
      WHERE guild_id = $7
    `,
    [
      next.prefix,
      next.welcomeEnabled,
      next.welcomeChannelId,
      next.announcementsChannelId,
      next.logsChannelId,
      next.moderationEnabled,
      guildId,
    ],
  );

  return getGuildConfig(guildId);
}