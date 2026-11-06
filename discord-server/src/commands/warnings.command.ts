import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionsBitField, EmbedBuilder } from 'discord.js';
import { Command } from '../types/commands.js';
import { db } from '../storage/database.js';
import { COLORS } from '../utils/embeds.js';

export const warningsCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('warnings')
    .setDescription('View active warnings and infraction history for a member')
    .setDefaultMemberPermissions(PermissionsBitField.Flags.ModerateMembers)
    .addUserOption((opt) => opt.setName('user').setDescription('Target user').setRequired(true)),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) return;

    const user = interaction.options.getUser('user', true);
    const infractions = db.getUserInfractions(interaction.guild.id, user.id);

    if (infractions.length === 0) {
      await interaction.reply({
        content: `✅ **${user.tag}** has a completely clean record with 0 active warnings.`,
        ephemeral: true,
      });
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle(`📜 Warning History for ${user.tag}`)
      .setColor(infractions.length >= 3 ? COLORS.DANGER : COLORS.WARNING)
      .setThumbnail(user.displayAvatarURL())
      .setDescription(
        infractions
          .map(
            (inf, idx) =>
              `**${idx + 1}. [${inf.type.toUpperCase()}]** <t:${Math.floor(inf.timestamp / 1000)}:R>\n` +
              `• **Reason:** ${inf.reason}\n` +
              `• **Moderator:** <@${inf.moderatorId}>\n` +
              `• **ID:** \`${inf.id}\``
          )
          .join('\n\n')
      )
      .setFooter({ text: `Total Active Strikes: ${infractions.length}` })
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
