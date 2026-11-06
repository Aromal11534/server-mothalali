import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionsBitField } from 'discord.js';
import { Command } from '../types/commands.js';
import { loggerService } from '../services/logger.service.js';
import { createShieldEmbed } from '../utils/embeds.js';

export const untimeoutCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('untimeout')
    .setDescription('Remove timeout from a server member')
    .setDefaultMemberPermissions(PermissionsBitField.Flags.ModerateMembers)
    .addUserOption((opt) => opt.setName('user').setDescription('Target member').setRequired(true))
    .addStringOption((opt) => opt.setName('reason').setDescription('Reason for removing timeout')),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) return;

    const user = interaction.options.getUser('user', true);
    const reason = interaction.options.getString('reason') || 'Timeout removed by moderator';

    const member = await interaction.guild.members.fetch(user.id).catch(() => null);
    if (!member) {
      await interaction.reply({ content: '❌ User is not a member of this server.', ephemeral: true });
      return;
    }

    if (!member.isCommunicationDisabled()) {
      await interaction.reply({ content: `ℹ️ **${user.tag}** is not currently timed out.`, ephemeral: true });
      return;
    }

    try {
      await member.timeout(null, `${interaction.user.tag}: ${reason}`);

      await loggerService.logModAction({
        guild: interaction.guild,
        action: 'Untimeout',
        targetUser: user,
        moderator: interaction.user,
        reason,
      });

      const embed = createShieldEmbed(
        'Timeout Removed',
        `Restored communication privileges for **${user.tag}**.\n**Reason:** ${reason}`
      );

      await interaction.reply({ embeds: [embed] });
    } catch (err: any) {
      await interaction.reply({ content: `❌ Failed to remove timeout: ${err.message}`, ephemeral: true });
    }
  },
};
