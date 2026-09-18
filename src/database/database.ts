import { Pool } from 'pg';

import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

if (!env.databaseUrl) {
  throw new Error('DATABASE_URL is not configured.');
}

export const pool = new Pool({
  connectionString: env.databaseUrl,
  ssl: {
    rejectUnauthorized: false,
  },
  max: 5,
});

pool.on('error', (error) => {
  logger.error('Unexpected PostgreSQL pool error', error);
});

export async function checkDatabaseConnection(): Promise<void> {
  const client = await pool.connect();

  try {
    await client.query('SELECT 1');
    logger.info('PostgreSQL connection successful.');
  } finally {
    client.release();
  }
}