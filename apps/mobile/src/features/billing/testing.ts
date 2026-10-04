import type { BillingStatus } from '@klotho/shared';

const FREE = { pieces: 50, generationsPerWeek: 10, historyDays: 7 };

/** A billing status, free plan with payments on unless overridden. */
export const billingStatus = (
  overrides: Partial<BillingStatus> = {},
): BillingStatus => ({
  enabled: true,
  plan: 'free',
  expiresAt: null,
  limits: FREE,
  usage: { pieces: 0, generationsThisWeek: 0 },
  credits: { enabled: true, remaining: 3, quota: 3 },
  offer: { free: FREE, freeAnalyses: 3, premiumMonthlyAnalyses: 25 },
  ...overrides,
});
