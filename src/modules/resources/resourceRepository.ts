import { pool } from '../../database/database.js';

export interface ResourceRecord {
  id: number;
  guildId: string;
  title: string;
  url: string;
  category: string;
  description: string | null;
  authorId: string;
  createdAt: Date;
  updatedAt: Date;
}

interface ResourceRow {
  id: number;
  guild_id: string;
  title: string;
  url: string;
  category: string;
  description: string | null;
  author_id: string;
  created_at: Date;
  updated_at: Date;
}

function mapResource(row: ResourceRow): ResourceRecord {
  return {
    id: row.id,
    guildId: row.guild_id,
    title: row.title,
    url: row.url,
    category: row.category,
    description: row.description,
    authorId: row.author_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function createResource(
  guildId: string,
  title: string,
  url: string,
  category: string,
  description: string | null,
  authorId: string,
): Promise<ResourceRecord> {
  const result = await pool.query<ResourceRow>(
    `
    INSERT INTO resources (
      guild_id,
      title,
      url,
      category,
      description,
      author_id
    )
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
    `,
    [guildId, title, url, category, description, authorId],
  );

  const row = result.rows[0];
  if (!row) {
    throw new Error('Failed to create resource: no row was returned.');
  }
  return mapResource(row);
}

export async function getResources(
  guildId: string,
  limit = 10,
): Promise<ResourceRecord[]> {
  const result = await pool.query<ResourceRow>(
    `
    SELECT *
    FROM resources
    WHERE guild_id = $1
    ORDER BY created_at DESC
    LIMIT $2
    `,
    [guildId, limit],
  );

  return result.rows.map(mapResource);
}

export async function searchResources(
  guildId: string,
  query: string,
  limit = 10,
): Promise<ResourceRecord[]> {
  const searchTerm = `%${query}%`;

  const result = await pool.query<ResourceRow>(
    `
    SELECT *
    FROM resources
    WHERE guild_id = $1
      AND (
        title ILIKE $2
        OR category ILIKE $2
        OR description ILIKE $2
      )
    ORDER BY created_at DESC
    LIMIT $3
    `,
    [guildId, searchTerm, limit],
  );

  return result.rows.map(mapResource);
}

export async function deleteResource(
  resourceId: number,
  guildId: string,
): Promise<boolean> {
  const result = await pool.query(
    `
    DELETE FROM resources
    WHERE id = $1
      AND guild_id = $2
    `,
    [resourceId, guildId],
  );

  return (result.rowCount ?? 0) > 0;
}