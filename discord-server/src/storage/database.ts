import fs from 'node:fs';
import path from 'node:path';
import { env } from '../config/env.js';
import { GuildSecuritySettings, Infraction, IncidentLog } from '../types/guild.js';
import { DEFAULT_GUILD_SETTINGS } from '../config/defaults.js';

interface DatabaseSchema {
  guilds: Record<string, GuildSecuritySettings>;
  infractions: Infraction[];
  incidents: IncidentLog[];
  stats: {
    messagesScanned: number;
    threatsBlocked: number;
    filesScanned: number;
    actionsTaken: number;
    startedAt: number;
  };
}

export class Database {
  private static instance: Database;
  private filePath: string;
  private data: DatabaseSchema;
  private writePending = false;

  private constructor() {
    const dataDir = env.DATA_DIR;
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    this.filePath = path.join(dataDir, 'server_mothalali.json');
    this.data = this.load();
  }

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  private load(): DatabaseSchema {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        const parsed = JSON.parse(raw);
        return {
          guilds: parsed.guilds || {},
          infractions: parsed.infractions || [],
          incidents: parsed.incidents || [],
          stats: parsed.stats || {
            messagesScanned: 0,
            threatsBlocked: 0,
            filesScanned: 0,
            actionsTaken: 0,
            startedAt: Date.now(),
          },
        };
      }
    } catch (err) {
      console.error('[Database] Failed to read database file, initializing fresh store:', err);
    }

    return {
      guilds: {},
      infractions: [],
      incidents: [],
      stats: {
        messagesScanned: 0,
        threatsBlocked: 0,
        filesScanned: 0,
        actionsTaken: 0,
        startedAt: Date.now(),
      },
    };
  }

  public save(): void {
    if (this.writePending) return;
    this.writePending = true;

    setImmediate(() => {
      try {
        const tempPath = `${this.filePath}.tmp`;
        fs.writeFileSync(tempPath, JSON.stringify(this.data, null, 2), 'utf-8');
        fs.renameSync(tempPath, this.filePath);
      } catch (err) {
        console.error('[Database] Error saving database:', err);
      } finally {
        this.writePending = false;
      }
    });
  }

  // Guild Settings
  public getGuildSettings(guildId: string): GuildSecuritySettings {
    if (!this.data.guilds[guildId]) {
      this.data.guilds[guildId] = {
        guildId,
        ...DEFAULT_GUILD_SETTINGS,
      };
      this.save();
    }
    return this.data.guilds[guildId];
  }

  public updateGuildSettings(guildId: string, updates: Partial<GuildSecuritySettings>): GuildSecuritySettings {
    const current = this.getGuildSettings(guildId);
    this.data.guilds[guildId] = {
      ...current,
      ...updates,
      updatedAt: Date.now(),
    };
    this.save();
    return this.data.guilds[guildId];
  }

  // Infractions / Warnings
  public addInfraction(infraction: Omit<Infraction, 'id' | 'timestamp' | 'active'>): Infraction {
    const newInfraction: Infraction = {
      ...infraction,
      id: `inf_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: Date.now(),
      active: true,
    };
    this.data.infractions.push(newInfraction);
    this.data.stats.actionsTaken++;
    this.save();
    return newInfraction;
  }

  public getUserInfractions(guildId: string, userId: string): Infraction[] {
    return this.data.infractions.filter((inf) => inf.guildId === guildId && inf.userId === userId && inf.active);
  }

  public clearUserInfractions(guildId: string, userId: string): number {
    let cleared = 0;
    for (const inf of this.data.infractions) {
      if (inf.guildId === guildId && inf.userId === userId && inf.active) {
        inf.active = false;
        cleared++;
      }
    }
    if (cleared > 0) this.save();
    return cleared;
  }

  // Incident Logging
  public logIncident(incident: Omit<IncidentLog, 'id' | 'timestamp'>): IncidentLog {
    const newIncident: IncidentLog = {
      ...incident,
      id: `inc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: Date.now(),
    };
    this.data.incidents.push(newIncident);
    this.data.stats.threatsBlocked++;
    this.save();
    return newIncident;
  }

  public getRecentIncidents(guildId: string, limit = 10): IncidentLog[] {
    return this.data.incidents
      .filter((inc) => inc.guildId === guildId)
      .slice(-limit)
      .reverse();
  }

  // Global Stats
  public incrementScannedMessages(count = 1): void {
    this.data.stats.messagesScanned += count;
  }

  public incrementScannedFiles(count = 1): void {
    this.data.stats.filesScanned += count;
  }

  public getStats() {
    return { ...this.data.stats };
  }
}

export const db = Database.getInstance();
