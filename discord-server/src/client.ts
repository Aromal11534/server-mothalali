import { Client, GatewayIntentBits, Partials } from 'discord.js';
import { handleReady } from './events/ready.js';
import { handleMessageCreate } from './events/messageCreate.js';
import { handleMessageUpdate } from './events/messageUpdate.js';
import { handleGuildMemberAdd } from './events/guildMemberAdd.js';
import { handleInteractionCreate } from './events/interactionCreate.js';

export function createDiscordClient(): Client {
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.GuildModeration,
      GatewayIntentBits.GuildMessageReactions,
    ],
    partials: [Partials.Message, Partials.Channel, Partials.Reaction, Partials.GuildMember],
  });

  // Attach Event Handlers
  client.once('ready', () => handleReady(client));
  client.on('messageCreate', (msg) => handleMessageCreate(msg));
  client.on('messageUpdate', (oldMsg, newMsg) => handleMessageUpdate(oldMsg, newMsg));
  client.on('guildMemberAdd', (member) => handleGuildMemberAdd(member));
  client.on('interactionCreate', (interaction) => handleInteractionCreate(interaction));

  return client;
}
