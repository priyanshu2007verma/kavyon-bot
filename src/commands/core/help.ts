import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  SlashCommandBuilder,
} from 'discord.js';
import type { Command } from '../../types/command.js';

const command: Command = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('View Kavyon bot modules and commands.'),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle('KAVYON')
      .setDescription(
        'The operating system for the Kavyon Discord community.\n\nPhase 1 is online. More modules will be added incrementally.',
      )
      .addFields(
        { name: 'Core', value: '`/ping` ` /help`'.replace('` `', ' ') },
        { name: 'Coming Next', value: 'Database • Configuration • Moderation' },
        { name: 'Roadmap', value: 'Announcements • Resources • Events • Economy • Tickets • Founder • Optional AI' },
      )
      .setFooter({ text: 'Kavyon • Modular community infrastructure' });

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId('kavyon:help:modules')
        .setLabel('Modules')
        .setStyle(ButtonStyle.Secondary),
    );

    await interaction.reply({
      embeds: [embed],
      components: [row],
      ephemeral: true,
    });
  },
};

export default command;