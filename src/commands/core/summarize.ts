import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  TextChannel,
} from 'discord.js';
import { env } from '../../config/env.js';
import { summarizeRateLimiter } from '../../utils/rateLimiter.js';
import { summarizeMessages } from '../../services/groqService.js';
import { logger } from '../../utils/logger.js';

const command = {
  data: new SlashCommandBuilder()
    .setName('summarize')
    .setDescription('Summarize the last messages in this channel'),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    // =========================================================
    // Guild check
    // =========================================================

    if (!interaction.guildId) {
      await interaction.reply({
        content: 'This command can only be used in a server.',
        ephemeral: true,
      });
      return;
    }

    // =========================================================
    // Kavyon guild restriction
    // =========================================================

    if (
      env.discordGuildId &&
      interaction.guildId !== env.discordGuildId
    ) {
      await interaction.reply({
        content:
          'This command is only available in the Kavyon server.',
        ephemeral: true,
      });
      return;
    }

    // =========================================================
    // Channel validation
    // =========================================================

    const channel = interaction.channel;

    if (
      !channel ||
      !channel.isTextBased() ||
      !(channel instanceof TextChannel)
    ) {
      await interaction.reply({
        content:
          'This command can only be used in a text channel.',
        ephemeral: true,
      });
      return;
    }

    // =========================================================
    // Rate limit
    // =========================================================

    await summarizeRateLimiter.init();

    const check = await summarizeRateLimiter.check(
      'summarize',
      interaction.user.id,
    );

    if (!check.allowed) {
      const minutes = Math.ceil((check.retryAfter ?? 0) / 60);

      await interaction.reply({
        content:
          `You can summarize again in ${minutes} minute${
            minutes === 1 ? '' : 's'
          }.`,
        ephemeral: true,
      });

      return;
    }

    // =========================================================
    // Defer response
    // =========================================================

    await interaction.deferReply();

    try {
      // -------------------------------------------------------
      // Get messages from the last 2 hours
      // -------------------------------------------------------

      const now = Date.now();
      const twoHoursAgo = now - 2 * 60 * 60 * 1000;

      const fetched = await channel.messages.fetch({
        limit: 100,
      });

      // Discord.js returns a Collection.
      // Convert it to an array before using slice().
      const messages = Array.from(fetched.values())
        .filter((message) => message.createdTimestamp >= twoHoursAgo)
        .sort(
          (a, b) =>
            a.createdTimestamp - b.createdTimestamp,
        )
        .slice(-40);

      // -------------------------------------------------------
      // No messages
      // -------------------------------------------------------

      if (messages.length === 0) {
        await interaction.editReply({
          content:
            'No messages found in the last 2 hours to summarize.',
        });

        return;
      }

      // -------------------------------------------------------
      // Prepare messages for Groq
      // -------------------------------------------------------

      const lines: string[] = [];

      for (const msg of messages) {
        const time = new Date(
          msg.createdTimestamp,
        ).toLocaleTimeString('en-GB', {
          hour: '2-digit',
          minute: '2-digit',
        });

        const author =
          msg.member?.displayName ?? msg.author.username;

        let text = msg.content?.trim() ?? '';

        if (msg.attachments.size > 0) {
          text += ' [attachment]';
        }

        // Ignore completely empty messages.
        if (!text.trim()) {
          continue;
        }

        let line = `${time} ${author}: ${text}`;

        if (msg.reference?.messageId) {
          line += ' ↳ reply';
        }

        lines.push(line);
      }

      // -------------------------------------------------------
      // Check after filtering empty messages
      // -------------------------------------------------------

      if (lines.length === 0) {
        await interaction.editReply({
          content:
            'No readable messages found in the last 2 hours to summarize.',
        });

        return;
      }

      // -------------------------------------------------------
      // Ask Groq for summary
      // -------------------------------------------------------

      const summary = await summarizeMessages({
        messages: lines,
        maxWords: 120,
      });

      // -------------------------------------------------------
      // Record rate limit usage
      // -------------------------------------------------------

      await summarizeRateLimiter.record(
        'summarize',
        interaction.user.id,
      );

      // -------------------------------------------------------
      // Send result
      // -------------------------------------------------------

      await interaction.editReply({
        content: `**Summary**\n${summary}`,
      });
    } catch (error) {

      logger.error('Summarize command failed', {
        guildId: interaction.guildId,
        channelId: interaction.channelId,
        userId: interaction.user.id,
        error,
      });
      await interaction.editReply({ content: 'Sorry, I could not summarize right now. Please try again later.' }).catch(() => undefined);

      logger.error('Summarize command failed', error);

      await interaction
        .editReply({
          content:
            'Sorry, I could not summarize right now. Please try again later.',
        })
        .catch(() => undefined);
    }
  },
};

export default command;