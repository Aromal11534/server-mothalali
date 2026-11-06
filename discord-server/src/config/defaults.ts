import { GuildSecuritySettings } from '../types/guild.js';

export const DEFAULT_GUILD_SETTINGS: Omit<GuildSecuritySettings, 'guildId'> = {
  antivirusEnabled: true,
  scanAttachments: true,
  blockMaliciousUrls: true,
  blockIpLoggers: true,
  blockTokenGrabbers: true,
  blockDiscordInvites: true,
  allowedInviteGuilds: [],

  antiSpamEnabled: true,
  maxMessagesPerWindow: 5,
  windowSeconds: 4,
  duplicateMessageThreshold: 3,
  maxMentions: 5,
  maxEmojis: 8,
  maxCapsPercent: 70,
  blockZalgo: true,

  antiRaidEnabled: true,
  joinVelocityThreshold: 8,
  joinVelocitySeconds: 10,
  minAccountAgeHours: 24,
  raidAction: 'quarantine',
  quarantineRoleId: null,

  autoModEnabled: true,
  strikeEscalation: {
    strike1Action: 'warn',
    strike2Action: 'timeout_10m',
    strike3Action: 'timeout_1h',
    strike4Action: 'timeout_24h',
    strike5Action: 'kick',
  },

  modLogChannelId: null,
  securityAlertsChannelId: null,
  adminRoleIds: [],
  modRoleIds: [],
  whitelistedChannelIds: [],
  whitelistedRoleIds: [],

  updatedAt: Date.now(),
};
