import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
} from 'discord.js';

import type { Command } from '../../types/command.js';

const data = new SlashCommandBuilder()
  .setName('avatar')
  .setDescription('View a user avatar.')
  ;

data.addUserOption((option) =>
  option
    .setName('user')
    .setDescription('The user whose avatar you want to view.')
    .setRequired(false),
);

const command: Command = {
  data,

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const user = interaction.options.getUser('user') ?? interaction.user;

    const avatarUrl = user.displayAvatarURL({
      size: 4096,
      extension: 'png',
    });

    const embed = new EmbedBuilder()
      .setTitle(`🖼️ ${user.username}'s Avatar`)
      .setImage(avatarUrl)
      .addFields({
        name: '👤 User',
        value: `${user} (\`${user.id}\`)`,
        inline: false,
      })
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