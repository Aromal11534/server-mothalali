import { Message } from 'discord.js';
import { ScanResult } from '../types/antivirus.js';
import { GuildSecuritySettings } from '../types/guild.js';
import { DISCORD_INVITE_REGEX, EMOJI_REGEX, ZALGO_CHAR_REGEX } from '../utils/patterns.js';

interface UserMessageHistory {
  timestamps: number[];
  recentMessages: { content: string; time: number }[];
}

export class AntiSpamService {
  // Map of `guildId:userId` -> UserMessageHistory
  private userHistory = new Map<string, UserMessageHistory>();

  private getHistory(guildId: string, userId: string): UserMessageHistory {
    const key = `${guildId}:${userId}`;
    let history = this.userHistory.get(key);
    if (!history) {
      history = { timestamps: [], recentMessages: [] };
      this.userHistory.set(key, history);
    }
    return history;
  }

  /**
   * Evaluates message for spam, flood, duplicate messages, mentions, caps, zalgo, and unauthorized invites
   */
  public evaluateMessage(message: Message, settings: GuildSecuritySettings): ScanResult {
    const content = message.content || '';
    const now = Date.now();
    const history = this.getHistory(message.guildId!, message.author.id);

    // 1. Unauthorized Discord Invites
    if (settings.blockDiscordInvites) {
      const inviteMatches = [...content.matchAll(DISCORD_INVITE_REGEX)];
      if (inviteMatches.length > 0) {
        const foundCodes = inviteMatches.map((m) => m[1]);
        const isAllowed = foundCodes.every((code) => settings.allowedInviteGuilds.includes(code));
        if (!isAllowed) {
          return {
            isSafe: false,
            threatType: 'UNAUTHORIZED_INVITE',
            severity: 'MEDIUM',
            reason: `Unauthorized Discord server invite link posted: ${foundCodes.join(', ')}`,
            matchedPattern: inviteMatches[0][0],
          };
        }
      }
    }

    if (!settings.antiSpamEnabled) {
      return { isSafe: true };
    }

    // 2. Rapid Message Flood (Rate limiting)
    const windowMs = settings.windowSeconds * 1000;
    history.timestamps = history.timestamps.filter((t) => now - t <= windowMs);
    history.timestamps.push(now);

    if (history.timestamps.length > settings.maxMessagesPerWindow) {
      return {
        isSafe: false,
        threatType: 'SPAM_FLOOD',
        severity: 'MEDIUM',
        reason: `Exceeded message rate limit (${history.timestamps.length} msgs in ${settings.windowSeconds}s)`,
        matchedPattern: `Rate Limit Breach: ${history.timestamps.length}/${settings.windowSeconds}s`,
      };
    }

    // 3. Duplicate Message Spam
    history.recentMessages = history.recentMessages.filter((m) => now - m.time <= 30000);
    const normalized = content.trim().toLowerCase();
    if (normalized.length > 5) {
      history.recentMessages.push({ content: normalized, time: now });
      const duplicateCount = history.recentMessages.filter((m) => m.content === normalized).length;
      if (duplicateCount >= settings.duplicateMessageThreshold) {
        return {
          isSafe: false,
          threatType: 'SPAM_DUPLICATE',
          severity: 'MEDIUM',
          reason: `Repeated duplicate message sent ${duplicateCount} times.`,
          matchedPattern: content.substring(0, 50),
        };
      }
    }

    // 4. Mass Mentions / Ping Abuse
    const mentionCount = (message.mentions.users.size || 0) + (message.mentions.roles.size || 0);
    if (mentionCount > settings.maxMentions) {
      return {
        isSafe: false,
        threatType: 'SPAM_MENTIONS',
        severity: 'HIGH',
        reason: `Mass mention flood detected (${mentionCount} mentions, limit is ${settings.maxMentions})`,
        matchedPattern: `${mentionCount} mentions`,
      };
    }

    // 5. Mass Emojis
    const emojiMatches = content.match(EMOJI_REGEX);
    if (emojiMatches && emojiMatches.length > settings.maxEmojis) {
      return {
        isSafe: false,
        threatType: 'SPAM_EMOJI',
        severity: 'LOW',
        reason: `Excessive emoji spam (${emojiMatches.length} emojis, limit is ${settings.maxEmojis})`,
        matchedPattern: `${emojiMatches.length} emojis`,
      };
    }

    // 6. Excessive Caps
    if (content.length >= 12) {
      const letters = content.replace(/[^a-zA-Z]/g, '');
      if (letters.length >= 8) {
        const uppercase = letters.replace(/[^A-Z]/g, '').length;
        const capsPercentage = (uppercase / letters.length) * 100;
        if (capsPercentage >= settings.maxCapsPercent) {
          return {
            isSafe: false,
            threatType: 'SPAM_CAPS',
            severity: 'LOW',
            reason: `Excessive CAPS detected (${Math.round(capsPercentage)}% uppercase letters)`,
            matchedPattern: `${Math.round(capsPercentage)}% CAPS`,
          };
        }
      }
    }

    // 7. Zalgo / Character Distortion
    if (settings.blockZalgo) {
      const zalgoMatches = content.match(ZALGO_CHAR_REGEX);
      if (zalgoMatches && zalgoMatches.length > 15) {
        return {
          isSafe: false,
          threatType: 'ZALGO_TEXT',
          severity: 'LOW',
          reason: `Distorted / Zalgo text detected (${zalgoMatches.length} combining marks)`,
          matchedPattern: 'Zalgo Glitch Characters',
        };
      }
    }

    return { isSafe: true };
  }

  /**
   * Housekeeping: clean up old user history to prevent memory leak
   */
  public cleanup(): void {
    const now = Date.now();
    for (const [key, history] of this.userHistory.entries()) {
      history.timestamps = history.timestamps.filter((t) => now - t <= 60000);
      history.recentMessages = history.recentMessages.filter((m) => now - m.time <= 60000);
      if (history.timestamps.length === 0 && history.recentMessages.length === 0) {
        this.userHistory.delete(key);
      }
    }
  }
}

export const antiSpamService = new AntiSpamService();
