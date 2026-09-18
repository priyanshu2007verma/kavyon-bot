import {
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from 'discord.js';

import {
  cancelScheduledAnnouncement,
} from '../../modules/announcements/announcementRepository.js';

const command = {
  data: new SlashCommandBuilder()
    .setName('cancelannouncement')
    .setDescription('Cancel a pending scheduled announcement.')
    .addIntegerOption((option) =>
      option
        .setName('id')
        .setDescription('The scheduled announcement ID.')
        .setRequired(true)
        .setMinValue(1),
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
          'You need the **Manage Messages** permission to use this command.',
        ephemeral: true,
      });
      return;
    }

    const announcementId = interaction.options.getInteger('id', true);

    const cancelled = await cancelScheduledAnnouncement(
      announcementId,
      interaction.guild.id,
    );

    if (!cancelled) {
      await interaction.reply({
        content:
          '❌ No pending scheduled announcement was found with that ID.',
        ephemeral: true,
      });
      return;
    }

    await interaction.reply({
      content: `✅ Scheduled announcement \`${announcementId}\` has been cancelled.`,
      ephemeral: true,
    });
  },
};

export default command;