import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionsBitField, EmbedBuilder } from 'discord.js';
import { Command } from '../types/commands.js';
import { db } from '../storage/database.js';
import { COLORS, createShieldEmbed } from '../utils/embeds.js';

export const settingsCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('settings')
    .setDescription('Configure Server Mothalali security settings and channels')
    .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
    .addSubcommand((sub) => sub.setName('view').setDescription('View complete server security configuration'))
    .addSubcommand((sub) =>
      sub
        .setName('modlog')
        .setDescription('Set the channel for general moderation logs')
        .addChannelOption((opt) => opt.setName('channel').setDescription('Mod log channel').setRequired(true))
    )
    .addSubcommand((sub) =>
      sub
        .setName('alerts')
        .setDescription('Set the channel for high-priority security and threat alerts')
        .addChannelOption((opt) => opt.setName('channel').setDescription('Security alerts channel').setRequired(true))
    )
    .addSubcommand((sub) =>
      sub
        .setName('quarantine_role')
        .setDescription('Set the quarantine role assigned to unverified or suspicious raid accounts')
        .addRoleOption((opt) => opt.setName('role').setDescription('Quarantine role').setRequired(true))
    ),
  requireAdmin: true,

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) return;

    const sub = interaction.options.getSubcommand();
    const settings = db.getGuildSettings(interaction.guild.id);

    if (sub === 'view') {
      const embed = new EmbedBuilder()
        .setTitle(`🛡️ Server Mothalali Configuration | ${interaction.guild.name}`)
        .setColor(COLORS.PRIMARY)
        .addFields(
          {
            name: '📡 Designated Channels',
            value: [
              `• **Mod Log:** ${settings.modLogChannelId ? `<#${settings.modLogChannelId}>` : '`Not Set`'}`,
              `• **Security Alerts:** ${settings.securityAlertsChannelId ? `<#${settings.securityAlertsChannelId}>` : '`Not Set`'}`,
              `• **Quarantine Role:** ${settings.quarantineRoleId ? `<@&${settings.quarantineRoleId}>` : '`None`'}`,
            ].join('\n'),
          },
          {
            name: '🛡️ Antivirus Shields',
            value: [
              `• **Antivirus Engine:** ${settings.antivirusEnabled ? '🟢 ON' : '🔴 OFF'}`,
              `• **Attachments Scan:** ${settings.scanAttachments ? '🟢 ON' : '🔴 OFF'}`,
              `• **Phishing URL Filter:** ${settings.blockMaliciousUrls ? '🟢 ON' : '🔴 OFF'}`,
              `• **IP Logger Filter:** ${settings.blockIpLoggers ? '🟢 ON' : '🔴 OFF'}`,
              `• **Token Grabber Defense:** ${settings.blockTokenGrabbers ? '🟢 ON' : '🔴 OFF'}`,
              `• **Discord Invites Blocked:** ${settings.blockDiscordInvites ? '🟢 ON' : '🔴 OFF'}`,
            ].join('\n'),
            inline: true,
          },
          {
            name: '⚡ Anti-Spam & Abuse',
            value: [
              `• **Anti-Spam Master:** ${settings.antiSpamEnabled ? '🟢 ON' : '🔴 OFF'}`,
              `• **Rate Limit:** \`${settings.maxMessagesPerWindow} msgs / ${settings.windowSeconds}s\``,
              `• **Duplicate Limit:** \`${settings.duplicateMessageThreshold} msgs\``,
              `• **Max Mentions:** \`${settings.maxMentions}\``,
              `• **Max Emojis:** \`${settings.maxEmojis}\``,
              `• **Max Caps:** \`${settings.maxCapsPercent}%\``,
            ].join('\n'),
            inline: true,
          },
          {
            name: '🚨 Anti-Raid Defense',
            value: [
              `• **Anti-Raid Master:** ${settings.antiRaidEnabled ? '🟢 ON' : '🔴 OFF'}`,
              `• **Join Threshold:** \`${settings.joinVelocityThreshold} joins / ${settings.joinVelocitySeconds}s\``,
              `• **Min Account Age:** \`${settings.minAccountAgeHours} hours\``,
              `• **Raid Action:** \`${settings.raidAction.toUpperCase()}\``,
            ].join('\n'),
          }
        )
        .setFooter({ text: 'Use /antivirus, /antiraid, or /settings to reconfigure' })
        .setTimestamp();

      await interaction.reply({ embeds: [embed], ephemeral: true });
      return;
    }

    if (sub === 'modlog') {
      const channel = interaction.options.getChannel('channel', true);
      db.updateGuildSettings(interaction.guild.id, { modLogChannelId: channel.id });

      const embed = createShieldEmbed('Mod Log Channel Updated', `Mod log channel set to <#${channel.id}>.`);
      await interaction.reply({ embeds: [embed], ephemeral: true });
      return;
    }

    if (sub === 'alerts') {
      const channel = interaction.options.getChannel('channel', true);
      db.updateGuildSettings(interaction.guild.id, { securityAlertsChannelId: channel.id });

      const embed = createShieldEmbed('Security Alerts Channel Updated', `High-priority alerts channel set to <#${channel.id}>.`);
      await interaction.reply({ embeds: [embed], ephemeral: true });
      return;
    }

    if (sub === 'quarantine_role') {
      const role = interaction.options.getRole('role', true);
      db.updateGuildSettings(interaction.guild.id, { quarantineRoleId: role.id });

      const embed = createShieldEmbed('Quarantine Role Updated', `Quarantine role set to <@&${role.id}>.`);
      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
  },
};
