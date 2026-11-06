/**
 * Core Security Patterns & Signatures for Server Mothalali Antivirus
 */

// Discord Tokens (User or Bot token leaked into chat)
export const DISCORD_TOKEN_REGEX =
  /(?:mfa\.[a-zA-Z0-9_-]{20,}|[a-zA-Z0-9_-]{24,28}\.[a-zA-Z0-9_-]{6}\.[a-zA-Z0-9_-]{27,38})/g;

// Discord Webhook URLs (often abused or leaked)
export const DISCORD_WEBHOOK_REGEX =
  /https?:\/\/(?:ptb\.|canary\.)?discord(?:app)?\.com\/api\/webhooks\/\d{17,20}\/[A-Za-z0-9_-]{60,}/gi;

// Discord Invite links
export const DISCORD_INVITE_REGEX =
  /(?:https?:\/\/)?(?:www\.)?(?:discord\.(?:gg|io|me|li)|discord(?:app)?\.com\/invite)\/([a-zA-Z0-9\-]{2,32})/gi;

// Known IP Loggers and Tracker Domains
export const IP_LOGGER_DOMAINS = [
  'grabify.link',
  'iplogger.org',
  'iplogger.com',
  'iplogger.ru',
  '2no.co',
  'yip.su',
  'iplis.ru',
  'headshot.icu',
  'blasze.tk',
  'linkdrop.ru',
  'bvog.com',
  'youramonkey.com',
  'pronos.online',
  'spying.me',
  'trackip.net',
  'location.mobi',
];

// Phishing keywords and typosquats for Discord Nitro, Steam, and Crypto scams
export const PHISHING_KEYWORDS = [
  'discorcl',
  'dlscord',
  'discorde',
  'discord-nitro',
  'nitro-gift',
  'free-nitro',
  'discord-drop',
  'discordgift',
  'nitro-drop',
  'claim-nitro',
  'discord-airdrop',
  'steamcommunilty',
  'steamcommuniity',
  'steamcommunyt',
  'tradeoffer-steam',
  'steam-community-gifts',
  'free-steam-nitro',
  'roblx-gift',
];

// High-Risk Executable and Script Extensions
export const DANGEROUS_EXTENSIONS = new Set([
  '.exe',
  '.scr',
  '.bat',
  '.cmd',
  '.vbs',
  '.vbe',
  '.js',
  '.jse',
  '.wsf',
  '.wsh',
  '.ps1',
  '.ps1xml',
  '.com',
  '.pif',
  '.msi',
  '.reg',
  '.hta',
  '.cpl',
  '.jar',
  '.iso',
  '.img',
  '.dmg',
  '.apk',
]);

// Suspicious archive filename keywords
export const SUSPICIOUS_ARCHIVE_KEYWORDS = [
  'crack',
  'hack',
  'cheat',
  'token',
  'grabber',
  'stealer',
  'keygen',
  'free_nitro',
  'spoofer',
  'injector',
  'aimbot',
];

// Zalgo / Excessive Combining Character regex
export const ZALGO_CHAR_REGEX = /[\u0300-\u036F\u1DC0-\u1DFF\u20D0-\u20FF\uFE20-\uFE2F]/g;

// Emoji extraction regex (Unicode standard emojis + Discord custom emojis)
export const EMOJI_REGEX = /(?:<a?:[a-zA-Z0-9_]+:\d+>|[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}])/gu;

// Extract URLs from text
export const URL_REGEX =
  /https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,8}\b(?:[-a-zA-Z0-9()@:%_+.~#?&/=]*)/gi;
