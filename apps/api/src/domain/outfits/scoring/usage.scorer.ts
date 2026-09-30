import type { Outfit, OutfitContext } from '../entities/outfit-candidate';

const DAY_MS = 24 * 60 * 60 * 1000;
/** A worn piece is fully "rested" after this many days. */
export const RECENCY_DAYS = 14;
/** Small bonus for pieces never worn… */
export const NEVER_WORN_BONUS = 0.3;
/** …capped over the whole look, so it never outweighs the rest. */
export const USAGE_BONUS_CAP = 0.15;

/**
 * Anti-repetition (US6.5): a piece worn recently is penalised, less and less
 * as days pass; never worn pieces get a small, capped bonus. The weather
 * rules stay first: this only reorders pieces that already suit the day.
 */
export function scoreUsage(outfit: Outfit, context: OutfitContext): number {
  let penalty = 0;
  let bonus = 0;
  for (const { item } of outfit.pieces) {
    if (item.lastWornAt) {
      const days =
        (context.today.getTime() - item.lastWornAt.getTime()) / DAY_MS;
      penalty += Math.max(0, 1 - days / RECENCY_DAYS);
    } else if (item.wearCount === 0) {
      bonus += NEVER_WORN_BONUS;
    }
  }
  const count = outfit.pieces.length;
  const score =
    0.5 + Math.min(USAGE_BONUS_CAP, bonus / count) - 0.5 * (penalty / count);
  return Math.min(1, Math.max(0, score));
}
