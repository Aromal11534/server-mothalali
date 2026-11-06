import { REST, Routes } from 'discord.js';
import { env } from '../config/env.js';
import { commands } from '../commands/index.js';

async function deploy() {
  if (!env.DISCORD_TOKEN || env.DISCORD_TOKEN === 'MISSING_TOKEN') {
    console.error('❌ DISCORD_TOKEN is not configured in .env');
    process.exit(1);
  }

  if (!env.CLIENT_ID || env.CLIENT_ID === 'MISSING_CLIENT_ID') {
    console.error('❌ CLIENT_ID is not configured in .env');
    process.exit(1);
  }

  const rest = new REST({ version: '10' }).setToken(env.DISCORD_TOKEN);
  const commandData = commands.map((cmd) => cmd.data.toJSON());

  console.log(`[Deploy] Started refreshing ${commandData.length} application (/) commands...`);

  try {
    const data = (await rest.put(Routes.applicationCommands(env.CLIENT_ID), {
      body: commandData,
    })) as unknown[];

    console.log(`✅ Successfully reloaded ${data.length} application (/) commands globally.`);
  } catch (error) {
    console.error('❌ Error deploying application commands:', error);
    process.exit(1);
  }
}

deploy();
