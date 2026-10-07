import type { AiCredits } from '../ai/schemas';

/** "free" by default; "founders" is the lifetime offer of the launch. */
export const PLANS = ['free', 'premium', 'founders'] as const;
export type Plan = (typeof PLANS)[number];

/**
 * Store products (Google Play / App Store ids, the same in RevenueCat).
 * Subscriptions give "premium", the lifetime purchase gives "founders",
 * the packs add AI credits.
 */
export const PRODUCTS = {
  premiumMonthly: 'klotho_premium_monthly',
  premiumAnnual: 'klotho_premium_annual',
  founders: 'klotho_founders',
  credits25: 'klotho_credits_25',
  credits75: 'klotho_credits_75',
} as const;

/** AI credits added by each one-time product. */
export const CREDIT_PRODUCTS: Readonly<Record<string, number>> = {
  [PRODUCTS.credits25]: 25,
  [PRODUCTS.credits75]: 75,
  // The founders offer comes with a starting stock.
  [PRODUCTS.founders]: 30,
};

/** RevenueCat entitlements, in order of precedence. */
export const ENTITLEMENTS = {
  founders: 'founders',
  premium: 'premium',
} as const;

/** Limits of the free plan; null means unlimited. */
export interface PlanLimits {
  pieces: number | null;
  generationsPerWeek: number | null;
  historyDays: number | null;
}

/** GET /billing/status: what the app shows and enforces. */
export interface BillingStatus {
  /** False while payments are off (beta): every limit is lifted. */
  enabled: boolean;
  plan: Plan;
  /** End of the paid period (premium); null for free and founders. */
  expiresAt: string | null;
  limits: PlanLimits;
  usage: { pieces: number; generationsThisWeek: number };
  credits: AiCredits;
  /** What each plan includes, for the comparison of the Premium screen. */
  offer: {
    free: PlanLimits;
    freeAnalyses: number;
    premiumMonthlyAnalyses: number;
    /** The founders offer is limited in time. */
    foundersOnSale: boolean;
    /** Its last day (YYYY-MM-DD), null when no end is set. */
    foundersUntil: string | null;
  };
}
