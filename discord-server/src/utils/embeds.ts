import { EmbedBuilder, User } from 'discord.js';
import { ThreatSeverity } from '../types/antivirus.js';

export const COLORS = {
  PRIMARY: 0x5865f2,
  SUCCESS: 0x57f287,
  WARNING: 0xfee75c,
  DANGER: 0xed4245,
  CRITICAL: 0x992d22,
  INFO: 0x3498db,
  SHIELD: 0x2b2d31,
};

export function createShieldEmbed(title: string, description: string): EmbedBuilder {
  return new EmbedBuilder()
    .setTitle(`🛡️ Server Mothalali | ${title}`)
    .setDescription(description)
    .setColor(COLORS.PRIMARY)
    .setFooter({ text: 'Server Mothalali Security Suite' })
    .setTimestamp();
}

export function createThreatEmbed(options: {
  threatType: string;
  severity: ThreatSeverity;
  user: User;
  channelName: string;
  actionTaken: string;
  details: string;
}): EmbedBuilder {
  let color = COLORS.WARNING;
  if (options.severity === 'HIGH') color = COLORS.DANGER;
  if (options.severity === 'CRITICAL') color = COLORS.CRITICAL;

  return new EmbedBuilder()
    .setTitle(`🚨 Security Threat Detected: ${options.threatType}`)
    .setColor(color)
    .setThumbnail(options.user.displayAvatarURL())
    .addFields(
      { name: '👤 Offender', value: `${options.user.tag} (\`${options.user.id}\`)`, inline: true },
      { name: '📍 Channel', value: `#${options.channelName}`, inline: true },
      { name: '⚡ Severity', value: `\`${options.severity}\``, inline: true },
      { name: '🛡️ Action Taken', value: options.actionTaken, inline: true },
      { name: '📝 Threat Details', value: options.details.length > 1024 ? options.details.substring(0, 1020) + '...' : options.details }
    )
    .setFooter({ text: 'Automated Protection Triggered' })
    .setTimestamp();
}

export function createModActionEmbed(options: {
  action: string;
  targetUser: User;
  moderator: User;
  reason: string;
  duration?: string;
}): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setTitle(`🔨 Moderation Action: ${options.action}`)
    .setColor(COLORS.DANGER)
    .setThumbnail(options.targetUser.displayAvatarURL())
    .addFields(
      { name: 'Target', value: `${options.targetUser.tag} (\`${options.targetUser.id}\`)`, inline: true },
      { name: 'Moderator', value: `${options.moderator.tag}`, inline: true },
      { name: 'Reason', value: options.reason }
    )
    .setFooter({ text: 'Server Mothalali ModLog' })
    .setTimestamp();

  if (options.duration) {
    embed.addFields({ name: 'Duration', value: options.duration, inline: true });
  }

  return embed;
}
