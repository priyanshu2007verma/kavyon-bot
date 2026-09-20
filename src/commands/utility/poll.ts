import {
  ChannelType,
  ChatInputCommandInteraction,
  EmbedBuilder,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from 'discord.js';

import type { Command } from '../../types/command.js';

const data = new SlashCommandBuilder()
  .setName('poll')
  .setDescription('Create a simple reaction-based poll.')
  .setDefaultMemberPermissions(
    PermissionFlagsBits.ManageMessages.toString(),
  );

data.addStringOption((option) =>
  option
    .setName('question')
    .setDescription('The question you want to ask.')
    .setRequired(true),
);

data.addStringOption((option) =>
  option
    .setName('option1')
    .setDescription('First option.')
    .setRequired(true),
);

data.addStringOption((option) =>
  option
    .setName('option2')
    .setDescription('Second option.')
    .setRequired(true),
);

data.addStringOption((option) =>
  option
    .setName('option3')
    .setDescription('Third option.')
    .setRequired(false),
);

data.addStringOption((option) =>
  option
    .setName('option4')
    .setDescription('Fourth option.')
    .setRequired(false),
);

data.addStringOption((option) =>
  option
    .setName('option5')
    .setDescription('Fifth option.')
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

    if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageMessages)) {
      await interaction.reply({
        content:
          '❌ You need the **Manage Messages** permission to create a poll.',
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
          '❌ Polls can only be created in a text or announcement channel.',
        ephemeral: true,
      });

      return;
    }

    const question = interaction.options.getString('question', true).trim();

    const options = [
      interaction.options.getString('option1', true),
      interaction.options.getString('option2', true),
      interaction.options.getString('option3'),
      interaction.options.getString('option4'),
      interaction.options.getString('option5'),
    ]
      .filter((option): option is string => Boolean(option))
      .map((option) => option.trim());

    if (question.length > 256) {
      await interaction.reply({
        content: '❌ The question cannot exceed 256 characters.',
        ephemeral: true,
      });

      return;
    }

    if (options.some((option) => option.length === 0 || option.length > 100)) {
      await interaction.reply({
        content:
          '❌ Each poll option must contain between 1 and 100 characters.',
        ephemeral: true,
      });

      return;
    }

    const numberEmojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣'];

    const description = options
      .map((option, index) => `${numberEmojis[index]} **${option}**`)
      .join('\n\n');

    const embed = new EmbedBuilder()
      .setTitle(`📊 ${question}`)
      .setDescription(description)
      .addFields({
        name: '🗳️ How to vote',
        value: 'React with the number corresponding to your choice.',
      })
      .setFooter({
        text: `Poll created by ${interaction.user.username}`,
      })
      .setTimestamp();

    const pollMessage = await channel.send({
      embeds: [embed],
    });

    for (let index = 0; index < options.length; index += 1) {
        const emoji = numberEmojis[index];
        if (!emoji) {
            continue;
        }

  await pollMessage.react(emoji);
}

    await interaction.reply({
      content: '✅ Poll created successfully.',
      ephemeral: true,
    });
  },
};

export default command;