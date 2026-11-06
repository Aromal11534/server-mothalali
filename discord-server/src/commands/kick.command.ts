import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionsBitField } from 'discord.js';
import { Command } from '../types/commands.js';
import { loggerService } from '../services/logger.service.js';
import { moderationService } from '../services/moderation.service.js';
import { createShieldEmbed } from '../utils/embeds.js';

export const kickCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Kick a member from the server')
    .setDefaultMemberPermissions(PermissionsBitField.Flags.KickMembers)
    .addUserOption((opt) => opt.setName('user').setDescription('Target member to kick').setRequired(true))
    .addStringOption((opt) => opt.setName('reason').setDescription('Reason for kick')),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) return;

    const user = interaction.options.getUser('user', true);
    const reason = interaction.options.getString('reason') || 'Kicked by administrator';

    const member = await interaction.guild.members.fetch(user.id).catch(() => null);
    if (!member) {
      await interaction.reply({ content: '❌ User is not in this server.', ephemeral: true });
      return;
    }

    if (!member.kickable) {
      await interaction.reply({
        content: '❌ Cannot kick this user. Their permissions or highest role are equal to or above the bot.',
        ephemeral: true,
      });
      return;
    }

    try {
      await moderationService.sendUserDm(
        member,
        `👢 You have been kicked from **${interaction.guild.name}**.\n**Reason:** ${reason}`
      );

      await member.kick(`${interaction.user.tag}: ${reason}`);

      await loggerService.logModAction({
        guild: interaction.guild,
        action: 'Kick',
        targetUser: user,
        moderator: interaction.user,
        reason,
      });

      const embed = createShieldEmbed(
        'Member Kicked',
        `Successfully kicked **${user.tag}** (\`${user.id}\`).\n**Reason:** ${reason}`
      );

      await interaction.reply({ embeds: [embed] });
    } catch (err: any) {
      await interaction.reply({ content: `❌ Failed to kick user: ${err.message}`, ephemeral: true });
    }
  },
};
