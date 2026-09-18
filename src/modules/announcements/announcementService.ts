import { Client, EmbedBuilder, TextChannel } from 'discord.js';

import { markAnnouncementSent } from './announcementRepository.js';

export interface AnnouncementData {
  id: number;
  guildId: string;
  channelId: string;
  title: string;
  message: string;
  mentionEveryone: boolean;
}

export async function sendAnnouncement(
  client: Client,
  announcement: AnnouncementData,
): Promise<boolean> {
  const channel = await client.channels
    .fetch(announcement.channelId)
    .catch(() => null);

  if (!channel || !channel.isTextBased()) {
    return false;
  }

  if (!(channel instanceof TextChannel)) {
    return false;
  }

  const embed = new EmbedBuilder()
    .setTitle(announcement.title)
    .setDescription(announcement.message)
    .setTimestamp();

  if (announcement.mentionEveryone) {
    await channel.send({
      content: '@everyone',
      embeds: [embed],
      allowedMentions: {
        parse: ['everyone'],
      },
    });
  } else {
    await channel.send({
      embeds: [embed],
      allowedMentions: {
        parse: [],
      },
    });
  }

  if (announcement.id > 0) {
  await markAnnouncementSent(announcement.id);
}

  return true;
}