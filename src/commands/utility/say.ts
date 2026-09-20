import {
  ChannelType,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from 'discord.js';

import type { Command } from '../../types/command.js';

const data = new SlashCommandBuilder()
  .setName('say')
  .setDescription('Make Kavyon send a message.')
  .setDefaultMemberPermissions(
    PermissionFlagsBits.ManageMessages.toString(),
  );

data.addStringOption((option) =>
  option
    .setName('message')
    .setDescription('The message Kavyon should send.')
    .setRequired(true),
);

data.addBooleanOption((option) =>
  option
    .setName('embed')
    .setDescription('Send the message as an embed.')
    .setRequired(false),
);

const command: Command = {
  data,

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!interaction.guild) {
      await interaction.reply({
        content: '❌ This command can only be used inside a server.',
        ephemeral: true,
      });

      return;
    }

    if (!interaction.memberPermissions) {
      await interaction.reply({
        content: '❌ Unable to verify your permissions.',
        ephemeral: true,
      });

      return;
    }

    if (
      !interaction.memberPermissions.has(
        PermissionFlagsBits.ManageMessages,
      )
    ) {
      await interaction.reply({
        content:
          '❌ You need the **Manage Messages** permission to use this command.',
        ephemeral: true,
      });

      return;
    }

    const message = interaction.options.getString('message', true);
    const useEmbed = interaction.options.getBoolean('embed') ?? false;

    if (message.length > 2000) {
      await interaction.reply({
        content: '❌ The message cannot exceed 2000 characters.',
        ephemeral: true,
      });

      return;
    }

    const channel = interaction.guild.channels.cache.get(
      interaction.channelId,
    );

    if (
      !channel ||
      (channel.type !== ChannelType.GuildText &&
        channel.type !== ChannelType.GuildAnnouncement)
    ) {
      await interaction.reply({
        content:
          '❌ This command can only be used in a text or announcement channel.',
        ephemeral: true,
      });

      return;
    }

    if (useEmbed) {
      await channel.send({
        embeds: [
          {
            description: message,
            timestamp: new Date().toISOString(),
          },
        ],
      });
    } else {
      await channel.send({
        content: message,
        allowedMentions: {
          parse: [],
        },
      });
    }

    await interaction.reply({
      content: '✅ Message sent.',
      ephemeral: true,
    });
  },
};

export default command;