import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';

export interface RateLimitConfig {
  windowMs: number;
}

export class RateLimiter {
  private filePath: string;
  private windowMs: number;
  private data: Record<string, Record<string, number>> = {};

  constructor(filePath: string, config?: RateLimitConfig) {
    this.filePath = filePath;
    this.windowMs = config?.windowMs ?? 30 * 60 * 1000;
  }

  async init(): Promise<void> {
    const dir = dirname(this.filePath);
    if (!existsSync(dir)) {
      await mkdir(dir, { recursive: true });
    }
    try {
      const raw = await readFile(this.filePath, 'utf-8');
      this.data = JSON.parse(raw);
    } catch {
      this.data = {};
    }
  }

  private async persist(): Promise<void> {
    await writeFile(this.filePath, JSON.stringify(this.data, null, 2), 'utf-8');
  }

  private prune(action: string): void {
    const now = Date.now();
    const bucket = this.data[action];
    if (!bucket) return;

    for (const [userId, ts] of Object.entries(bucket)) {
      if (now - ts > this.windowMs) {
        delete bucket[userId];
      }
    }

    if (Object.keys(bucket).length === 0) {
      delete this.data[action];
    }
  }

  async check(action: string, userId: string): Promise<{ allowed: boolean; retryAfter?: number }> {
    this.prune(action);
    const bucket = this.data[action] ?? {};
    const last = bucket[userId];

    if (last) {
      const elapsed = Date.now() - last;
      if (elapsed < this.windowMs) {
        return { allowed: false, retryAfter: Math.ceil((this.windowMs - elapsed) / 1000) };
      }
    }

    return { allowed: true };
  }

  async record(action: string, userId: string): Promise<void> {
    this.prune(action);
    if (!this.data[action]) {
      this.data[action] = {};
    }
    this.data[action][userId] = Date.now();
    await this.persist();
  }
}

export const summarizeRateLimiter = new RateLimiter(
  join(process.cwd(), 'data', 'rate_limits.json'),
  { windowMs: 30 * 60 * 1000 }
);
