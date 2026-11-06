import { createDiscordClient } from './client.js';
import { env } from './config/env.js';

async function bootstrap() {
  console.log('----------------------------------------------------');
  console.log('🚀 Initializing Server Mothalali Discord Bot...');
  console.log('----------------------------------------------------');

  if (!env.DISCORD_TOKEN || env.DISCORD_TOKEN === 'MISSING_TOKEN') {
    console.error('❌ DISCORD_TOKEN is missing! Please configure .env file.');
    console.error('See .env.example for guidance.');
    process.exit(1);
  }

  const client = createDiscordClient();

  // Graceful shutdown handling
  const shutdown = async (signal: string) => {
    console.log(`\n[Server Mothalali] Received ${signal}. Shutting down gracefully...`);
    client.destroy();
    process.exit(0);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  try {
    await client.login(env.DISCORD_TOKEN);
  } catch (error) {
    console.error('❌ Failed to login to Discord:', error);
    process.exit(1);
  }
}

bootstrap();
