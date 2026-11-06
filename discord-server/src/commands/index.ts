import { Collection } from 'discord.js';
import { Command } from '../types/commands.js';
import { statusCommand } from './status.command.js';
import { antivirusCommand } from './antivirus.command.js';
import { antiRaidCommand } from './antiraid.command.js';
import { scanCommand } from './scan.command.js';
import { warnCommand } from './warn.command.js';
import { warningsCommand } from './warnings.command.js';
import { clearwarningsCommand } from './clearwarnings.command.js';
import { timeoutCommand } from './timeout.command.js';
import { untimeoutCommand } from './untimeout.command.js';
import { kickCommand } from './kick.command.js';
import { banCommand } from './ban.command.js';
import { unbanCommand } from './unban.command.js';
import { purgeCommand } from './purge.command.js';
import { lockdownCommand } from './lockdown.command.js';
import { unlockCommand } from './unlock.command.js';
import { settingsCommand } from './settings.command.js';

export const commands = [
  statusCommand,
  antivirusCommand,
  antiRaidCommand,
  scanCommand,
  warnCommand,
  warningsCommand,
  clearwarningsCommand,
  timeoutCommand,
  untimeoutCommand,
  kickCommand,
  banCommand,
  unbanCommand,
  purgeCommand,
  lockdownCommand,
  unlockCommand,
  settingsCommand,
];

export const commandCollection = new Collection<string, Command>();

for (const command of commands) {
  commandCollection.set(command.data.name, command);
}
