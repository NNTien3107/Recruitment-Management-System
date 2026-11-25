import { z } from 'zod';

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().default(3000),
    DATABASE_URL: z.string().min(1),
    STORAGE_DIR: z.string().default('uploads'),
    JWT_ACCESS_SECRET: z.string().min(32),
    JWT_ACCESS_EXPIRES_IN_SECONDS: z.coerce.number().default(900), // 15 phút
    REFRESH_TOKEN_TTL_DAYS: z.coerce.number().default(7),
    CORS_ORIGINS: z
      .string()
      .default('http://localhost:5173')
      .transform((value) =>
        value
          .split(',')
          .map((origin) => origin.trim())
          .filter(Boolean),
      ),
    // Chỉ bật khi backend đứng sau reverse proxy (Nginx, Cloudflare...)
    TRUST_PROXY: z
      .enum(['true', 'false'])
      .default('false')
      .transform((value) => value === 'true'),
    SMTP_HOST: z.string().min(1).optional(),
    SMTP_PORT: z.coerce.number().int().min(1).max(65535).default(587),
    SMTP_USER: z.string().min(1).optional(),
    SMTP_PASS: z.string().min(1).optional(),
    SMTP_FROM: z.email().optional(),
  })
  .superRefine((config, ctx) => {
    if (config.SMTP_HOST && !config.SMTP_FROM) {
      ctx.addIssue({ code: 'custom', path: ['SMTP_FROM'], message: 'Bắt buộc khi bật SMTP' });
    }
    if (Boolean(config.SMTP_USER) !== Boolean(config.SMTP_PASS)) {
      ctx.addIssue({
        code: 'custom',
        path: ['SMTP_USER'],
        message: 'Cần cả SMTP_USER và SMTP_PASS',
      });
    }
  });

export type Env = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): Env {
  const result = envSchema.safeParse(config);
  if (!result.success) {
    const details = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    throw new Error(`Biến môi trường không hợp lệ: ${details}`);
  }
  return result.data;
}
