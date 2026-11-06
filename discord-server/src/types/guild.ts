export interface GuildSecuritySettings {
  guildId: string;
  antivirusEnabled: boolean;
  scanAttachments: boolean;
  blockMaliciousUrls: boolean;
  blockIpLoggers: boolean;
  blockTokenGrabbers: boolean;
  blockDiscordInvites: boolean;
  allowedInviteGuilds: string[]; // Guild IDs or invite codes allowed
  
  // Anti-Spam
  antiSpamEnabled: boolean;
  maxMessagesPerWindow: number; // e.g. 5 messages
  windowSeconds: number; // e.g. 4 seconds
  duplicateMessageThreshold: number; // e.g. 3 duplicate messages
  maxMentions: number; // e.g. 5 mentions
  maxEmojis: number; // e.g. 8 emojis
  maxCapsPercent: number; // e.g. 70 percent
  blockZalgo: boolean;

  // Anti-Raid
  antiRaidEnabled: boolean;
  joinVelocityThreshold: number; // e.g. 8 joins
  joinVelocitySeconds: number; // e.g. 10 seconds
  minAccountAgeHours: number; // e.g. 24 hours (0 = disabled)
  raidAction: 'quarantine' | 'kick' | 'lockdown';
  quarantineRoleId: string | null;

  // Auto Moderation & Enforcement
  autoModEnabled: boolean;
  strikeEscalation: {
    strike1Action: 'warn';
    strike2Action: 'timeout_10m';
    strike3Action: 'timeout_1h';
    strike4Action: 'timeout_24h';
    strike5Action: 'kick' | 'ban';
  };

  // Channels & Roles
  modLogChannelId: string | null;
  securityAlertsChannelId: string | null;
  adminRoleIds: string[];
  modRoleIds: string[];
  whitelistedChannelIds: string[];
  whitelistedRoleIds: string[];

  updatedAt: number;
}

export interface Infraction {
  id: string;
  guildId: string;
  userId: string;
  moderatorId: string;
  type: 'warn' | 'timeout' | 'kick' | 'ban' | 'auto_strike';
  reason: string;
  timestamp: number;
  durationMs?: number;
  active: boolean;
}

export interface IncidentLog {
  id: string;
  guildId: string;
  userId: string;
  userTag: string;
  type: 'MALWARE' | 'PHISHING' | 'TOKEN_LEAK' | 'IP_LOGGER' | 'SPAM' | 'MASS_MENTION' | 'RAID' | 'INVITE';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  details: string;
  channelId?: string;
  messageId?: string;
  actionTaken: string;
  timestamp: number;
}
