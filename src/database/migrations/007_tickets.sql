CREATE TABLE IF NOT EXISTS tickets (
  id BIGSERIAL PRIMARY KEY,
  guild_id TEXT NOT NULL REFERENCES guilds(guild_id) ON DELETE CASCADE,
  channel_id TEXT NOT NULL UNIQUE,
  creator_id TEXT NOT NULL,
  subject TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'closed', 'deleted')),
  closed_by TEXT,
  closed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tickets_guild
  ON tickets(guild_id);

CREATE INDEX IF NOT EXISTS idx_tickets_creator
  ON tickets(guild_id, creator_id);

CREATE INDEX IF NOT EXISTS idx_tickets_status
  ON tickets(guild_id, status);

CREATE INDEX IF NOT EXISTS idx_tickets_created_at
  ON tickets(created_at DESC);