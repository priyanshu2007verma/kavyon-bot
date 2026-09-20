import { pool } from '../database.js';

export type EventStatus = 'scheduled' | 'cancelled' | 'completed';

export interface EventRecord {
  id: string;
  guild_id: string;
  name: string;
  description: string;
  starts_at: Date;
  duration_minutes: number | null;
  channel_id: string | null;
  location: string | null;
  max_participants: number | null;
  image_url: string | null;
  status: EventStatus;
  created_by: string;
  created_at: Date;
  updated_at: Date;
}

export interface EventParticipantRecord {
  event_id: string;
  guild_id: string;
  discord_user_id: string;
  joined_at: Date;
}

export interface CreateEventInput {
  guildId: string;
  name: string;
  description: string;
  startsAt: Date;
  durationMinutes?: number | null;
  channelId?: string | null;
  location?: string | null;
  maxParticipants?: number | null;
  imageUrl?: string | null;
  createdBy: string;
}

export async function createEvent(
  input: CreateEventInput,
): Promise<EventRecord> {
  const result = await pool.query<EventRecord>(
    `
      INSERT INTO events (
        guild_id,
        name,
        description,
        starts_at,
        duration_minutes,
        channel_id,
        location,
        max_participants,
        image_url,
        created_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `,
    [
      input.guildId,
      input.name,
      input.description,
      input.startsAt,
      input.durationMinutes ?? null,
      input.channelId ?? null,
      input.location ?? null,
      input.maxParticipants ?? null,
      input.imageUrl ?? null,
      input.createdBy,
    ],
  );

  const event = result.rows[0];

  if (!event) {
    throw new Error('Failed to create event.');
  }

  return event;
}

export async function getEvent(
  guildId: string,
  eventId: string,
): Promise<EventRecord | null> {
  const result = await pool.query<EventRecord>(
    `
      SELECT *
      FROM events
      WHERE guild_id = $1
        AND id = $2
      LIMIT 1
    `,
    [guildId, eventId],
  );

  return result.rows[0] ?? null;
}

export async function getUpcomingEvents(
  guildId: string,
  limit = 10,
): Promise<EventRecord[]> {
  const result = await pool.query<EventRecord>(
    `
      SELECT *
      FROM events
      WHERE guild_id = $1
        AND status = 'scheduled'
        AND starts_at >= NOW()
      ORDER BY starts_at ASC
      LIMIT $2
    `,
    [guildId, limit],
  );

  return result.rows;
}

export async function updateEvent(
  guildId: string,
  eventId: string,
  updates: {
    name?: string;
    description?: string;
    startsAt?: Date;
    durationMinutes?: number | null;
    channelId?: string | null;
    location?: string | null;
    maxParticipants?: number | null;
    imageUrl?: string | null;
  },
): Promise<EventRecord | null> {
  const fields: string[] = [];
  const values: unknown[] = [];

  if (updates.name !== undefined) {
    fields.push(`name = $${values.length + 1}`);
    values.push(updates.name);
  }

  if (updates.description !== undefined) {
    fields.push(`description = $${values.length + 1}`);
    values.push(updates.description);
  }

  if (updates.startsAt !== undefined) {
    fields.push(`starts_at = $${values.length + 1}`);
    values.push(updates.startsAt);
  }

  if (updates.durationMinutes !== undefined) {
    fields.push(`duration_minutes = $${values.length + 1}`);
    values.push(updates.durationMinutes);
  }

  if (updates.channelId !== undefined) {
    fields.push(`channel_id = $${values.length + 1}`);
    values.push(updates.channelId);
  }

  if (updates.location !== undefined) {
    fields.push(`location = $${values.length + 1}`);
    values.push(updates.location);
  }

  if (updates.maxParticipants !== undefined) {
    fields.push(`max_participants = $${values.length + 1}`);
    values.push(updates.maxParticipants);
  }

  if (updates.imageUrl !== undefined) {
    fields.push(`image_url = $${values.length + 1}`);
    values.push(updates.imageUrl);
  }

  if (fields.length === 0) {
    return getEvent(guildId, eventId);
  }

  fields.push('updated_at = NOW()');

  values.push(guildId);
  const guildIdParam = `$${values.length}`;

  values.push(eventId);
  const eventIdParam = `$${values.length}`;

  const result = await pool.query<EventRecord>(
    `
      UPDATE events
      SET ${fields.join(', ')}
      WHERE guild_id = ${guildIdParam}
        AND id = ${eventIdParam}
      RETURNING *
    `,
    values,
  );

  return result.rows[0] ?? null;
}

export async function cancelEvent(
  guildId: string,
  eventId: string,
): Promise<EventRecord | null> {
  const result = await pool.query<EventRecord>(
    `
      UPDATE events
      SET
        status = 'cancelled',
        updated_at = NOW()
      WHERE guild_id = $1
        AND id = $2
        AND status = 'scheduled'
      RETURNING *
    `,
    [guildId, eventId],
  );

  return result.rows[0] ?? null;
}

export async function addParticipant(
  guildId: string,
  eventId: string,
  discordUserId: string,
): Promise<EventParticipantRecord> {
  const result = await pool.query<EventParticipantRecord>(
    `
      INSERT INTO event_participants (
        event_id,
        guild_id,
        discord_user_id
      )
      VALUES ($1, $2, $3)
      RETURNING *
    `,
    [eventId, guildId, discordUserId],
  );

  const participant = result.rows[0];

  if (!participant) {
    throw new Error('Failed to add event participant.');
  }

  return participant;
}

export async function removeParticipant(
  guildId: string,
  eventId: string,
  discordUserId: string,
): Promise<boolean> {
  const result = await pool.query(
    `
      DELETE FROM event_participants
      WHERE event_id = $1
        AND guild_id = $2
        AND discord_user_id = $3
    `,
    [eventId, guildId, discordUserId],
  );

  return result.rowCount === 1;
}

export async function getEventParticipants(
  guildId: string,
  eventId: string,
): Promise<EventParticipantRecord[]> {
  const result = await pool.query<EventParticipantRecord>(
    `
      SELECT *
      FROM event_participants
      WHERE guild_id = $1
        AND event_id = $2
      ORDER BY joined_at ASC
    `,
    [guildId, eventId],
  );

  return result.rows;
}

export async function isParticipant(
  guildId: string,
  eventId: string,
  discordUserId: string,
): Promise<boolean> {
  const result = await pool.query<{ exists: boolean }>(
    `
      SELECT EXISTS (
        SELECT 1
        FROM event_participants
        WHERE guild_id = $1
          AND event_id = $2
          AND discord_user_id = $3
      ) AS exists
    `,
    [guildId, eventId, discordUserId],
  );

  return result.rows[0]?.exists ?? false;
}

export async function getParticipantCount(
  guildId: string,
  eventId: string,
): Promise<number> {
  const result = await pool.query<{ count: string }>(
    `
      SELECT COUNT(*)::text AS count
      FROM event_participants
      WHERE guild_id = $1
        AND event_id = $2
    `,
    [guildId, eventId],
  );

  return Number(result.rows[0]?.count ?? 0);
}

export async function addParticipantSafely(
  guildId: string,
  eventId: string,
  discordUserId: string,
): Promise<'joined' | 'already_joined' | 'full' | 'not_found' | 'not_scheduled'> {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const eventResult = await client.query<{
      id: string;
      guild_id: string;
      status: EventStatus;
      max_participants: number | null;
    }>(
      `
        SELECT id, guild_id, status, max_participants
        FROM events
        WHERE id = $1
          AND guild_id = $2
        FOR UPDATE
      `,
      [eventId, guildId],
    );

    const event = eventResult.rows[0];

    if (!event) {
      await client.query('ROLLBACK');
      return 'not_found';
    }

    if (event.status !== 'scheduled') {
      await client.query('ROLLBACK');
      return 'not_scheduled';
    }

    const existingResult = await client.query(
      `
        SELECT 1
        FROM event_participants
        WHERE event_id = $1
          AND guild_id = $2
          AND discord_user_id = $3
        LIMIT 1
      `,
      [eventId, guildId, discordUserId],
    );

    if (existingResult.rowCount && existingResult.rowCount > 0) {
      await client.query('ROLLBACK');
      return 'already_joined';
    }

    const countResult = await client.query<{ count: string }>(
      `
        SELECT COUNT(*)::text AS count
        FROM event_participants
        WHERE event_id = $1
          AND guild_id = $2
      `,
      [eventId, guildId],
    );

    const participantCount = Number(countResult.rows[0]?.count ?? 0);

    if (
      event.max_participants !== null &&
      participantCount >= event.max_participants
    ) {
      await client.query('ROLLBACK');
      return 'full';
    }

    await client.query(
      `
        INSERT INTO event_participants (
          event_id,
          guild_id,
          discord_user_id
        )
        VALUES ($1, $2, $3)
      `,
      [eventId, guildId, discordUserId],
    );

    await client.query('COMMIT');

    return 'joined';
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}