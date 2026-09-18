import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

const MODELS = [
  'groq/compound',
  'groq/compound-mini',
  'llama-3.3-70b-versatile',
  'llama-3.1-8b-instant',
] as const;

type ModelId = typeof MODELS[number];

export interface SummarizeOptions {
  messages: string[];
  maxWords?: number;
}

export async function summarizeMessages(opts: SummarizeOptions): Promise<string> {
  if (!env.groqApiKey) {
    throw new Error('GROQ_API_KEY is not configured');
  }

  const maxWords = opts.maxWords ?? 120;
  const context = opts.messages.join('\n').trim();

  if (!context) {
    throw new Error('No messages to summarize');
  }

  const systemPrompt = `You are a concise summarizer. Summarize the following Discord messages in ~${maxWords} words. Output plain text only, no markdown headings or bullet lists. Focus on key topics, decisions and questions.`;

  const userPrompt = `Summarize these messages:\n\n${context}`;

  let lastError: unknown = null;

  for (const model of MODELS) {
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env.groqApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.3,
          max_tokens: 300,
        }),
      });

      if (!response.ok) {
        const text = await response.text().catch(() => '');
        logger.warn(`Groq model ${model} failed with ${response.status}`, { text });
        lastError = new Error(`Groq ${response.status}`);
        continue;
      }

      const data = await response.json();
      const content = data?.choices?.[0]?.message?.content?.trim();

      if (!content) {
        lastError = new Error('Empty response from Groq');
        continue;
      }

      logger.info(`Groq summarize succeeded with model ${model}`);
      return content;
    } catch (err) {
      logger.warn(`Groq request error for model ${model}`, err);
      lastError = err;
      continue;
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Groq summarization failed');
}
