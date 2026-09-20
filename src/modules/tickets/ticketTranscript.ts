import type { TextChannel } from 'discord.js';

export interface TicketTranscriptResult {
  filename: string;
  content: string;
  messageCount: number;
}

export async function generateTicketTranscript(
  channel: TextChannel,
): Promise<TicketTranscriptResult> {
  const messages = [];

  let lastMessageId: string | undefined;

  while (true) {
    const fetched = await channel.messages.fetch({
      limit: 100,
      ...(lastMessageId ? { before: lastMessageId } : {}),
    });

    if (fetched.size === 0) {
      break;
    }

    messages.push(...Array.from(fetched.values()));

    if (fetched.size < 100) {
      break;
    }

    const oldestMessage = fetched.last();

    if (!oldestMessage) {
      break;
    }

    lastMessageId = oldestMessage.id;
  }

  messages.sort(
    (a, b) => a.createdTimestamp - b.createdTimestamp,
  );

  const lines: string[] = [
    'KAVYON TICKET TRANSCRIPT',
    '=========================',
    '',
    `Server: ${channel.guild.name}`,
    `Channel: #${channel.name}`,
    `Channel ID: ${channel.id}`,
    `Generated: ${new Date().toISOString()}`,
    `Messages: ${messages.length}`,
    '',
    '-------------------------',
    '',
  ];

  for (const message of messages) {
    const timestamp = new Date(message.createdTimestamp).toISOString();

    const author = `${message.author.username} (${message.author.id})`;

    const content =
      message.content.trim() || '[No text content]';

    lines.push(`[${timestamp}] ${author}`);
    lines.push(content);

    if (message.attachments.size > 0) {
      lines.push(
        `Attachments: ${Array.from(message.attachments.values())
          .map((attachment) => attachment.url)
          .join(', ')}`,
      );
    }

    if (message.embeds.length > 0) {
      lines.push(
        `Embeds: ${message.embeds.length}`,
      );
    }

    lines.push('');
  }

  return {
    filename: `ticket-${channel.id}-transcript.txt`,
    content: lines.join('\n'),
    messageCount: messages.length,
  };
}