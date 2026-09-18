import {
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from 'discord.js';

import {
  createModerationLog,
  createWarning,
} from '../../modules/moderation/moderationRepository.js';

const command = {
  data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Warn a member of this server.')
    .addUserOption((option) =>
      option
        .setName('user')
        .setDescription('The member you want to warn.')
        .setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName('reason')
        .setDescription('Why are you warning this member?')
        .setRequired(true)
        .setMaxLength(500),
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
        content: 'You need the **Moderate Members** permission to use `/warn`.',
        ephemeral: true,
      });

      return;
    }

    const target = interaction.options.getUser('user', true);
    const reason = interaction.options.getString('reason', true).trim();

    if (target.id === interaction.user.id) {
      await interaction.reply({
        content: 'You cannot warn yourself.',
        ephemeral: true,
      });

      return;
    }

    const warning = await createWarning(
      interaction.guild.id,
      target.id,
      interaction.user.id,
      reason,
    );

    await createModerationLog(
      interaction.guild.id,
      'WARN',
      target.id,
      interaction.user.id,
      reason,
    );

    await interaction.reply({
      content: [
        '⚠️ **Member Warned**',
        '',
        `**Member:** <@${target.id}>`,
        `**Reason:** ${reason}`,
        `**Warning ID:** \`${warning.id}\``,
      ].join('\n'),
    });
  },
};

export default command;