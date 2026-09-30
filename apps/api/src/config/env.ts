import { z } from 'zod';

export const envSchema = z
  .object({
    NODE_ENV: z
      .enum(['development', 'test', 'production'])
      .default('development'),
    PORT: z.coerce.number().int().positive().default(3000),
    DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/ }),

    JWT_ACCESS_SECRET: z
      .string()
      .min(
        32,
        'must be at least 32 characters (use `openssl rand -base64 48`)',
      ),
    JWT_ACCESS_TTL_SECONDS: z.coerce.number().int().positive().default(900),
    REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().default(30),
    PASSWORD_RESET_TTL_MINUTES: z.coerce.number().int().positive().default(60),
    RESET_PASSWORD_URL: z.url().default('klotho://reset-password'),
    BCRYPT_COST: z.coerce.number().int().min(4).max(15).default(12),

    // Only "console" exists for now: emails are written to the server log.
    MAIL_DRIVER: z.enum(['console']).default('console'),
  })
  .refine(
    (env) => !(env.NODE_ENV === 'production' && env.MAIL_DRIVER === 'console'),
    {
      path: ['MAIL_DRIVER'],
      message:
        'the console mailer logs reset links and must not be used in production',
    },
  );

export type Env = z.infer<typeof envSchema>;

/** Used by ConfigModule: fails fast at boot, listing every invalid variable. */
export function validateEnv(config: Record<string, unknown>): Env {
  const result = envSchema.safeParse(config);
  if (!result.success) {
    throw new Error(
      `Invalid environment variables:\n${z.prettifyError(result.error)}`,
    );
  }
  return result.data;
}
