# Kavyon Discord Bot — Phase 1

Phase 1 establishes the production-oriented foundation:

- TypeScript + Node.js
- discord.js
- Modular command discovery
- Modular Discord event handlers
- Environment-based secrets
- Centralized error handling
- `/ping`
- `/help`
- Graceful shutdown
- ESLint + Prettier
- Guild-first command registration for fast development

## Requirements

- Node.js 24.17+.
- A Discord application/bot.
- A Discord server where you have permission to add the bot.

## Install

```bash
npm install
```

Copy `.env.example` to `.env` and fill:

```env
DISCORD_TOKEN=your_bot_token
DISCORD_CLIENT_ID=your_application_client_id
DISCORD_GUILD_ID=your_test_server_id
DATABASE_URL=
```

Do not commit `.env`.

## Register commands

```bash
npm run commands:register
```

If `DISCORD_GUILD_ID` is set, commands are registered to that guild.

## Start development

```bash
npm run dev
```

Expected logs include:

```text
Loaded 2 command(s).
Logged in as Kavyon#....
Serving 1 guild(s).
```

## Build

```bash
npm run build
```

## Production start

```bash
npm start
```

## Test in Discord

Run `/ping`:

Expected:

> Pong. Kavyon is online.

Run `/help`:

Expected: an ephemeral Kavyon help embed with a Modules button.

## Phase 1 limitations

No database, moderation, resources, events, economy, tickets, reminders, or AI are active yet. Those are deliberately isolated into later phases.

## Architecture rule

Commands contain interaction-level UX only. Business logic belongs in services/modules as the project grows. Discord IDs and secrets must never be hard-coded.
