import { GuildMember } from 'discord.js';
import { db } from '../storage/database.js';
import { antiRaidService } from '../services/antiraid.service.js';
import { loggerService } from '../services/logger.service.js';
import { moderationService } from '../services/moderation.service.js';

export async function handleGuildMemberAdd(member: GuildMember): Promise<void> {
  const guild = member.guild;
  const settings = db.getGuildSettings(guild.id);

  if (!settings.antiRaidEnabled) return;

  const raidResult = antiRaidService.evaluateJoin(member, settings);

  if (!raidResult.isSafe) {
    let actionTaken = 'Monitored';

    try {
      // If raid velocity breached, optionally trigger server lockdown or quarantine
      if (raidResult.threatType === 'RAID_VELOCITY') {
        if (settings.raidAction === 'lockdown') {
          const lockedChannels = await antiRaidService.executeServerLockdown(
            member,
            'Automated Anti-Raid Triggered'
          );
          actionTaken = `Emergency Lockdown Engaged (${lockedChannels} channels locked)`;
        } else if (settings.raidAction === 'quarantine' && settings.quarantineRoleId) {
          await member.roles.add(settings.quarantineRoleId, 'Automated Anti-Raid Quarantine');
          actionTaken = 'Quarantined (Quarantine Role Assigned)';
        } else if (settings.raidAction === 'kick' && member.kickable) {
          await member.kick('Automated: Raid Velocity Exceeded');
          actionTaken = 'Auto-Kicked (Anti-Raid)';
        }
      } else if (raidResult.threatType === 'UNDERAGE_ACCOUNT') {
        if (settings.quarantineRoleId) {
          await member.roles.add(settings.quarantineRoleId, 'New Account Age Gate');
          actionTaken = 'Quarantined (New Account Gate)';
          await moderationService.sendUserDm(
            member,
            `🛡️ You have been quarantined in **${guild.name}** because your account was created less than ${settings.minAccountAgeHours} hours ago. Please wait for an administrator to review.`
          );
        } else if (member.kickable) {
          await moderationService.sendUserDm(
            member,
            `🛡️ You were kicked from **${guild.name}** because your account was created less than ${settings.minAccountAgeHours} hours ago.`
          );
          await member.kick('Underage Account Gate');
          actionTaken = 'Auto-Kicked (Underage Account)';
        }
      }
    } catch (err) {
      console.error(`[AntiRaid] Error executing action on joining member ${member.id}:`, err);
    }

    await loggerService.logThreat({
      guild,
      user: member.user,
      channelName: 'guild-joins',
      threatType: raidResult.threatType || 'RAID_VELOCITY',
      severity: raidResult.severity || 'HIGH',
      reason: raidResult.reason || 'Raid threshold breached',
      actionTaken,
      details: `Account created: <t:${Math.floor(member.user.createdAt.getTime() / 1000)}:R>`,
    });
  }
}
