import {
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from 'discord.js';

import { createModerationLog } from '../../modules/moderation/moderationRepository.js';

const command = {
  data: new SlashCommandBuilder()
    .setName('clear')
    .setDescription('Delete recent messages from this channel.')
    .addIntegerOption((option) =>
      option
        .setName('amount')
        .setDescription('Number of messages to delete.')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(100),
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
        content: 'You need the **Manage Messages** permission to use `/clear`.',
        ephemeral: true,
      });
      return;
    }

    if (!interaction.channel || !interaction.channel.isTextBased()) {
      await interaction.reply({
        content: 'This command can only be used in a text-based channel.',
        ephemeral: true,
      });
      return;
    }

    if (!('bulkDelete' in interaction.channel)) {
      await interaction.reply({
        content: 'I cannot delete messages in this channel.',
        ephemeral: true,
      });
      return;
    }

    const amount = interaction.options.getInteger('amount', true);

    await interaction.deferReply({ ephemeral: true });

    const deleted = await interaction.channel.bulkDelete(amount, true);

    await createModerationLog(
      interaction.guild.id,
      'CLEAR',
      null,
      interaction.user.id,
      `Deleted ${deleted.size} message(s)`,
    );

    await interaction.editReply({
      content: `🧹 Deleted **${deleted.size}** message(s) from this channel.`,
    });
  },
};

export default command;