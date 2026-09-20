CREATE TABLE IF NOT EXISTS ticket_logs (
  id BIGSERIAL PRIMARY KEY,
  ticket_id BIGINT NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  guild_id TEXT NOT NULL REFERENCES guilds(guild_id) ON DELETE CASCADE,

  action TEXT NOT NULL
    CHECK (action IN (
      'created',
      'closed',
      'reopened',
      'deleted'
    )),

  actor_id TEXT NOT NULL,
  channel_id TEXT,
  details TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ticket_logs_ticket
  ON ticket_logs(ticket_id);

CREATE INDEX IF NOT EXISTS idx_ticket_logs_guild
  ON ticket_logs(guild_id);

CREATE INDEX IF NOT EXISTS idx_ticket_logs_created_at
  ON ticket_logs(created_at DESC);