import {
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from 'discord.js';

import { getWarnings } from '../../modules/moderation/moderationRepository.js';

const command = {
  data: new SlashCommandBuilder()
    .setName('warnings')
    .setDescription('View a member\'s warning history.')
    .addUserOption((option) =>
      option
        .setName('user')
        .setDescription('The member whose warnings you want to view.')
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
          'You need the **Moderate Members** permission to use `/warnings`.',
        ephemeral: true,
      });
      return;
    }

    const target = interaction.options.getUser('user', true);

    const warnings = await getWarnings(interaction.guild.id, target.id);

    if (warnings.length === 0) {
      await interaction.reply({
        content: `✅ <@${target.id}> has no warnings.`,
        ephemeral: true,
      });
      return;
    }

    const lines = warnings.map(
      (warning, index) =>
        `**${index + 1}.** \`#${warning.id}\` — ${warning.reason}\n` +
        `Moderator: <@${warning.moderatorId}> • <t:${Math.floor(
          warning.createdAt.getTime() / 1000,
        )}:R>`,
    );

    await interaction.reply({
      content: [
        `⚠️ **Warning History — ${target.username}**`,
        '',
        `**Total Warnings:** ${warnings.length}`,
        '',
        lines.join('\n\n'),
      ].join('\n'),
      ephemeral: true,
    });
  },
};

export default command;