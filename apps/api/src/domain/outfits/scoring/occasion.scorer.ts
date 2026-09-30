import type { Occasion } from '@klotho/shared';

import type { Outfit, OutfitContext } from '../entities/outfit-candidate';

/** Expected formality (1 "très décontracté" … 5 "très habillé") of each occasion. */
export const OCCASION_FORMALITY: Record<Occasion, number> = {
  walk: 1.5,
  everyday: 2,
  date: 3,
  restaurant: 3,
  work: 3.5,
  evening: 4,
  ceremony: 5,
};

/** Unknown formality of a piece: neither a match nor a mismatch. */
const UNKNOWN = 0.75;

/**
 * How close the pieces' formality is to the occasion (or to the user's
 * preferred formality when no occasion is given).
 */
export function scoreOccasion(outfit: Outfit, context: OutfitContext): number {
  const target = context.occasion
    ? OCCASION_FORMALITY[context.occasion]
    : context.profile.preferredFormality;
  if (target === null) return UNKNOWN;

  // Every piece counts, bag and jewellery included: no canvas tote at a ceremony.
  const scores = outfit.pieces.map(({ item }) =>
    item.formalityLevel === null
      ? UNKNOWN
      : 1 - Math.abs(item.formalityLevel - target) / 4,
  );
  return scores.reduce((sum, score) => sum + score, 0) / scores.length;
}
