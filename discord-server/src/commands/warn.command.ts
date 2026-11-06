import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionsBitField } from 'discord.js';
import { Command } from '../types/commands.js';
import { db } from '../storage/database.js';
import { loggerService } from '../services/logger.service.js';
import { moderationService } from '../services/moderation.service.js';
import { createShieldEmbed } from '../utils/embeds.js';

export const warnCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Issue a formal security warning/strike to a server member')
    .setDefaultMemberPermissions(PermissionsBitField.Flags.ModerateMembers)
    .addUserOption((opt) => opt.setName('user').setDescription('Member to warn').setRequired(true))
    .addStringOption((opt) => opt.setName('reason').setDescription('Reason for the warning').setRequired(true)),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) return;

    const user = interaction.options.getUser('user', true);
    const reason = interaction.options.getString('reason', true);
    const member = await interaction.guild.members.fetch(user.id).catch(() => null);

    if (user.bot) {
      await interaction.reply({ content: '❌ You cannot warn bot accounts.', ephemeral: true });
      return;
    }

    if (user.id === interaction.user.id) {
      await interaction.reply({ content: '❌ You cannot warn yourself.', ephemeral: true });
      return;
    }

    const infraction = db.addInfraction({
      guildId: interaction.guild.id,
      userId: user.id,
      moderatorId: interaction.user.id,
      type: 'warn',
      reason,
    });

    const activeCount = db.getUserInfractions(interaction.guild.id, user.id).length;

    // Send DM to member
    if (member) {
      await moderationService.sendUserDm(
        member,
        `⚠️ **Warning from ${interaction.guild.name}**\nYou have received a warning from <@${interaction.user.id}>.\n**Reason:** ${reason}\n**Total Active Strikes:** ${activeCount}`
      );
    }

    // Log action
    await loggerService.logModAction({
      guild: interaction.guild,
      action: `Warn (Strike #${activeCount})`,
      targetUser: user,
      moderator: interaction.user,
      reason,
    });

    const embed = createShieldEmbed(
      'Warning Issued',
      `Warned **${user.tag}** (\`${user.id}\`).\n**Reason:** ${reason}\n**Active Strikes:** \`${activeCount}\``
    );

    await interaction.reply({ embeds: [embed] });
  },
};
