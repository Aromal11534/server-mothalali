import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionsBitField, TextChannel } from 'discord.js';
import { Command } from '../types/commands.js';
import { URL_REGEX } from '../utils/patterns.js';
import { createShieldEmbed } from '../utils/embeds.js';

export const purgeCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('purge')
    .setDescription('Bulk delete messages with security filter options')
    .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageMessages)
    .addIntegerOption((opt) =>
      opt
        .setName('amount')
        .setDescription('Number of messages to inspect and purge (1-100)')
        .setMinValue(1)
        .setMaxValue(100)
        .setRequired(true)
    )
    .addStringOption((opt) =>
      opt
        .setName('filter')
        .setDescription('Filter messages to target')
        .addChoices(
          { name: 'All Messages', value: 'all' },
          { name: 'Bot Messages Only', value: 'bots' },
          { name: 'Messages with Links', value: 'links' },
          { name: 'Messages with Attachments/Files', value: 'attachments' }
        )
    )
    .addUserOption((opt) => opt.setName('user').setDescription('Purge only messages sent by this specific user')),

  async execute(interaction: ChatInputCommandInteraction) {
    const channel = interaction.channel;
    if (!channel || !channel.isTextBased() || !('bulkDelete' in channel)) {
      await interaction.reply({ content: '❌ Purge cannot be used in this channel.', ephemeral: true });
      return;
    }

    const amount = interaction.options.getInteger('amount', true);
    const filter = interaction.options.getString('filter') || 'all';
    const targetUser = interaction.options.getUser('user');

    await interaction.deferReply({ ephemeral: true });

    try {
      const textChannel = channel as TextChannel;
      const fetched = await textChannel.messages.fetch({ limit: amount });

      const filtered = fetched.filter((msg) => {
        // Exclude messages older than 14 days (Discord API restriction)
        const isOld = Date.now() - msg.createdTimestamp > 14 * 24 * 60 * 60 * 1000;
        if (isOld) return false;

        if (targetUser && msg.author.id !== targetUser.id) return false;

        switch (filter) {
          case 'bots':
            return msg.author.bot;
          case 'links':
            return URL_REGEX.test(msg.content);
          case 'attachments':
            return msg.attachments.size > 0;
          case 'all':
          default:
            return true;
        }
      });

      if (filtered.size === 0) {
        await interaction.editReply({ content: 'ℹ️ No matching messages found to delete.' });
        return;
      }

      const deleted = await textChannel.bulkDelete(filtered, true);

      const embed = createShieldEmbed(
        'Purge Completed',
        `Successfully cleaned up **${deleted.size}** message(s) with filter \`${filter}\`${targetUser ? ` from ${targetUser.tag}` : ''}.`
      );

      await interaction.editReply({ embeds: [embed] });
    } catch (err: any) {
      await interaction.editReply({ content: `❌ Error purging messages: ${err.message}` });
    }
  },
};
