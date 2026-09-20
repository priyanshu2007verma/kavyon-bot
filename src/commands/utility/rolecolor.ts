import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  Role,
  SlashCommandBuilder,
} from 'discord.js';

import type { Command } from '../../types/command.js';

const data = new SlashCommandBuilder()
  .setName('rolecolor')
  .setDescription('View the color information of a server role.');

data.addRoleOption((option) =>
  option
    .setName('role')
    .setDescription('The role whose color you want to inspect.')
    .setRequired(true),
);

function hexToRgb(hex: string): string {
  const normalized = hex.replace('#', '');

  if (normalized.length !== 6) {
    return 'Unavailable';
  }

  const red = parseInt(normalized.slice(0, 2), 16);
  const green = parseInt(normalized.slice(2, 4), 16);
  const blue = parseInt(normalized.slice(4, 6), 16);

  return `RGB(${red}, ${green}, ${blue})`;
}

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

    const selectedRole = interaction.options.getRole('role');

    if (!selectedRole) {
      await interaction.reply({
        content: '❌ That role could not be found.',
        ephemeral: true,
      });

      return;
    }

    const role: Role | undefined = interaction.guild.roles.cache.get(
      selectedRole.id,
    );

    if (!role) {
      await interaction.reply({
        content: '❌ That role is not available in the server cache.',
        ephemeral: true,
      });

      return;
    }

    const hexColor = role.hexColor;
    const rgbColor = hexToRgb(hexColor);

    const isDefaultColor = hexColor === '#000000';

    const embed = new EmbedBuilder()
      .setTitle(`🎨 ${role.name} — Color`)
      .addFields(
        {
          name: '🎨 HEX',
          value: `\`${hexColor}\``,
          inline: true,
        },
        {
          name: '🌈 RGB',
          value: `\`${rgbColor}\``,
          inline: true,
        },
        {
          name: '📌 Position',
          value: role.position.toString(),
          inline: true,
        },
        {
          name: '⚫ Default Color',
          value: isDefaultColor ? 'Yes' : 'No',
          inline: true,
        },
        {
          name: '🆔 Role ID',
          value: `\`${role.id}\``,
          inline: true,
        },
        {
          name: '🔗 Mention',
          value: role.toString(),
          inline: true,
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