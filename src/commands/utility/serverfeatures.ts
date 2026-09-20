import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
} from 'discord.js';

import type { Command } from '../../types/command.js';

const data = new SlashCommandBuilder()
  .setName('serverfeatures')
  .setDescription('View server configuration and features.');

const verificationLevels: Record<number, string> = {
  0: 'None',
  1: 'Low',
  2: 'Medium',
  3: 'High',
  4: 'Very High',
};

const explicitContentFilters: Record<number, string> = {
  0: 'Disabled',
  1: 'Members Without Roles',
  2: 'All Members',
};

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

    const guild = interaction.guild;

    const verificationLevel =
      verificationLevels[guild.verificationLevel] ?? 'Unknown';

    const explicitContentFilter =
      explicitContentFilters[guild.explicitContentFilter] ?? 'Unknown';

    const premiumTier = String(guild.premiumTier);

    const premiumSubscriptionCount =
      guild.premiumSubscriptionCount ?? 0;

    const features =
      guild.features.length > 0
        ? guild.features
            .map((feature) =>
              feature
                .replaceAll('_', ' ')
                .toLowerCase()
                .replace(/\b\w/g, (character) =>
                  character.toUpperCase(),
                ),
            )
            .join('\n')
        : 'None';

    const embed = new EmbedBuilder()
      .setTitle(`⚙️ ${guild.name} — Server Features`)
      .setThumbnail(guild.iconURL({ size: 256 }))
      .addFields(
        {
          name: '🔐 Verification Level',
          value: verificationLevel,
          inline: true,
        },
        {
          name: '🛡️ Content Filter',
          value: explicitContentFilter,
          inline: true,
        },
        {
          name: '🔒 MFA Requirement',
          value: guild.mfaLevel === 1 ? 'Enabled' : 'Disabled',
          inline: true,
        },
        {
          name: '🚀 Boost Tier',
          value: premiumTier,
          inline: true,
        },
        {
          name: '💎 Boosts',
          value: premiumSubscriptionCount.toString(),
          inline: true,
        },
        {
          name: '✨ Discord Features',
          value: features,
          inline: false,
        },
      )
      .setFooter({
        text: `Requested by ${interaction.user.username}`,
      })
      .setTimestamp();

    await interaction.reply({
      embeds: [embed],
    });
  },
};

export default command;