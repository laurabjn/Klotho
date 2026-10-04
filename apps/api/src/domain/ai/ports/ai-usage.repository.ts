import type { AiCallUsage } from './garment-analyzer';

export type AiFeature = 'photoAnalysis';

export interface AiUsageRecord extends AiCallUsage {
  userId: string;
  feature: AiFeature;
  /** Counted in the user's quota. */
  charged: boolean;
}

/** Every paid AI call: cost follow-up and quotas. */
export interface AiUsageRepository {
  record(usage: AiUsageRecord): Promise<void>;
  countCharged(userId: string, feature: AiFeature): Promise<number>;
}

export const AI_USAGE_REPOSITORY = Symbol('AiUsageRepository');
