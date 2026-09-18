CREATE TABLE IF NOT EXISTS scheduled_announcements (
  id BIGSERIAL PRIMARY KEY,
  guild_id TEXT NOT NULL REFERENCES guilds(guild_id) ON DELETE CASCADE,
  channel_id TEXT NOT NULL,
  author_id TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  mention_everyone BOOLEAN NOT NULL DEFAULT FALSE,
  scheduled_for TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scheduled_announcements_guild
ON scheduled_announcements(guild_id);

CREATE INDEX IF NOT EXISTS idx_scheduled_announcements_pending
ON scheduled_announcements(scheduled_for)
WHERE sent_at IS NULL;