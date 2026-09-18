type LogLevel = 'INFO' | 'WARN' | 'ERROR';

function safeStringify(meta: unknown): string {
  if (meta instanceof Error) {
    return JSON.stringify({
      name: meta.name,
      message: meta.message,
      stack: meta.stack,
    });
  }
  try {
    return JSON.stringify(meta);
  } catch {
    return String(meta);
  }
}

function log(level: LogLevel, message: string, meta?: unknown): void {
  const timestamp = new Date().toISOString();
  const suffix = meta === undefined ? '' : ` ${safeStringify(meta)}`;
  console.log(`[${timestamp}] [${level}] ${message}${suffix}`);
}

export const logger = {
  info: (message: string, meta?: unknown) => log('INFO', message, meta),
  warn: (message: string, meta?: unknown) => log('WARN', message, meta),
  error: (message: string, meta?: unknown) => log('ERROR', message, meta),
};