import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionsBitField } from 'discord.js';
import { Command } from '../types/commands.js';
import { db } from '../storage/database.js';
import { loggerService } from '../services/logger.service.js';
import { createShieldEmbed } from '../utils/embeds.js';

export const clearwarningsCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('clearwarnings')
    .setDescription('Clear all active warnings and strikes for a member')
    .setDefaultMemberPermissions(PermissionsBitField.Flags.ModerateMembers)
    .addUserOption((opt) => opt.setName('user').setDescription('Target user').setRequired(true))
    .addStringOption((opt) => opt.setName('reason').setDescription('Reason for clearing strikes')),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) return;

    const user = interaction.options.getUser('user', true);
    const reason = interaction.options.getString('reason') || 'Administrative pardon';

    const clearedCount = db.clearUserInfractions(interaction.guild.id, user.id);

    if (clearedCount === 0) {
      await interaction.reply({
        content: `ℹ️ **${user.tag}** had no active warnings to clear.`,
        ephemeral: true,
      });
      return;
    }

    await loggerService.logModAction({
      guild: interaction.guild,
      action: 'Clear Warnings',
      targetUser: user,
      moderator: interaction.user,
      reason: `${reason} (${clearedCount} strikes cleared)`,
    });

    const embed = createShieldEmbed(
      'Strikes Cleared',
      `Pardoned **${user.tag}** and cleared **${clearedCount} active strike(s)**.\n**Reason:** ${reason}`
    );

    await interaction.reply({ embeds: [embed] });
  },
};
