import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionsBitField } from 'discord.js';
import { Command } from '../types/commands.js';
import { db } from '../storage/database.js';
import { createShieldEmbed } from '../utils/embeds.js';

export const antivirusCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('antivirus')
    .setDescription('Configure Server Mothalali Antivirus protection engine')
    .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
    .addSubcommand((sub) =>
      sub.setName('status').setDescription('View current Antivirus and malware protection settings')
    )
    .addSubcommand((sub) =>
      sub
        .setName('toggle')
        .setDescription('Enable or disable specific security shields')
        .addStringOption((opt) =>
          opt
            .setName('shield')
            .setDescription('Select the shield to modify')
            .setRequired(true)
            .addChoices(
              { name: 'Full Antivirus Engine', value: 'antivirusEnabled' },
              { name: 'Scan Attachments (.exe, scripts, double-exts)', value: 'scanAttachments' },
              { name: 'Block Phishing & Malicious URLs', value: 'blockMaliciousUrls' },
              { name: 'Block IP Loggers & Trackers', value: 'blockIpLoggers' },
              { name: 'Block Token Grabbers & Webhooks', value: 'blockTokenGrabbers' },
              { name: 'Block Unauthorized Discord Invites', value: 'blockDiscordInvites' }
            )
        )
        .addBooleanOption((opt) =>
          opt.setName('enabled').setDescription('Enable (true) or Disable (false)').setRequired(true)
        )
    ),
  requireAdmin: true,

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) return;

    const sub = interaction.options.getSubcommand();
    const settings = db.getGuildSettings(interaction.guild.id);

    if (sub === 'status') {
      const desc = [
        `**🛡️ Antivirus Engine Status:**`,
        `• **Master Shield:** ${settings.antivirusEnabled ? '🟢 Enabled' : '🔴 Disabled'}`,
        `• **Attachment Inspector:** ${settings.scanAttachments ? '🟢 Enabled' : '🔴 Disabled'}`,
        `• **Phishing URL Detection:** ${settings.blockMaliciousUrls ? '🟢 Enabled' : '🔴 Disabled'}`,
        `• **IP Logger Blocker:** ${settings.blockIpLoggers ? '🟢 Enabled' : '🔴 Disabled'}`,
        `• **Token Grabber Defense:** ${settings.blockTokenGrabbers ? '🟢 Enabled' : '🔴 Disabled'}`,
        `• **Discord Invites Filter:** ${settings.blockDiscordInvites ? '🟢 Enabled' : '🔴 Disabled'}`,
      ].join('\n');

      const embed = createShieldEmbed('Antivirus Diagnostics', desc);
      await interaction.reply({ embeds: [embed], ephemeral: true });
      return;
    }

    if (sub === 'toggle') {
      const shield = interaction.options.getString('shield', true);
      const enabled = interaction.options.getBoolean('enabled', true);

      db.updateGuildSettings(interaction.guild.id, { [shield]: enabled });

      const embed = createShieldEmbed(
        'Shield Configured',
        `Successfully updated **${shield}** to **${enabled ? '🟢 Enabled' : '🔴 Disabled'}**.`
      );
      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
  },
};
