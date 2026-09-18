import {
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from 'discord.js';

import { sendAnnouncement } from '../../modules/announcements/announcementService.js';

const command = {
  data: new SlashCommandBuilder()
    .setName('announce')
    .setDescription('Send an announcement to a selected channel.')
    .addChannelOption((option) =>
      option
        .setName('channel')
        .setDescription('Channel where the announcement will be sent.')
        .setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName('title')
        .setDescription('Announcement title.')
        .setRequired(true)
        .setMaxLength(256),
    )
    .addStringOption((option) =>
      option
        .setName('message')
        .setDescription('Announcement message.')
        .setRequired(true)
        .setMaxLength(4000),
    )
    .addBooleanOption((option) =>
      option
        .setName('everyone')
        .setDescription('Mention @everyone in the announcement.')
        .setRequired(false),
    )
    .setDefaultMemberPermissions(
      PermissionFlagsBits.ManageMessages.toString(),
    ),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!interaction.guild) {
      await interaction.reply({
        content: 'This command can only be used inside a server.',
        ephemeral: true,
      });
      return;
    }

    if (
      !interaction.memberPermissions?.has(
        PermissionFlagsBits.ManageMessages,
      )
    ) {
      await interaction.reply({
        content:
          'You need the **Manage Messages** permission to use `/announce`.',
        ephemeral: true,
      });
      return;
    }

    const channel = interaction.options.getChannel('channel', true);
    const title = interaction.options.getString('title', true).trim();
    const message = interaction.options.getString('message', true).trim();
    const mentionEveryone =
      interaction.options.getBoolean('everyone') ?? false;

    if (!('send' in channel)) {
        await interaction.reply({
            content: 'I cannot send messages to the selected channel.',
            ephemeral: true,
        });
        return;
    }

    await interaction.reply({
      content: '📢 Sending announcement...',
      ephemeral: true,
    });

    const sent = await sendAnnouncement(interaction.client, {
      id: 0,
      guildId: interaction.guild.id,
      channelId: channel.id,
      title,
      message,
      mentionEveryone,
    });

    if (!sent) {
      await interaction.editReply({
        content:
          '❌ I could not send the announcement to that channel. Check my permissions and channel access.',
      });
      return;
    }

    await interaction.editReply({
      content: `✅ Announcement sent to <#${channel.id}>.`,
    });
  },
};

export default command;