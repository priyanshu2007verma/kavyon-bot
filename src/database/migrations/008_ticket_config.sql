ALTER TABLE guild_config
ADD COLUMN IF NOT EXISTS ticket_category_id TEXT;

ALTER TABLE guild_config
ADD COLUMN IF NOT EXISTS ticket_support_role_id TEXT;

ALTER TABLE guild_config
ADD COLUMN IF NOT EXISTS ticket_logs_channel_id TEXT;

ALTER TABLE guild_config
ADD COLUMN IF NOT EXISTS ticket_enabled BOOLEAN NOT NULL DEFAULT TRUE;