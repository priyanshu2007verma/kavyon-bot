CREATE TABLE IF NOT EXISTS guilds (
  guild_id TEXT PRIMARY KEY,
  guild_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS guild_config (
  guild_id TEXT PRIMARY KEY
    REFERENCES guilds(guild_id)
    ON DELETE CASCADE,

  prefix TEXT NOT NULL DEFAULT '!',
  welcome_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  welcome_channel_id TEXT,

  announcements_channel_id TEXT,
  logs_channel_id TEXT,

  moderation_enabled BOOLEAN NOT NULL DEFAULT TRUE,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
  user_id TEXT NOT NULL,
  guild_id TEXT NOT NULL
    REFERENCES guilds(guild_id)
    ON DELETE CASCADE,

  username TEXT NOT NULL,

  xp BIGINT NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 1,
  coins BIGINT NOT NULL DEFAULT 0,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  PRIMARY KEY (user_id, guild_id)
);

CREATE INDEX IF NOT EXISTS idx_users_guild_id
  ON users(guild_id);

CREATE INDEX IF NOT EXISTS idx_users_xp
  ON users(guild_id, xp DESC);