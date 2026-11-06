import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Guild,
  Message,
  TextChannel,
  User,
} from 'discord.js';
import { db } from '../storage/database.js';
import { ThreatSeverity } from '../types/antivirus.js';
import { createThreatEmbed, createModActionEmbed } from '../utils/embeds.js';

export class LoggerService {
  /**
   * Dispatch a security threat alert to the guild's configured mod log channel
   */
  public async logThreat(options: {
    guild: Guild;
    user: User;
    channelName: string;
    threatType: string;
    severity: ThreatSeverity;
    reason: string;
    actionTaken: string;
    details: string;
    originalMessageId?: string;
  }): Promise<void> {
    const settings = db.getGuildSettings(options.guild.id);
    const targetChannelId = settings.securityAlertsChannelId || settings.modLogChannelId;

    if (!targetChannelId) return;

    try {
      const channel = await options.guild.channels.fetch(targetChannelId);
      if (channel && channel.isTextBased()) {
        const textChannel = channel as TextChannel;
        const embed = createThreatEmbed({
          threatType: options.threatType,
          severity: options.severity,
          user: options.user,
          channelName: options.channelName,
          actionTaken: options.actionTaken,
          details: options.details,
        });

        // Quick mod action buttons
        const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setCustomId(`mothalali:pardon:${options.user.id}`)
            .setLabel('Pardon / Clear Strike')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('🛡️'),
          new ButtonBuilder()
            .setCustomId(`mothalali:ban:${options.user.id}`)
            .setLabel('Ban User')
            .setStyle(ButtonStyle.Danger)
            .setEmoji('🔨')
        );

        await textChannel.send({
          embeds: [embed],
          components: [actionRow],
        });
      }
    } catch (err) {
      console.error(`[LoggerService] Failed to send threat log to channel ${targetChannelId}:`, err);
    }
  }

  /**
   * Dispatch a moderator action log
   */
  public async logModAction(options: {
    guild: Guild;
    action: string;
    targetUser: User;
    moderator: User;
    reason: string;
    duration?: string;
  }): Promise<void> {
    const settings = db.getGuildSettings(options.guild.id);
    const targetChannelId = settings.modLogChannelId || settings.securityAlertsChannelId;

    if (!targetChannelId) return;

    try {
      const channel = await options.guild.channels.fetch(targetChannelId);
      if (channel && channel.isTextBased()) {
        const textChannel = channel as TextChannel;
        const embed = createModActionEmbed(options);
        await textChannel.send({ embeds: [embed] });
      }
    } catch (err) {
      console.error(`[LoggerService] Failed to send mod action log:`, err);
    }
  }
}

export const loggerService = new LoggerService();
