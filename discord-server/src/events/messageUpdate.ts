import { Message, PartialMessage } from 'discord.js';
import { db } from '../storage/database.js';
import { antivirusService } from '../services/antivirus.service.js';
import { antiSpamService } from '../services/antispam.service.js';
import { moderationService } from '../services/moderation.service.js';

export async function handleMessageUpdate(
  oldMessage: Message | PartialMessage,
  newMessage: Message | PartialMessage
): Promise<void> {
  // If partial, try fetching complete message
  let fullMessage: Message;
  try {
    fullMessage = newMessage.partial ? await newMessage.fetch() : (newMessage as Message);
  } catch {
    return; // Message may have been deleted already
  }

  if (fullMessage.author.bot || fullMessage.webhookId) return;
  if (!fullMessage.guild || !fullMessage.member) return;

  // Don't re-scan if content didn't change
  if (oldMessage.content === fullMessage.content && oldMessage.attachments.size === fullMessage.attachments.size) {
    return;
  }

  const settings = db.getGuildSettings(fullMessage.guild.id);

  if (moderationService.isMemberBypassed(fullMessage.member, settings)) {
    return;
  }

  db.incrementScannedMessages(1);

  // 1. Antivirus Scan on edited message
  if (settings.antivirusEnabled) {
    const avResult = antivirusService.scanMessage(fullMessage, settings);
    if (!avResult.isSafe) {
      await moderationService.handleViolation(fullMessage, avResult, settings);
      return;
    }
  }

  // 2. Anti-Spam Scan on edited message
  if (settings.antiSpamEnabled || settings.blockDiscordInvites) {
    const spamResult = antiSpamService.evaluateMessage(fullMessage, settings);
    if (!spamResult.isSafe) {
      await moderationService.handleViolation(fullMessage, spamResult, settings);
      return;
    }
  }
}
