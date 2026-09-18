import { pool } from '../../database/database.js';

export interface AnnouncementRecord {
  id: number;
  guildId: string;
  channelId: string;
  authorId: string;
  title: string;
  message: string;
  mentionEveryone: boolean;
  scheduledFor: Date;
  sentAt: Date | null;
  createdAt: Date;
}

export async function createScheduledAnnouncement(
  guildId: string,
  channelId: string,
  authorId: string,
  title: string,
  message: string,
  mentionEveryone: boolean,
  scheduledFor: Date,
): Promise<AnnouncementRecord> {
  const result = await pool.query<{
    id: number;
    guild_id: string;
    channel_id: string;
    author_id: string;
    title: string;
    message: string;
    mention_everyone: boolean;
    scheduled_for: Date;
    sent_at: Date | null;
    created_at: Date;
  }>(
    `
    INSERT INTO scheduled_announcements (
      guild_id,
      channel_id,
      author_id,
      title,
      message,
      mention_everyone,
      scheduled_for
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING
      id,
      guild_id,
      channel_id,
      author_id,
      title,
      message,
      mention_everyone,
      scheduled_for,
      sent_at,
      created_at
    `,
    [
      guildId,
      channelId,
      authorId,
      title,
      message,
      mentionEveryone,
      scheduledFor,
    ],
  );

  const row = result.rows[0];

  if (!row) {
    throw new Error('Failed to create scheduled announcement.');
  }

  return {
    id: row.id,
    guildId: row.guild_id,
    channelId: row.channel_id,
    authorId: row.author_id,
    title: row.title,
    message: row.message,
    mentionEveryone: row.mention_everyone,
    scheduledFor: row.scheduled_for,
    sentAt: row.sent_at,
    createdAt: row.created_at,
  };
}

export async function getPendingAnnouncements(): Promise<
  AnnouncementRecord[]
> {
  const result = await pool.query<{
    id: number;
    guild_id: string;
    channel_id: string;
    author_id: string;
    title: string;
    message: string;
    mention_everyone: boolean;
    scheduled_for: Date;
    sent_at: Date | null;
    created_at: Date;
  }>(
    `
    SELECT
      id,
      guild_id,
      channel_id,
      author_id,
      title,
      message,
      mention_everyone,
      scheduled_for,
      sent_at,
      created_at
    FROM scheduled_announcements
    WHERE sent_at IS NULL
      AND scheduled_for <= NOW()
    ORDER BY scheduled_for ASC
    `,
  );

  return result.rows.map((row) => ({
    id: row.id,
    guildId: row.guild_id,
    channelId: row.channel_id,
    authorId: row.author_id,
    title: row.title,
    message: row.message,
    mentionEveryone: row.mention_everyone,
    scheduledFor: row.scheduled_for,
    sentAt: row.sent_at,
    createdAt: row.created_at,
  }));
}

export async function markAnnouncementSent(
  announcementId: number,
): Promise<void> {
  await pool.query(
    `
    UPDATE scheduled_announcements
    SET sent_at = NOW()
    WHERE id = $1
      AND sent_at IS NULL
    `,
    [announcementId],
  );
}

export async function cancelScheduledAnnouncement(
  announcementId: number,
  guildId: string,
): Promise<boolean> {
  const result = await pool.query(
    `
    DELETE FROM scheduled_announcements
    WHERE id = $1
      AND guild_id = $2
      AND sent_at IS NULL
    `,
    [announcementId, guildId],
  );

  return (result.rowCount ?? 0) > 0;
}