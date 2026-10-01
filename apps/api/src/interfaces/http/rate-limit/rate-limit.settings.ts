import type { Env, RateLimitRule } from '../../../config/env';

/** The routes with a limit of their own. */
export type RateLimitName =
  | 'login'
  | 'register'
  | 'forgotPassword'
  | 'resetPassword'
  | 'refresh'
  | 'uploads';

export interface RateLimitSettings {
  enabled: boolean;
  rules: Record<RateLimitName, RateLimitRule>;
}

export const RATE_LIMIT_SETTINGS = Symbol('RateLimitSettings');

/** Limits also counted per account, on top of the per-IP count. */
export const PER_USER_LIMITS: readonly RateLimitName[] = ['uploads'];

export function rateLimitSettingsFrom(
  get: <K extends keyof Env>(key: K) => Env[K],
): RateLimitSettings {
  return {
    enabled: get('RATE_LIMIT_ENABLED'),
    rules: {
      login: get('RATE_LIMIT_LOGIN'),
      register: get('RATE_LIMIT_REGISTER'),
      forgotPassword: get('RATE_LIMIT_FORGOT_PASSWORD'),
      resetPassword: get('RATE_LIMIT_RESET_PASSWORD'),
      refresh: get('RATE_LIMIT_REFRESH'),
      uploads: get('RATE_LIMIT_UPLOADS'),
    },
  };
}
