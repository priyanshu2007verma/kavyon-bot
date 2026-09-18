CREATE TABLE IF NOT EXISTS resources (
  id BIGSERIAL PRIMARY KEY,
  guild_id TEXT NOT NULL REFERENCES guilds(guild_id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  author_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_resources_guild
ON resources(guild_id);

CREATE INDEX IF NOT EXISTS idx_resources_category
ON resources(guild_id, category);

CREATE INDEX IF NOT EXISTS idx_resources_created_at
ON resources(created_at DESC);