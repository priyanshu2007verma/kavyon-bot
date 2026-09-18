import {
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from 'discord.js';

import { clearWarnings } from '../../modules/moderation/moderationRepository.js';

const command = {
  data: new SlashCommandBuilder()
    .setName('clearwarnings')
    .setDescription('Clear all warnings for a member.')
    .addUserOption((option) =>
      option
        .setName('user')
        .setDescription('The member whose warnings should be cleared.')
        .setRequired(true),
    )
    .setDefaultMemberPermissions(
      PermissionFlagsBits.ModerateMembers.toString(),
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
        PermissionFlagsBits.ModerateMembers,
      )
    ) {
      await interaction.reply({
        content:
          'You need the **Moderate Members** permission to use `/clearwarnings`.',
        ephemeral: true,
      });
      return;
    }

    const target = interaction.options.getUser('user', true);

    const deletedCount = await clearWarnings(
      interaction.guild.id,
      target.id,
    );

    await interaction.reply({
      content:
        deletedCount > 0
          ? `🧹 Cleared **${deletedCount}** warning(s) from <@${target.id}>.`
          : `ℹ️ <@${target.id}> has no warnings to clear.`,
      ephemeral: true,
    });
  },
};

export default command;