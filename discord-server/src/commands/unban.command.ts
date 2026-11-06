import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionsBitField } from 'discord.js';
import { Command } from '../types/commands.js';
import { loggerService } from '../services/logger.service.js';
import { createShieldEmbed } from '../utils/embeds.js';

export const unbanCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('unban')
    .setDescription('Revoke a server ban for a user by their User ID')
    .setDefaultMemberPermissions(PermissionsBitField.Flags.BanMembers)
    .addStringOption((opt) => opt.setName('user_id').setDescription('User ID of the banned user').setRequired(true))
    .addStringOption((opt) => opt.setName('reason').setDescription('Reason for unban')),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) return;

    const userId = interaction.options.getString('user_id', true).trim();
    const reason = interaction.options.getString('reason') || 'Pardoned by administrator';

    try {
      const ban = await interaction.guild.bans.fetch(userId).catch(() => null);
      if (!ban) {
        await interaction.reply({
          content: `❌ No ban record found for User ID \`${userId}\`.`,
          ephemeral: true,
        });
        return;
      }

      await interaction.guild.bans.remove(userId, `${interaction.user.tag}: ${reason}`);

      await loggerService.logModAction({
        guild: interaction.guild,
        action: 'Unban',
        targetUser: ban.user,
        moderator: interaction.user,
        reason,
      });

      const embed = createShieldEmbed(
        'User Unbanned',
        `Successfully lifted ban for **${ban.user.tag}** (\`${userId}\`).\n**Reason:** ${reason}`
      );

      await interaction.reply({ embeds: [embed] });
    } catch (err: any) {
      await interaction.reply({ content: `❌ Failed to unban: ${err.message}`, ephemeral: true });
    }
  },
};
