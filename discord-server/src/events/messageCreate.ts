import { Message } from 'discord.js';
import { db } from '../storage/database.js';
import { antivirusService } from '../services/antivirus.service.js';
import { antiSpamService } from '../services/antispam.service.js';
import { moderationService } from '../services/moderation.service.js';

export async function handleMessageCreate(message: Message): Promise<void> {
  // Ignore bots and webhooks
  if (message.author.bot || message.webhookId) return;

  // Only handle guild messages
  if (!message.guild || !message.member) return;

  const guildId = message.guild.id;
  const settings = db.getGuildSettings(guildId);

  // Check bypass permissions (Administrators, server owner, whitelisted roles)
  if (moderationService.isMemberBypassed(message.member, settings)) {
    return;
  }

  // Increment telemetry
  db.incrementScannedMessages(1);
  if (message.attachments.size > 0) {
    db.incrementScannedFiles(message.attachments.size);
  }

  // 1. Antivirus / Malware / Phishing / Token Grabber Inspection
  if (settings.antivirusEnabled) {
    const avResult = antivirusService.scanMessage(message, settings);
    if (!avResult.isSafe) {
      await moderationService.handleViolation(message, avResult, settings);
      return;
    }
  }

  // 2. Anti-Spam / Flood / Mentions / Invite Inspection
  if (settings.antiSpamEnabled || settings.blockDiscordInvites) {
    const spamResult = antiSpamService.evaluateMessage(message, settings);
    if (!spamResult.isSafe) {
      await moderationService.handleViolation(message, spamResult, settings);
      return;
    }
  }
}
