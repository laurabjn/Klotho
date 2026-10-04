import type { AiCallUsage } from './garment-analyzer';

export type AiFeature = 'photoAnalysis';

/**
 * Where a charged analysis was taken from: the monthly allowance of Premium,
 * or the balance (free analyses, founders and bought credits).
 */
export type AiPool = 'monthly' | 'balance';

export interface AiUsageRecord extends AiCallUsage {
  userId: string;
  feature: AiFeature;
  /** Null when not counted (no piece on the photo). */
  pool: AiPool | null;
}

/** Every paid AI call: cost follow-up and quotas. */
export interface AiUsageRepository {
  record(usage: AiUsageRecord): Promise<void>;
  /** Analyses taken from `pool`, since `since` when given. */
  countCharged(
    userId: string,
    feature: AiFeature,
    pool: AiPool,
    since?: Date,
  ): Promise<number>;
}

export const AI_USAGE_REPOSITORY = Symbol('AiUsageRepository');
