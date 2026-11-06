import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionsBitField } from 'discord.js';
import { Command } from '../types/commands.js';
import { loggerService } from '../services/logger.service.js';
import { moderationService } from '../services/moderation.service.js';
import { createShieldEmbed } from '../utils/embeds.js';

export const banCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Permanently ban a member from the server')
    .setDefaultMemberPermissions(PermissionsBitField.Flags.BanMembers)
    .addUserOption((opt) => opt.setName('user').setDescription('Target user to ban').setRequired(true))
    .addStringOption((opt) => opt.setName('reason').setDescription('Reason for ban'))
    .addIntegerOption((opt) =>
      opt
        .setName('delete_days')
        .setDescription('Number of days of message history to delete (0-7)')
        .setMinValue(0)
        .setMaxValue(7)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) return;

    const user = interaction.options.getUser('user', true);
    const reason = interaction.options.getString('reason') || 'Banned by administrator';
    const deleteDays = interaction.options.getInteger('delete_days') || 0;

    const member = await interaction.guild.members.fetch(user.id).catch(() => null);

    if (member && !member.bannable) {
      await interaction.reply({
        content: '❌ Cannot ban this user. Their permissions or highest role are equal to or above the bot.',
        ephemeral: true,
      });
      return;
    }

    try {
      if (member) {
        await moderationService.sendUserDm(
          member,
          `🔨 You have been banned from **${interaction.guild.name}**.\n**Reason:** ${reason}`
        );
      }

      await interaction.guild.bans.create(user.id, {
        deleteMessageSeconds: deleteDays * 86400,
        reason: `${interaction.user.tag}: ${reason}`,
      });

      await loggerService.logModAction({
        guild: interaction.guild,
        action: 'Ban',
        targetUser: user,
        moderator: interaction.user,
        reason: `${reason} (${deleteDays}d messages deleted)`,
      });

      const embed = createShieldEmbed(
        'User Banned',
        `Successfully banned **${user.tag}** (\`${user.id}\`).\n**Reason:** ${reason}\n**Deleted History:** ${deleteDays} days`
      );

      await interaction.reply({ embeds: [embed] });
    } catch (err: any) {
      await interaction.reply({ content: `❌ Failed to ban user: ${err.message}`, ephemeral: true });
    }
  },
};
