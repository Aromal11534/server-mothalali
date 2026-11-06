import { Client, ActivityType } from 'discord.js';
import { antiSpamService } from '../services/antispam.service.js';

export function handleReady(client: Client): void {
  console.log(`[Server Mothalali] Logged in successfully as ${client.user?.tag} (ID: ${client.user?.id})`);

  const updatePresence = () => {
    const guildCount = client.guilds.cache.size;
    client.user?.setPresence({
      status: 'online',
      activities: [
        {
          name: `🛡️ Protecting ${guildCount} Server${guildCount === 1 ? '' : 's'} | /status`,
          type: ActivityType.Custom,
        },
      ],
    });
  };

  updatePresence();
  setInterval(updatePresence, 5 * 60 * 1000); // Update every 5 minutes

  // Periodic cleanup of anti-spam caches every 10 minutes
  setInterval(() => {
    antiSpamService.cleanup();
  }, 10 * 60 * 1000);
}
