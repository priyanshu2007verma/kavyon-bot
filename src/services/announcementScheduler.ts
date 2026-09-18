import { Client } from 'discord.js';

import { getPendingAnnouncements } from '../modules/announcements/announcementRepository.js';
import { sendAnnouncement } from '../modules/announcements/announcementService.js';
import { logger } from '../utils/logger.js';

let schedulerInterval: ReturnType<typeof setInterval> | null = null;

let isProcessing = false;

export function startAnnouncementScheduler(client: Client): void {
  if (schedulerInterval) {
    return;
  }

  const processAnnouncements = async (): Promise<void> => {
    if (isProcessing) {
      return;
    }

    isProcessing = true;

    try {
      const announcements = await getPendingAnnouncements();

      for (const announcement of announcements) {
        try {
          const sent = await sendAnnouncement(client, {
            id: announcement.id,
            guildId: announcement.guildId,
            channelId: announcement.channelId,
            title: announcement.title,
            message: announcement.message,
            mentionEveryone: announcement.mentionEveryone,
          });

          if (sent) {
            logger.info(
              `Scheduled announcement ${announcement.id} sent successfully.`,
            );
          } else {
            logger.warn(
              `Could not send scheduled announcement ${announcement.id}.`,
            );
          }
        } catch (error) {
          logger.error(
            `Failed to process scheduled announcement ${announcement.id}.`,
            error,
          );
        }
      }
    } catch (error) {
      logger.error('Announcement scheduler failed.', error);
    } finally {
      isProcessing = false;
    }
  };

  void processAnnouncements();

  schedulerInterval = setInterval(() => {
    void processAnnouncements();
  }, 15_000);

  logger.info('Announcement scheduler started.');
}