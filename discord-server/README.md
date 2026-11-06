# 🛡️ Server Mothalali - Discord Security & Moderation Bot

**Server Mothalali** is an enterprise-grade Discord server management bot running with Administrator privileges. It functions as an **antivirus, anti-spam, malware shield, and automated moderation system** designed to protect your server from modern threats, raids, token grabbers, and phishing scams.

---

## ⚡ Core Security Capabilities

### 1. 🦠 Antivirus & Malware Defense
- **Phishing Protection:** Real-time scanning for Nitro scams, Steam gift scams, fake login portals, and homoglyph domain attacks.
- **File Attachment Inspector:** Automatically blocks dangerous executables and scripts (`.exe`, `.scr`, `.bat`, `.cmd`, `.vbs`, `.ps1`, `.msi`, `.reg`, etc.).
- **Double Extension Defense:** Detects disguised malware such as `invoice.pdf.exe` or `image.png.scr`.
- **IP Logger & Tracker Blocker:** Eliminates Grabify, IPLogger, and known tracking links.
- **Token Grabber & Leak Protection:** Detects exposed Discord authorization tokens in chat, immediately deletes the message, alerts the user in DMs to reset their password, and posts a redacted alert.
- **Webhook Abuse Filter:** Identifies and blocks unauthorized Discord webhook links.

### 2. 🚫 Anti-Spam & Abuse Control
- **Rapid Message Flood:** Sliding-window rate limiter preventing message flooding.
- **Duplicate Message Suppression:** Detects and removes repeated identical messages.
- **Mass Mention Abuse:** Detects and halts mass `@everyone`, `@here`, or excessive user/role pinging.
- **Emoji Flood:** Enforces configurable limits on emojis per message.
- **Excessive CAPS Filter:** Automatically flags and filters shout messages (>70% uppercase).
- **Zalgo / Glitch Text Detector:** Strips corrupted zalgo text and unicode glitch spam.
- **Unauthorized Discord Invites:** Restricts discord invite links to prevent unauthorized server advertising.

### 3. 🚨 Anti-Raid Defense & Verification Gate
- **Join Velocity Monitor:** Flags sudden influxes of accounts (e.g. 8+ joins in 10 seconds) and triggers emergency defense.
- **Account Age Verification:** Restricts or quarantines accounts created within the last 24 hours (configurable).
- **Automated Server Lockdown:** Capability to instantly lock down text channels during an active raid.
- **Quarantine Role System:** Automatically places suspicious accounts into an isolated quarantine role.

### 4. 🔨 Escalating Moderation & Strike System
Automated strike escalation matrix:
- **Strike 1:** Warning + Message Deletion + User DM Notice
- **Strike 2:** 10-Minute Timeout
- **Strike 3:** 1-Hour Timeout
- **Strike 4:** 24-Hour Timeout
- **Strike 5:** Automated Kick or Ban (configurable)
- **Instant Ban:** Triggered immediately for critical malware or phishing distribution.

### 5. 📡 Audit Logging & Interactive Action Buttons
- Dedicated **Mod Log** and **Security Alerts** channels.
- Rich embeds featuring threat category, offender info, severity rating, and original content.
- Interactive Discord buttons on security embeds (`[Pardon User]` / `[Ban User]`) allowing moderators to act immediately.

---

## 💻 Slash Commands (`/`)

| Command | Permissions | Description |
| :--- | :--- | :--- |
| `/status` | Everyone | View active security shields, uptime, and scan telemetry |
| `/antivirus status` | Admin | Check status of all antivirus shields |
| `/antivirus toggle` | Admin | Enable/disable specific shields (links, files, webhooks, invites) |
| `/antiraid status` | Admin | View current raid defense settings |
| `/antiraid toggle` | Admin | Toggle anti-raid defense |
| `/antiraid threshold`| Admin | Set join velocity thresholds |
| `/antiraid min_age` | Admin | Set minimum required account age in hours |
| `/scan url` | Mod | Deep scan a URL for phishing, homoglyphs, or IP loggers |
| `/scan member` | Mod | Inspect member account age, infraction history, and risk rating |
| `/scan channel` | Mod | Sweep the recent messages in a channel for hidden threats |
| `/warn` | Mod | Issue a formal strike to a user |
| `/warnings` | Mod | View strike history for a user |
| `/clearwarnings` | Mod | Pardon a user and reset active strikes |
| `/timeout` | Mod | Temporarily mute/timeout a member (e.g. `10m`, `1h`, `2d`) |
| `/untimeout` | Mod | Lift a timeout from a member |
| `/kick` | Kick Members | Kick a member from the server |
| `/ban` | Ban Members | Permanently ban a member and optionally purge message history |
| `/unban` | Ban Members | Lift a ban using a User ID |
| `/purge` | Manage Msgs | Bulk delete messages with filters (all, bots, links, attachments, user) |
| `/lockdown` | Manage Chans | Lock down a channel or prevent `@everyone` from sending messages |
| `/unlock` | Manage Chans | Restore messaging permissions |
| `/settings view` | Admin | View complete server security configuration |
| `/settings modlog` | Admin | Set general moderation log channel |
| `/settings alerts` | Admin | Set high-priority security alerts channel |
| `/settings quarantine_role` | Admin | Set the quarantine role for raid defense |

---

## 🚀 Setup & Installation

### 1. Prerequisites
- [Node.js](https://nodejs.org/) v18+ (tested on Node v24)
- A Discord Bot Application from [Discord Developer Portal](https://discord.com/developers/applications)

### 2. Discord Bot Permissions & Privileged Intents
In the Discord Developer Portal:
1. Enable **Privileged Gateway Intents**:
   - `MESSAGE CONTENT INTENT` (Required for scanning messages & attachments)
   - `SERVER MEMBERS INTENT` (Required for anti-raid & account age checks)
2. Generate an OAuth2 Invite URL with `bot` and `applications.commands` scopes and **Administrator** permission.

### 3. Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Set your credentials in `.env`:
```env
DISCORD_TOKEN=your_bot_token_here
CLIENT_ID=your_client_id_here
```

### 4. Install Dependencies & Build
```bash
npm install
npm run build
```

### 5. Register Slash Commands
Register commands globally with Discord's REST API:
```bash
npm run register
```

### 6. Start the Bot
```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```
