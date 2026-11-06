import { config } from 'dotenv';
import { z } from 'zod';
import path from 'node:path';

// Load environment variables
config();

const envSchema = z.object({
  DISCORD_TOKEN: z.string().min(1, 'DISCORD_TOKEN is required'),
  CLIENT_ID: z.string().min(1, 'CLIENT_ID is required'),
  DEFAULT_PREFIX: z.string().default('!'),
  ENVIRONMENT: z.enum(['development', 'production', 'test']).default('development'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  DATA_DIR: z.string().default(path.resolve(process.cwd(), 'data')),
});

export type EnvConfig = z.infer<typeof envSchema>;

let parsedEnv: EnvConfig;

try {
  parsedEnv = envSchema.parse({
    DISCORD_TOKEN: process.env.DISCORD_TOKEN,
    CLIENT_ID: process.env.CLIENT_ID,
    DEFAULT_PREFIX: process.env.DEFAULT_PREFIX,
    ENVIRONMENT: process.env.ENVIRONMENT,
    LOG_LEVEL: process.env.LOG_LEVEL,
    DATA_DIR: process.env.DATA_DIR,
  });
} catch (error) {
  if (error instanceof z.ZodError) {
    const issues = (error as any).issues || (error as any).errors || [];
    const missing = issues.map((e: any) => `${e.path?.join('.')}: ${e.message}`).join(', ');
    console.warn(`[Config Warning] Missing or invalid environment variables: ${missing}`);
    // Provide fallback during dev / command compilation
    parsedEnv = {
      DISCORD_TOKEN: process.env.DISCORD_TOKEN || 'MISSING_TOKEN',
      CLIENT_ID: process.env.CLIENT_ID || 'MISSING_CLIENT_ID',
      DEFAULT_PREFIX: '!',
      ENVIRONMENT: 'development',
      LOG_LEVEL: 'info',
      DATA_DIR: path.resolve(process.cwd(), 'data'),
    };
  } else {
    throw error;
  }
}

export const env = parsedEnv;
