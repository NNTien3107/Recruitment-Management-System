import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().min(1),
  STORAGE_DIR: z.string().default('uploads'),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRES_IN_SECONDS: z.coerce.number().default(900), // 15 phút
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): Env {
  const result = envSchema.safeParse(config);
  if (!result.success) {
    const details = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    throw new Error(`Biáº¿n mÃ´i trÆ°á»ng khÃ´ng há»£p lá»‡: ${details}`);
  }
  return result.data;
}
