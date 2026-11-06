import { GuildMember, PermissionsBitField, TextChannel } from 'discord.js';
import { GuildSecuritySettings } from '../types/guild.js';
import { ScanResult } from '../types/antivirus.js';

interface RaidTracker {
  recentJoins: number[];
  isUnderRaid: boolean;
  raidTriggeredAt: number;
}

export class AntiRaidService {
  private guildRaidTrackers = new Map<string, RaidTracker>();

  private getTracker(guildId: string): RaidTracker {
    let tracker = this.guildRaidTrackers.get(guildId);
    if (!tracker) {
      tracker = { recentJoins: [], isUnderRaid: false, raidTriggeredAt: 0 };
      this.guildRaidTrackers.set(guildId, tracker);
    }
    return tracker;
  }

  /**
   * Evaluates a newly joined guild member for raid velocity and account age
   */
  public evaluateJoin(member: GuildMember, settings: GuildSecuritySettings): ScanResult {
    if (!settings.antiRaidEnabled) {
      return { isSafe: true };
    }

    const now = Date.now();
    const tracker = this.getTracker(member.guild.id);
    const windowMs = settings.joinVelocitySeconds * 1000;

    // Filter old joins
    tracker.recentJoins = tracker.recentJoins.filter((t) => now - t <= windowMs);
    tracker.recentJoins.push(now);

    // 1. Check Raid Velocity
    if (tracker.recentJoins.length >= settings.joinVelocityThreshold) {
      tracker.isUnderRaid = true;
      tracker.raidTriggeredAt = now;

      return {
        isSafe: false,
        threatType: 'RAID_VELOCITY',
        severity: 'CRITICAL',
        reason: `High member join velocity detected: ${tracker.recentJoins.length} joins in ${settings.joinVelocitySeconds}s!`,
        matchedPattern: `Raid Spike: ${tracker.recentJoins.length} joins`,
      };
    }

    // Reset raid mode if 60 seconds of quiet have passed
    if (tracker.isUnderRaid && now - tracker.raidTriggeredAt > 60000) {
      tracker.isUnderRaid = false;
    }

    // 2. Check Account Age
    if (settings.minAccountAgeHours > 0) {
      const accountCreated = member.user.createdAt.getTime();
      const accountAgeHours = (now - accountCreated) / (1000 * 60 * 60);

      if (accountAgeHours < settings.minAccountAgeHours) {
        return {
          isSafe: false,
          threatType: 'UNDERAGE_ACCOUNT',
          severity: tracker.isUnderRaid ? 'HIGH' : 'MEDIUM',
          reason: `Account age (${accountAgeHours.toFixed(1)} hrs) is below the minimum required ${settings.minAccountAgeHours} hrs.`,
          matchedPattern: `Age: ${accountAgeHours.toFixed(1)}h`,
        };
      }
    }

    return { isSafe: true };
  }

  /**
   * Applies automated server lockdown on all text channels
   */
  public async executeServerLockdown(member: GuildMember, reason: string): Promise<number> {
    let lockedCount = 0;
    const channels = await member.guild.channels.fetch();

    for (const [, channel] of channels) {
      if (channel && channel.isTextBased() && 'permissionOverwrites' in channel) {
        try {
          const textChannel = channel as TextChannel;
          await textChannel.permissionOverwrites.edit(member.guild.roles.everyone, {
            SendMessages: false,
            AddReactions: false,
          }, { reason });
          lockedCount++;
        } catch {
          // Skip channels without permission
        }
      }
    }

    return lockedCount;
  }

  public isGuildUnderRaid(guildId: string): boolean {
    const tracker = this.guildRaidTrackers.get(guildId);
    return tracker ? tracker.isUnderRaid : false;
  }
}

export const antiRaidService = new AntiRaidService();
