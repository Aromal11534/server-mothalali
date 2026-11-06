import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { Command } from '../types/commands.js';
import { db } from '../storage/database.js';
import { COLORS } from '../utils/embeds.js';

export const statusCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('status')
    .setDescription('Display Server Mothalali security status, scan statistics, and active shields'),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) return;

    const settings = db.getGuildSettings(interaction.guild.id);
    const stats = db.getStats();

    const uptimeSeconds = Math.floor(process.uptime());
    const uptimeStr = `${Math.floor(uptimeSeconds / 3600)}h ${Math.floor((uptimeSeconds % 3600) / 60)}m ${uptimeSeconds % 60}s`;

    const embed = new EmbedBuilder()
      .setTitle('🛡️ Server Mothalali | System Security Status')
      .setColor(COLORS.SUCCESS)
      .setThumbnail(interaction.client.user?.displayAvatarURL() || null)
      .addFields(
        {
          name: '🛡️ Active Shields',
          value: [
            `• **Antivirus Engine:** ${settings.antivirusEnabled ? '🟢 ACTIVE' : '🔴 DISABLED'}`,
            `• **Malicious Links & Phishing:** ${settings.blockMaliciousUrls ? '🟢 ACTIVE' : '🔴 DISABLED'}`,
            `• **File Attachment Scanner:** ${settings.scanAttachments ? '🟢 ACTIVE' : '🔴 DISABLED'}`,
            `• **IP Logger Filter:** ${settings.blockIpLoggers ? '🟢 ACTIVE' : '🔴 DISABLED'}`,
            `• **Token Grabber Defense:** ${settings.blockTokenGrabbers ? '🟢 ACTIVE' : '🔴 DISABLED'}`,
            `• **Anti-Spam & Abuse:** ${settings.antiSpamEnabled ? '🟢 ACTIVE' : '🔴 DISABLED'}`,
            `• **Anti-Raid Velocity:** ${settings.antiRaidEnabled ? '🟢 ACTIVE' : '🔴 DISABLED'}`,
          ].join('\n'),
        },
        {
          name: '📊 Global Security Telemetry',
          value: [
            `• **Messages Inspected:** \`${stats.messagesScanned.toLocaleString()}\``,
            `• **Threats Neutralized:** \`${stats.threatsBlocked.toLocaleString()}\``,
            `• **Files Scanned:** \`${stats.filesScanned.toLocaleString()}\``,
            `• **Enforcements Executed:** \`${stats.actionsTaken.toLocaleString()}\``,
          ].join('\n'),
          inline: true,
        },
        {
          name: '⚙️ Server Config',
          value: [
            `• **Mod Log:** ${settings.modLogChannelId ? `<#${settings.modLogChannelId}>` : '`Not Set`'}`,
            `• **Alerts Channel:** ${settings.securityAlertsChannelId ? `<#${settings.securityAlertsChannelId}>` : '`Not Set`'}`,
            `• **Min Account Age:** \`${settings.minAccountAgeHours}h\``,
            `• **Uptime:** \`${uptimeStr}\``,
          ].join('\n'),
          inline: true,
        }
      )
      .setFooter({ text: 'Server Mothalali Enterprise Shield' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
