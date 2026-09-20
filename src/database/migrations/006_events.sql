CREATE TABLE IF NOT EXISTS events (
  id BIGSERIAL PRIMARY KEY,
  guild_id TEXT NOT NULL REFERENCES guilds(guild_id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  description TEXT NOT NULL,

  starts_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER,

  channel_id TEXT,
  location TEXT,

  max_participants INTEGER,
  image_url TEXT,

  status TEXT NOT NULL DEFAULT 'scheduled'
    CHECK (status IN ('scheduled', 'cancelled', 'completed')),

  created_by TEXT NOT NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_events_guild
ON events(guild_id);

CREATE INDEX IF NOT EXISTS idx_events_starts_at
ON events(starts_at);

CREATE INDEX IF NOT EXISTS idx_events_status
ON events(guild_id, status);


CREATE TABLE IF NOT EXISTS event_participants (
  event_id BIGINT NOT NULL REFERENCES events(id) ON DELETE CASCADE,

  guild_id TEXT NOT NULL REFERENCES guilds(guild_id) ON DELETE CASCADE,

  discord_user_id TEXT NOT NULL,

  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  PRIMARY KEY (event_id, discord_user_id)
);

CREATE INDEX IF NOT EXISTS idx_event_participants_event
ON event_participants(event_id);

CREATE INDEX IF NOT EXISTS idx_event_participants_guild
ON event_participants(guild_id);