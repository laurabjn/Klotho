import { z } from 'zod';

const flag = (byDefault: 'true' | 'false') =>
  z
    .enum(['true', 'false'])
    .default(byDefault)
    .transform((value) => value === 'true');

export interface RateLimitRule {
  limit: number;
  ttlSeconds: number;
}

/** "<requests>/<seconds>", e.g. "10/60" for 10 requests a minute. */
const rateLimit = (byDefault: `${number}/${number}`) =>
  z
    .string()
    .trim()
    .regex(/^[1-9]\d*\/[1-9]\d*$/, 'must look like <requests>/<seconds>')
    .default(byDefault)
    .transform((value): RateLimitRule => {
      const [limit, ttlSeconds] = value.split('/').map(Number);
      return { limit: limit!, ttlSeconds: ttlSeconds! };
    });

export const envSchema = z
  .object({
    NODE_ENV: z
      .enum(['development', 'test', 'production'])
      .default('development'),
    PORT: z.coerce.number().int().positive().default(3000),
    /** Reverse proxies in front of the API (their X-Forwarded-For is trusted). */
    TRUST_PROXY: z.coerce.number().int().min(0).default(0),

    // Logs: one JSON object per line (production default) or readable text.
    LOG_FORMAT: z.enum(['json', 'pretty']).optional(),
    LOG_HTTP_REQUESTS: flag('true'),
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
    EMAIL_CHANGE_TTL_MINUTES: z.coerce.number().int().positive().default(60),
    CONFIRM_EMAIL_URL: z.url().default('klotho://confirm-email'),
    BCRYPT_COST: z.coerce.number().int().min(4).max(15).default(12),

    // console: emails written to the server output (development only);
    // brevo: sent with Brevo's transactional API (production).
    MAIL_DRIVER: z.enum(['console', 'brevo']).default('console'),
    BREVO_API_KEY: z
      .string()
      .trim()
      .optional()
      .transform((key) => key || undefined),
    /** Sender address, verified in the mail provider. */
    MAIL_FROM: z.email().optional(),
    MAIL_FROM_NAME: z.string().min(1).default('Klotho'),

    // Photo storage: any S3-compatible service (Cloudflare R2, RustFS locally).
    STORAGE_ENDPOINT: z.url(),
    /** Address put in the signed photo links; must be reachable by the app. */
    STORAGE_PUBLIC_ENDPOINT: z.url().optional(),
    STORAGE_REGION: z.string().min(1).default('auto'),
    STORAGE_BUCKET: z.string().min(3),
    STORAGE_ACCESS_KEY_ID: z.string().min(1),
    STORAGE_SECRET_ACCESS_KEY: z.string().min(1),
    STORAGE_CREATE_BUCKET: flag('false'),
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

    // AI photo analysis. Without a key, the app hides the feature.
    AI_PROVIDER: z
      .enum(['groq', 'gemini', 'mistral', 'anthropic'])
      .default('groq'),
    /** Key of the chosen provider. */
    AI_API_KEY: z
      .string()
      .trim()
      .optional()
      .transform((key) => key || undefined),
    /** Default: the provider's model (see infrastructure/ai). */
    AI_MODEL: z
      .string()
      .trim()
      .optional()
      .transform((model) => model || undefined),
    AI_TIMEOUT_MS: z.coerce.number().int().min(1000).default(30000),
    /** Photo analyses offered to every account. */
    AI_FREE_PHOTO_ANALYSES: z.coerce.number().int().min(0).default(3),

    // Payments (RevenueCat). Off during the beta: no limit, nothing to buy.
    BILLING_ENABLED: flag('false'),
    /** RevenueCat secret API key (sk_…). */
    REVENUECAT_SECRET_KEY: z
      .string()
      .trim()
      .optional()
      .transform((key) => key || undefined),
    /** Value of the "Authorization header" set on the RevenueCat webhook. */
    REVENUECAT_WEBHOOK_AUTH: z
      .string()
      .trim()
      .optional()
      .transform((value) => value || undefined),
    FREE_PIECES: z.coerce.number().int().min(1).default(100),
    FREE_GENERATIONS_PER_WEEK: z.coerce.number().int().min(1).default(10),
    FREE_HISTORY_DAYS: z.coerce.number().int().min(1).default(7),
    PREMIUM_MONTHLY_ANALYSES: z.coerce.number().int().min(0).default(25),
    /** Last day of the founders offer (YYYY-MM-DD); unset: on sale without end. */
    FOUNDERS_UNTIL: z.iso.date().optional(),

    // Rate limiting, per client IP (and per account for uploads).
    RATE_LIMIT_ENABLED: flag('true'),
    RATE_LIMIT_LOGIN: rateLimit('10/60'),
    RATE_LIMIT_REGISTER: rateLimit('5/60'),
    RATE_LIMIT_FORGOT_PASSWORD: rateLimit('5/900'),
    RATE_LIMIT_RESET_PASSWORD: rateLimit('10/900'),
    RATE_LIMIT_REFRESH: rateLimit('30/60'),
    RATE_LIMIT_UPLOADS: rateLimit('30/60'),
  })
  .refine((env) => env.NODE_ENV !== 'production' || env.OPENWEATHER_API_KEY, {
    path: ['OPENWEATHER_API_KEY'],
    message: 'is required in production',
  })
  .refine(
    // Locally, the limits and the screens can be tried without the store.
    (env) =>
      !env.BILLING_ENABLED ||
      env.NODE_ENV !== 'production' ||
      (!!env.REVENUECAT_SECRET_KEY && !!env.REVENUECAT_WEBHOOK_AUTH),
    {
      path: ['BILLING_ENABLED'],
      message:
        'needs REVENUECAT_SECRET_KEY and REVENUECAT_WEBHOOK_AUTH in production',
    },
  )
  .refine(
    (env) =>
      env.MAIL_DRIVER !== 'brevo' || (!!env.BREVO_API_KEY && !!env.MAIL_FROM),
    {
      path: ['MAIL_DRIVER'],
      message: 'brevo needs BREVO_API_KEY and MAIL_FROM',
    },
  )
  .refine(
    (env) => !(env.NODE_ENV === 'production' && env.MAIL_DRIVER === 'console'),
    {
      path: ['MAIL_DRIVER'],
      message:
        'the console mailer logs reset and confirmation links and must not be used in production',
    },
  );

export type Env = z.infer<typeof envSchema>;

/** JSON in production unless asked otherwise, readable text elsewhere. */
export function logFormat(
  env: Pick<Env, 'NODE_ENV' | 'LOG_FORMAT'>,
): 'json' | 'pretty' {
  return env.LOG_FORMAT ?? (env.NODE_ENV === 'production' ? 'json' : 'pretty');
}

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
