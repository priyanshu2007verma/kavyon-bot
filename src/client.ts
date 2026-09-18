import { Client } from 'discord.js';

export function createClient(): Client {
  return new Client({
    intents: ['Guilds'],
  });
}