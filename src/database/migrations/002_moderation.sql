CREATE TABLE IF NOT EXISTS warnings (
  id BIGSERIAL PRIMARY KEY,

  guild_id TEXT NOT NULL
    REFERENCES guilds(guild_id)
    ON DELETE CASCADE,

  user_id TEXT NOT NULL,

  moderator_id TEXT NOT NULL,

  reason TEXT NOT NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_warnings_guild_user
  ON warnings(guild_id, user_id);

CREATE INDEX IF NOT EXISTS idx_warnings_created_at
  ON warnings(created_at DESC);

CREATE TABLE IF NOT EXISTS moderation_logs (
  id BIGSERIAL PRIMARY KEY,

  guild_id TEXT NOT NULL
    REFERENCES guilds(guild_id)
    ON DELETE CASCADE,

  action TEXT NOT NULL,

  target_user_id TEXT NOT NULL,

  moderator_id TEXT NOT NULL,

  reason TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_moderation_logs_guild
  ON moderation_logs(guild_id);

CREATE INDEX IF NOT EXISTS idx_moderation_logs_created_at
  ON moderation_logs(created_at DESC);