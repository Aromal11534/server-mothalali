import { GuildMember, Message, PermissionsBitField } from 'discord.js';
import { db } from '../storage/database.js';
import { ScanResult } from '../types/antivirus.js';
import { GuildSecuritySettings } from '../types/guild.js';
import { loggerService } from './logger.service.js';

export class ModerationService {
  /**
   * Enforce punishment based on scan result and guild escalation matrix
   */
  public async handleViolation(
    message: Message,
    result: ScanResult,
    settings: GuildSecuritySettings
  ): Promise<void> {
    const guild = message.guild;
    const member = message.member;
    if (!guild || !member) return;

    // 1. Delete offending message immediately if possible
    try {
      if (message.deletable) {
        await message.delete();
      }
    } catch {
      // Message may already have been deleted or missing permission
    }

    // 2. Critical threat instant actions (e.g. Nitro scams / Malicious executables)
    if (result.severity === 'CRITICAL' && (result.threatType === 'PHISHING_NITRO' || result.threatType === 'DANGEROUS_FILE_EXTENSION')) {
      // Critical malware/phishing distributor: ban or 24h timeout immediately
      await this.enforceCriticalThreat(member, result, settings);
      return;
    }

    // 3. Token leak: Scrub + Inform user in DM without issuing harsh punishment
    if (result.threatType === 'DISCORD_TOKEN_LEAK') {
      await this.handleTokenLeak(member, message);
      return;
    }

    // 4. Record strike and escalate
    const infractions = db.getUserInfractions(guild.id, member.id);
    const strikeCount = infractions.length + 1;

    db.addInfraction({
      guildId: guild.id,
      userId: member.id,
      moderatorId: guild.client.user!.id,
      type: 'auto_strike',
      reason: result.reason || 'Automated security policy breach',
    });

    db.logIncident({
      guildId: guild.id,
      userId: member.id,
      userTag: member.user.tag,
      type: (result.threatType as any) || 'SPAM',
      severity: result.severity || 'LOW',
      details: result.reason || 'Security trigger',
      channelId: message.channel.id,
      messageId: message.id,
      actionTaken: `Strike #${strikeCount}`,
    });

    // 5. Execute action according to strike count
    let actionTaken = `Strike #${strikeCount} (Warning)`;

    try {
      if (strikeCount === 1) {
        actionTaken = `Strike #1: Warning issued`;
        await this.sendUserDm(
          member,
          `⚠️ **Warning from ${guild.name}**\nYour message was removed because it violated security rules: **${result.reason}**.\nPlease adhere to server rules to avoid timeouts or bans.`
        );
      } else if (strikeCount === 2) {
        const durationMs = 10 * 60 * 1000; // 10 minutes
        if (member.moderatable) {
          await member.timeout(durationMs, `Automated: Strike #2 - ${result.reason}`);
          actionTaken = `Strike #2: 10-Minute Timeout applied`;
        }
        await this.sendUserDm(
          member,
          `🔇 **Timed out in ${guild.name}**\nYou have been placed in timeout for 10 minutes (Strike 2) due to: **${result.reason}**.`
        );
      } else if (strikeCount === 3) {
        const durationMs = 60 * 60 * 1000; // 1 hour
        if (member.moderatable) {
          await member.timeout(durationMs, `Automated: Strike #3 - ${result.reason}`);
          actionTaken = `Strike #3: 1-Hour Timeout applied`;
        }
        await this.sendUserDm(
          member,
          `🔇 **Timed out in ${guild.name}**\nYou have been placed in timeout for 1 hour (Strike 3) due to: **${result.reason}**.`
        );
      } else if (strikeCount === 4) {
        const durationMs = 24 * 60 * 60 * 1000; // 24 hours
        if (member.moderatable) {
          await member.timeout(durationMs, `Automated: Strike #4 - ${result.reason}`);
          actionTaken = `Strike #4: 24-Hour Timeout applied`;
        }
        await this.sendUserDm(
          member,
          `🔇 **Timed out in ${guild.name}**\nYou have been placed in timeout for 24 hours (Strike 4) due to: **${result.reason}**.`
        );
      } else if (strikeCount >= 5) {
        if (settings.strikeEscalation.strike5Action === 'ban' && member.bannable) {
          await member.ban({ reason: `Automated: Strike #5 reached - ${result.reason}` });
          actionTaken = `Strike #${strikeCount}: Banned from server`;
        } else if (member.kickable) {
          await member.kick(`Automated: Strike #5 reached - ${result.reason}`);
          actionTaken = `Strike #${strikeCount}: Kicked from server`;
        }
      }
    } catch (err) {
      console.error(`[ModerationService] Failed to apply punishment on member ${member.id}:`, err);
    }

    // 6. Dispatch mod log
    await loggerService.logThreat({
      guild,
      user: member.user,
      channelName: 'name' in message.channel ? (message.channel.name as string) : 'direct-message',
      threatType: result.threatType || 'SECURITY_POLICY',
      severity: result.severity || 'LOW',
      reason: result.reason || 'Automated policy breach',
      actionTaken,
      details: `Original content: ${message.content.substring(0, 500) || '[No text content]'}`,
      originalMessageId: message.id,
    });
  }

  /**
   * Critical threat response: instant ban / 24h timeout
   */
  private async enforceCriticalThreat(
    member: GuildMember,
    result: ScanResult,
    settings: GuildSecuritySettings
  ): Promise<void> {
    const guild = member.guild;
    let actionTaken = 'Message Deleted';

    try {
      if (member.bannable) {
        await member.ban({
          deleteMessageSeconds: 86400,
          reason: `CRITICAL THREAT: ${result.reason}`,
        });
        actionTaken = 'Permanently Banned & Messages Purged (Critical Security Threat)';
      } else if (member.moderatable) {
        await member.timeout(24 * 60 * 60 * 1000, `CRITICAL THREAT: ${result.reason}`);
        actionTaken = '24-Hour Timeout (Critical Security Threat)';
      }

      await this.sendUserDm(
        member,
        `🚨 **Critical Security Notice from ${guild.name}**\nYour account posted confirmed malicious content or phishing links (**${result.reason}**).\nIf your account was compromised, please immediately change your Discord password, enable 2FA, and check authorized applications.`
      );
    } catch (err) {
      console.error(`[ModerationService] Error enforcing critical threat on ${member.id}:`, err);
    }

    await loggerService.logThreat({
      guild,
      user: member.user,
      channelName: 'mod-security',
      threatType: result.threatType || 'MALWARE',
      severity: 'CRITICAL',
      reason: result.reason || 'Malware or Phishing link distributed',
      actionTaken,
      details: `Target was flagged for distributing severe threats: ${result.matchedPattern || ''}`,
    });
  }

  /**
   * Discord token leak response
   */
  private async handleTokenLeak(member: GuildMember, message: Message): Promise<void> {
    await this.sendUserDm(
      member,
      `🚨 **URGENT SECURITY ALERT** 🚨\nYou just posted a valid Discord token in **${member.guild.name}**!\nYour token was immediately deleted to protect you.\n\n⚠️ **Action Required Immediately**: Change your Discord password right now to invalidate this token and protect your account from being hijacked!`
    );

    await loggerService.logThreat({
      guild: member.guild,
      user: member.user,
      channelName: 'name' in message.channel ? (message.channel.name as string) : 'direct-message',
      threatType: 'DISCORD_TOKEN_LEAK',
      severity: 'CRITICAL',
      reason: 'User leaked Discord authorization token into channel',
      actionTaken: 'Message immediately deleted & User alerted in DM',
      details: 'Token was deleted to protect account integrity.',
    });
  }

  /**
   * Helper to safely DM user without crashing if DMs are closed
   */
  public async sendUserDm(member: GuildMember, content: string): Promise<boolean> {
    try {
      const dm = await member.createDM();
      await dm.send(content);
      return true;
    } catch {
      return false; // User has DMs disabled
    }
  }

  /**
   * Check if a member has bypass permissions (Admin or Owner)
   */
  public isMemberBypassed(member: GuildMember, settings: GuildSecuritySettings): boolean {
    if (member.id === member.guild.ownerId) return true;
    if (member.permissions.has(PermissionsBitField.Flags.Administrator)) return true;

    // Check custom bypass roles
    const hasBypassRole = member.roles.cache.some((role) =>
      settings.whitelistedRoleIds.includes(role.id)
    );
    return hasBypassRole;
  }
}

export const moderationService = new ModerationService();
