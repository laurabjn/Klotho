import type { WeatherCondition } from '@klotho/shared';

export interface PlanForecast {
  /** °C, rounded. */
  temperature: number;
  condition: WeatherCondition;
}

export interface NewOutfitPlan {
  /** YYYY-MM-DD, in the user's calendar. */
  day: string;
  outfitId: string;
  /** The forecast it was planned with, when known. */
  forecast: PlanForecast | null;
}

export interface StoredOutfitPlan extends NewOutfitPlan {
  id: string;
  userId: string;
}

/**
 * One look per user and day. Every method is scoped to an owner; the looks
 * given were checked to be the user's.
 */
export interface OutfitPlanRepository {
  /** Days included, by day. */
  listBetween(
    userId: string,
    from: string,
    to: string,
  ): Promise<StoredOutfitPlan[]>;
  findByDay(userId: string, day: string): Promise<StoredOutfitPlan | null>;
  /** Creates the day's plan or replaces the one already there. */
  save(userId: string, plan: NewOutfitPlan): Promise<StoredOutfitPlan>;
  /** Creates the plans of free days; a day planned meanwhile is skipped. */
  createMany(
    userId: string,
    plans: NewOutfitPlan[],
  ): Promise<StoredOutfitPlan[]>;
  /**
   * Moves the plan of `from` to `to` (with `forecasts.to`); a plan already
   * on `to` goes to `from` (with `forecasts.from`). Each keeps its id.
   * Returns the moved plan, then the swapped one; [] if `from` has none.
   */
  move(
    userId: string,
    from: string,
    to: string,
    forecasts: { from: PlanForecast | null; to: PlanForecast | null },
  ): Promise<StoredOutfitPlan[]>;
  /** Idempotent. */
  delete(userId: string, day: string): Promise<void>;
}

export const OUTFIT_PLAN_REPOSITORY = Symbol('OutfitPlanRepository');
