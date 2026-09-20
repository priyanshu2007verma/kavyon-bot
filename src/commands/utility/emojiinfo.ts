import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
} from 'discord.js';

import type { Command } from '../../types/command.js';

const data = new SlashCommandBuilder()
  .setName('emojiinfo')
  .setDescription('View information about a server emoji.');

data.addStringOption((option) =>
  option
    .setName('emoji')
    .setDescription('The custom server emoji to inspect.')
    .setRequired(true),
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

    const input = interaction.options.getString('emoji', true);

    const emojiMatch = input.match(/<(a?):(\w+):(\d+)>/);

    if (!emojiMatch) {
      await interaction.reply({
        content:
          '❌ Please provide a valid custom server emoji, for example `<:name:123456789>`.',
        ephemeral: true,
      });

      return;
    }

  const animatedFlag = emojiMatch[1] ?? '';
  const emojiName = emojiMatch[2] ?? 'Unknown';
  const emojiId = emojiMatch[3] ?? '';

    const emoji = interaction.guild.emojis.cache.get(emojiId);

    if (!emoji) {
      await interaction.reply({
        content:
          '❌ I could not find that emoji in this server. Make sure it belongs to this server.',
        ephemeral: true,
      });

      return;
    }

    const extension = emoji.animated || animatedFlag === 'a' ? 'gif' : 'png';

    const emojiUrl: string =
      `https://cdn.discordapp.com/emojis/${emoji.id}.${extension}?size=4096`;

    const embed = new EmbedBuilder()
      .setTitle(`😀 ${emoji.name ?? emojiName}`)
      .setThumbnail(emojiUrl)
      .addFields(
        {
          name: '🆔 Emoji ID',
          value: `\`${emoji.id}\``,
          inline: true,
        },
        {
          name: '📝 Name',
          value: `\`${emoji.name ?? emojiName}\``,
          inline: true,
        },
        {
          name: '🎞️ Animated',
          value: emoji.animated ? 'Yes' : 'No',
          inline: true,
        },
        {
          name: '✅ Available',
          value: emoji.available ? 'Yes' : 'No',
          inline: true,
        },
        {
          name: '🔗 Emoji',
          value: emoji.toString(),
          inline: true,
        },
        {
          name: '🌐 Image URL',
          value: emojiUrl,
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