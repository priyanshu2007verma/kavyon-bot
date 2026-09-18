import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
} from 'discord.js';
import { getResources } from '../../modules/resources/resourceRepository.js';

const command = {
  data: new SlashCommandBuilder()
    .setName('resources')
    .setDescription('View saved server resources'),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!interaction.guildId) {
      await interaction.reply({
        content: '❌ This command can only be used inside a server.',
        ephemeral: true,
      });
      return;
    }

    try {
      const resources = await getResources(interaction.guildId, 10);

      if (resources.length === 0) {
        await interaction.reply({
          content: '📚 No resources have been added yet.',
          ephemeral: true,
        });
        return;
      }

      const embed = new EmbedBuilder()
        .setTitle('📚 Kavyon Resources')
        .setDescription(
          resources
            .map(
              (resource) =>
                `**${resource.id}. [${resource.title}](${resource.url})**\n` +
                `🏷️ ${resource.category}` +
                (resource.description
                  ? `\n📝 ${resource.description}`
                  : ''),
            )
            .join('\n\n'),
        )
        .setFooter({
          text: `Showing ${resources.length} resource${resources.length === 1 ? '' : 's'}`,
        })
        .setTimestamp();

      await interaction.reply({
        embeds: [embed],
      });
    } catch (error) {
      console.error('Failed to list resources:', error);

      await interaction.reply({
        content: '❌ Failed to retrieve resources. Please try again later.',
        ephemeral: true,
      });
    }
  },
};

export default command;