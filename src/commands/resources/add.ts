import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from 'discord.js';
import {
  createResource,
  searchResources,
  deleteResource,
} from '../../modules/resources/resourceRepository.js';

const command = {
  data: new SlashCommandBuilder()
    .setName('resource')
    .setDescription('Manage server resources')

    // =========================================================
    // /resource add
    // =========================================================

    .addSubcommand((subcommand) =>
      subcommand
        .setName('add')
        .setDescription('Add a new resource')
        .addStringOption((option) =>
          option
            .setName('title')
            .setDescription('Resource title')
            .setRequired(true)
            .setMaxLength(100),
        )
        .addStringOption((option) =>
          option
            .setName('url')
            .setDescription('Resource URL')
            .setRequired(true)
            .setMaxLength(2048),
        )
        .addStringOption((option) =>
          option
            .setName('category')
            .setDescription('Resource category')
            .setRequired(true)
            .setMaxLength(50),
        )
        .addStringOption((option) =>
          option
            .setName('description')
            .setDescription('Short description')
            .setRequired(false)
            .setMaxLength(500),
        ),
    )

    // =========================================================
    // /resource search
    // =========================================================

    .addSubcommand((subcommand) =>
      subcommand
        .setName('search')
        .setDescription('Search server resources')
        .addStringOption((option) =>
          option
            .setName('query')
            .setDescription('Search by title, category, or description')
            .setRequired(true)
            .setMaxLength(100),
        ),
    )

    // =========================================================
    // /resource delete
    // =========================================================

    .addSubcommand((subcommand) =>
      subcommand
        .setName('delete')
        .setDescription('Delete a resource')
        .addIntegerOption((option) =>
          option
            .setName('id')
            .setDescription('Resource ID')
            .setRequired(true)
            .setMinValue(1),
        ),
    ),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    // =========================================================
    // Guild check
    // =========================================================

    if (!interaction.guildId) {
      await interaction.reply({
        content: '❌ This command can only be used inside a server.',
        ephemeral: true,
      });
      return;
    }

    const subcommand = interaction.options.getSubcommand();

    // =========================================================
    // /resource search
    // =========================================================

    if (subcommand === 'search') {
      const query = interaction.options.getString('query', true).trim();

      if (query.length === 0) {
        await interaction.reply({
          content: '❌ Search query cannot be empty.',
          ephemeral: true,
        });
        return;
      }

      try {
        const resources = await searchResources(
          interaction.guildId,
          query,
          10,
        );

        if (resources.length === 0) {
          await interaction.reply({
            content: `🔎 No resources found for **${query}**.`,
            ephemeral: true,
          });
          return;
        }

        const embed = new EmbedBuilder()
          .setTitle(`🔎 Resource Search: ${query}`)
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
            text: `Found ${resources.length} resource${
              resources.length === 1 ? '' : 's'
            }`,
          })
          .setTimestamp();

        await interaction.reply({
          embeds: [embed],
        });
      } catch (error) {
        console.error('Failed to search resources:', error);

        await interaction.reply({
          content:
            '❌ Failed to search resources. Please try again later.',
          ephemeral: true,
        });
      }

      return;
    }

    // =========================================================
    // Permission check for ADD and DELETE
    // =========================================================

    if (
      !interaction.memberPermissions?.has(
        PermissionFlagsBits.ManageMessages,
      )
    ) {
      await interaction.reply({
        content:
          '❌ You need the **Manage Messages** permission to manage resources.',
        ephemeral: true,
      });
      return;
    }

    // =========================================================
    // /resource delete
    // =========================================================

    if (subcommand === 'delete') {
      const resourceId = interaction.options.getInteger('id', true);

      try {
        const deleted = await deleteResource(
          resourceId,
          interaction.guildId,
        );

        if (!deleted) {
          await interaction.reply({
            content: `❌ No resource with ID \`${resourceId}\` was found in this server.`,
            ephemeral: true,
          });
          return;
        }

        await interaction.reply({
          content: `🗑️ Resource \`${resourceId}\` has been deleted successfully.`,
          ephemeral: true,
        });
      } catch (error) {
        console.error('Failed to delete resource:', error);

        await interaction.reply({
          content:
            '❌ Failed to delete the resource. Please try again later.',
          ephemeral: true,
        });
      }

      return;
    }

    // =========================================================
    // /resource add
    // =========================================================

    if (subcommand === 'add') {
      const title = interaction.options
        .getString('title', true)
        .trim();

      const url = interaction.options
        .getString('url', true)
        .trim();

      const category = interaction.options
        .getString('category', true)
        .trim();

      const description =
        interaction.options.getString('description')?.trim() || null;

      // ---------------------------------------------------------
      // Validate URL
      // ---------------------------------------------------------

      try {
        new URL(url);
      } catch {
        await interaction.reply({
          content: '❌ Please provide a valid URL.',
          ephemeral: true,
        });
        return;
      }

      // ---------------------------------------------------------
      // Validate text fields
      // ---------------------------------------------------------

      if (title.length === 0 || category.length === 0) {
        await interaction.reply({
          content: '❌ Title and category cannot be empty.',
          ephemeral: true,
        });
        return;
      }

      // ---------------------------------------------------------
      // Create resource
      // ---------------------------------------------------------

      try {
        const resource = await createResource(
          interaction.guildId,
          title,
          url,
          category,
          description,
          interaction.user.id,
        );

        await interaction.reply({
          content:
            `✅ **Resource added successfully!**\n\n` +
            `**ID:** \`${resource.id}\`\n` +
            `**Title:** ${resource.title}\n` +
            `**Category:** ${resource.category}\n` +
            `**URL:** ${resource.url}`,
          ephemeral: true,
        });
      } catch (error) {
        console.error('Failed to create resource:', error);

        await interaction.reply({
          content:
            '❌ Failed to add the resource. Please try again later.',
          ephemeral: true,
        });
      }

      return;
    }

    // =========================================================
    // Unknown subcommand fallback
    // =========================================================

    await interaction.reply({
      content: '❌ Unknown resource command.',
      ephemeral: true,
    });
  },
};

export default command;