import { readdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import type { Command } from '../types/command.js';
import { logger } from '../utils/logger.js';

const currentDir = dirname(fileURLToPath(import.meta.url));
const commandsRoot = join(currentDir, '..', 'commands');

async function walk(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await walk(fullPath)));
    } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.js'))) {
      files.push(fullPath);
    }
  }

  return files;
}

export async function loadCommands(): Promise<Map<string, Command>> {
  const commandFiles = await walk(commandsRoot);
  const commands = new Map<string, Command>();

  for (const file of commandFiles) {
    const module = (await import(pathToFileURL(file).href)) as {
      default?: Command;
    };

    if (!module.default) {
      logger.warn(`Skipping command without default export: ${file}`);
      continue;
    }

    const command = module.default;
    const name = command.data.name;

    if (commands.has(name)) {
      throw new Error(`Duplicate command name detected: ${name}`);
    }

    commands.set(name, command);
  }

  logger.info(`Loaded ${commands.size} command(s).`);
  return commands;
}