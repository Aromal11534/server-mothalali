import { Attachment, Message } from 'discord.js';
import { ScanResult } from '../types/antivirus.js';
import { GuildSecuritySettings } from '../types/guild.js';
import {
  DISCORD_TOKEN_REGEX,
  DISCORD_WEBHOOK_REGEX,
  IP_LOGGER_DOMAINS,
  PHISHING_KEYWORDS,
  DANGEROUS_EXTENSIONS,
  SUSPICIOUS_ARCHIVE_KEYWORDS,
  URL_REGEX,
} from '../utils/patterns.js';

export class AntivirusService {
  /**
   * Comprehensive scan of message content and attachments
   */
  public scanMessage(message: Message, settings: GuildSecuritySettings): ScanResult {
    const content = message.content || '';

    // 1. Critical: Discord Token Leak Detection
    const tokenResult = this.scanForDiscordTokens(content);
    if (!tokenResult.isSafe) return tokenResult;

    // 2. Webhook Exposure
    if (settings.blockTokenGrabbers) {
      const webhookResult = this.scanForWebhooks(content);
      if (!webhookResult.isSafe) return webhookResult;
    }

    // 3. URLs, Phishing & IP Loggers
    if (settings.blockMaliciousUrls || settings.blockIpLoggers) {
      const urlResult = this.scanUrls(content, settings);
      if (!urlResult.isSafe) return urlResult;
    }

    // 4. File Attachments
    if (settings.scanAttachments && message.attachments.size > 0) {
      for (const [, attachment] of message.attachments) {
        const fileResult = this.scanAttachment(attachment);
        if (!fileResult.isSafe) return fileResult;
      }
    }

    return { isSafe: true };
  }

  /**
   * Detects exposed Discord authentication tokens
   */
  public scanForDiscordTokens(text: string): ScanResult {
    const matches = text.match(DISCORD_TOKEN_REGEX);
    if (matches && matches.length > 0) {
      return {
        isSafe: false,
        threatType: 'DISCORD_TOKEN_LEAK',
        severity: 'CRITICAL',
        reason: 'Detected exposed Discord user/bot authorization token.',
        matchedPattern: 'DISCORD_AUTH_TOKEN',
        sanitizedContent: text.replace(DISCORD_TOKEN_REGEX, '[REDACTED_DISCORD_TOKEN]'),
      };
    }
    return { isSafe: true };
  }

  /**
   * Detects exposed Discord Webhook endpoints
   */
  public scanForWebhooks(text: string): ScanResult {
    const matches = text.match(DISCORD_WEBHOOK_REGEX);
    if (matches && matches.length > 0) {
      return {
        isSafe: false,
        threatType: 'WEBHOOK_EXPOSURE',
        severity: 'HIGH',
        reason: 'Unauthorized Discord Webhook URL exposed in chat.',
        matchedPattern: matches[0].substring(0, 45) + '...',
      };
    }
    return { isSafe: true };
  }

  /**
   * Scans all URLs in text for IP Loggers, Phishing and Typosquats
   */
  public scanUrls(text: string, settings: GuildSecuritySettings): ScanResult {
    const urls = text.match(URL_REGEX);
    if (!urls) return { isSafe: true };

    for (const urlStr of urls) {
      try {
        const parsed = new URL(urlStr);
        const hostname = parsed.hostname.toLowerCase();

        // Check for known IP loggers
        if (settings.blockIpLoggers) {
          const isIpLogger = IP_LOGGER_DOMAINS.some(
            (domain) => hostname === domain || hostname.endsWith(`.${domain}`)
          );
          if (isIpLogger) {
            return {
              isSafe: false,
              threatType: 'IP_LOGGER',
              severity: 'HIGH',
              reason: `Known IP logger tracker link detected: ${hostname}`,
              matchedPattern: hostname,
            };
          }
        }

        // Check for phishing keywords in domain / path
        if (settings.blockMaliciousUrls) {
          for (const keyword of PHISHING_KEYWORDS) {
            if (hostname.includes(keyword) || parsed.pathname.toLowerCase().includes(keyword)) {
              return {
                isSafe: false,
                threatType: 'PHISHING_NITRO',
                severity: 'CRITICAL',
                reason: `Phishing domain / fake Nitro link detected (${keyword})`,
                matchedPattern: hostname,
              };
            }
          }

          // Check for Homoglyph attack (lookalike unicode characters)
          if (/[^\u0000-\u007F]/.test(hostname)) {
            return {
              isSafe: false,
              threatType: 'MALICIOUS_URL',
              severity: 'HIGH',
              reason: `Suspicious domain containing non-ASCII homoglyphs: ${hostname}`,
              matchedPattern: hostname,
            };
          }
        }
      } catch {
        // Invalid URL syntax
        continue;
      }
    }

    return { isSafe: true };
  }

  /**
   * Scans a Discord file attachment for malware, dangerous extensions, and double extensions
   */
  public scanAttachment(attachment: Attachment): ScanResult {
    const filename = attachment.name.toLowerCase();

    // 1. Check double extension (e.g., photo.png.exe, invoice.pdf.vbs)
    const doubleExtMatch = filename.match(/\.([a-z0-9]{2,4})\.([a-z0-9]{2,4})$/i);
    if (doubleExtMatch) {
      const outerExt = `.${doubleExtMatch[2]}`;
      if (DANGEROUS_EXTENSIONS.has(outerExt)) {
        return {
          isSafe: false,
          threatType: 'DOUBLE_EXTENSION',
          severity: 'CRITICAL',
          reason: `Dangerous disguised double-extension executable file: ${attachment.name}`,
          matchedPattern: attachment.name,
        };
      }
    }

    // 2. Check dangerous extension
    for (const ext of DANGEROUS_EXTENSIONS) {
      if (filename.endsWith(ext)) {
        return {
          isSafe: false,
          threatType: 'DANGEROUS_FILE_EXTENSION',
          severity: 'CRITICAL',
          reason: `High-risk executable/script file blocked: ${ext}`,
          matchedPattern: attachment.name,
        };
      }
    }

    // 3. Check suspicious archive names
    if (filename.endsWith('.zip') || filename.endsWith('.rar') || filename.endsWith('.7z')) {
      for (const keyword of SUSPICIOUS_ARCHIVE_KEYWORDS) {
        if (filename.includes(keyword)) {
          return {
            isSafe: false,
            threatType: 'SUSPICIOUS_ARCHIVE',
            severity: 'HIGH',
            reason: `Suspicious archive containing risk keywords: "${keyword}"`,
            matchedPattern: attachment.name,
          };
        }
      }
    }

    return { isSafe: true };
  }
}

export const antivirusService = new AntivirusService();
