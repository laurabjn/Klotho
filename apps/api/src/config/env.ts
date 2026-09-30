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

    // Photo storage: any S3-compatible service (Cloudflare R2, RustFS locally).
    STORAGE_ENDPOINT: z.url(),
    /** Address put in the signed photo links; must be reachable by the app. */
    STORAGE_PUBLIC_ENDPOINT: z.url().optional(),
    STORAGE_REGION: z.string().min(1).default('auto'),
    STORAGE_BUCKET: z.string().min(3),
    STORAGE_ACCESS_KEY_ID: z.string().min(1),
    STORAGE_SECRET_ACCESS_KEY: z.string().min(1),
    STORAGE_CREATE_BUCKET: z
      .enum(['true', 'false'])
      .default('false')
      .transform((value) => value === 'true'),
    PHOTO_URL_TTL_SECONDS: z.coerce.number().int().min(60).default(3600),
    PHOTOS_MAX_PER_ITEM: z.coerce.number().int().min(1).max(20).default(5),
    UPLOAD_MAX_BYTES: z.coerce
      .number()
      .int()
      .positive()
      .default(10 * 1024 * 1024),

    // Weather: OpenWeatherMap. Without a key, the app offers manual temperature only.
    OPENWEATHER_API_KEY: z
      .string()
      .trim()
      .optional()
      .transform((key) => key || undefined),
    WEATHER_TIMEOUT_MS: z.coerce.number().int().min(500).default(5000),
    WEATHER_CACHE_TTL_SECONDS: z.coerce.number().int().min(0).default(600),
  })
  .refine((env) => env.NODE_ENV !== 'production' || env.OPENWEATHER_API_KEY, {
    path: ['OPENWEATHER_API_KEY'],
    message: 'is required in production',
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
