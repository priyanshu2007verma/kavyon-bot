import { SlashCommandBuilder } from 'discord.js';
import type { Command } from '../../types/command.js';

const command: Command = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Check whether Kavyon is online.'),

  async execute(interaction) {
    await interaction.reply({
      content: 'Pong. Kavyon is online.',
      ephemeral: true,
    });
  },
};

export default command;