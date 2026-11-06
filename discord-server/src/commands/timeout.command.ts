import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionsBitField } from 'discord.js';
import { Command } from '../types/commands.js';
import { parseDurationToMs, formatMsToHuman } from '../utils/parser.js';
import { loggerService } from '../services/logger.service.js';
import { moderationService } from '../services/moderation.service.js';
import { createShieldEmbed } from '../utils/embeds.js';

export const timeoutCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('timeout')
    .setDescription('Temporarily timeout a member to stop disruption')
    .setDefaultMemberPermissions(PermissionsBitField.Flags.ModerateMembers)
    .addUserOption((opt) => opt.setName('user').setDescription('Target member').setRequired(true))
    .addStringOption((opt) =>
      opt
        .setName('duration')
        .setDescription('Duration e.g. 5m, 10m, 1h, 1d, 7d')
        .setRequired(true)
    )
    .addStringOption((opt) => opt.setName('reason').setDescription('Reason for timeout')),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) return;

    const user = interaction.options.getUser('user', true);
    const durationStr = interaction.options.getString('duration', true);
    const reason = interaction.options.getString('reason') || 'Disruptive behavior';

    const durationMs = parseDurationToMs(durationStr);
    if (!durationMs || durationMs < 5000 || durationMs > 28 * 24 * 60 * 60 * 1000) {
      await interaction.reply({
        content: '❌ Invalid duration. Please provide a valid duration between 10s and 28d (e.g., `10m`, `1h`, `2d`).',
        ephemeral: true,
      });
      return;
    }

    const member = await interaction.guild.members.fetch(user.id).catch(() => null);
    if (!member) {
      await interaction.reply({ content: '❌ User is not a member of this server.', ephemeral: true });
      return;
    }

    if (!member.moderatable) {
      await interaction.reply({
        content: '❌ Cannot timeout this user. Their highest role exceeds or equals the bot role.',
        ephemeral: true,
      });
      return;
    }

    try {
      await member.timeout(durationMs, `${interaction.user.tag}: ${reason}`);

      await moderationService.sendUserDm(
        member,
        `🔇 You have been placed in timeout in **${interaction.guild.name}** for **${formatMsToHuman(durationMs)}**.\n**Reason:** ${reason}`
      );

      await loggerService.logModAction({
        guild: interaction.guild,
        action: 'Timeout',
        targetUser: user,
        moderator: interaction.user,
        reason,
        duration: formatMsToHuman(durationMs),
      });

      const embed = createShieldEmbed(
        'Member Timed Out',
        `Successfully timed out **${user.tag}** for **${formatMsToHuman(durationMs)}**.\n**Reason:** ${reason}`
      );

      await interaction.reply({ embeds: [embed] });
    } catch (err: any) {
      await interaction.reply({ content: `❌ Failed to timeout user: ${err.message}`, ephemeral: true });
    }
  },
};
