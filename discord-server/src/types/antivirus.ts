export type ThreatType =
  | 'MALICIOUS_URL'
  | 'PHISHING_NITRO'
  | 'PHISHING_STEAM'
  | 'IP_LOGGER'
  | 'DISCORD_TOKEN_LEAK'
  | 'WEBHOOK_EXPOSURE'
  | 'DANGEROUS_FILE_EXTENSION'
  | 'DOUBLE_EXTENSION'
  | 'SUSPICIOUS_ARCHIVE'
  | 'SPAM_FLOOD'
  | 'SPAM_DUPLICATE'
  | 'SPAM_MENTIONS'
  | 'SPAM_EMOJI'
  | 'SPAM_CAPS'
  | 'ZALGO_TEXT'
  | 'UNAUTHORIZED_INVITE'
  | 'RAID_VELOCITY'
  | 'UNDERAGE_ACCOUNT';

export type ThreatSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface ScanResult {
  isSafe: boolean;
  threatType?: ThreatType;
  severity?: ThreatSeverity;
  reason?: string;
  matchedPattern?: string;
  sanitizedContent?: string;
  metadata?: Record<string, unknown>;
}
