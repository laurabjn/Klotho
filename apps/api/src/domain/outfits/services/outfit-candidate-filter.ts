import type { ColorKey, WardrobeCategory } from '@klotho/shared';

import type {
  OutfitCandidate,
  OutfitContext,
} from '../entities/outfit-candidate';
import {
  ImposedItemNotFoundError,
  ImposedItemUnavailableError,
} from '../errors';
import { isForbiddenByWeather, temperatureFit } from '../rules/weather-rules';

/** What the user explicitly does not want today ("pas de talons", "pas de noir"…). */
export interface OutfitExclusions {
  itemIds: string[];
  categories: WardrobeCategory[];
  /** E.g. "pumps" for "pas de talons", "trousers" for "pas de pantalon". */
  subcategories: string[];
  colors: ColorKey[];
}

export const NO_EXCLUSIONS: OutfitExclusions = {
  itemIds: [],
  categories: [],
  subcategories: [],
  colors: [],
};

export interface FilteredCandidates {
  candidates: OutfitCandidate[];
  /** Kept whatever the filters, since the user asked for them. */
  imposed: OutfitCandidate[];
}

const isWearable = (item: OutfitCandidate) =>
  item.status === 'AVAILABLE' && item.category !== 'UNDERWEAR';

const isExcluded = (item: OutfitCandidate, exclusions: OutfitExclusions) =>
  exclusions.itemIds.includes(item.id) ||
  exclusions.categories.includes(item.category) ||
  (item.subcategory !== null &&
    exclusions.subcategories.includes(item.subcategory)) ||
  [item.primaryColor, ...item.secondaryColors].some((color) =>
    exclusions.colors.includes(color),
  );

/**
 * US6.1: only available pieces, wearable at the day's temperature and
 * weather, minus the user's exclusions. Imposed pieces (the "pièce imposée",
 * or the pieces kept for a variant) are always kept, unless they simply
 * cannot be worn (in the wash, sold, underwear…).
 */
export function filterCandidates(
  wardrobe: OutfitCandidate[],
  context: OutfitContext,
  exclusions: OutfitExclusions = NO_EXCLUSIONS,
  imposedItemIds: string[] = [],
): FilteredCandidates {
  const imposed = imposedItemIds.map((id) => {
    const item = wardrobe.find((candidate) => candidate.id === id);
    if (!item) throw new ImposedItemNotFoundError();
    if (!isWearable(item)) throw new ImposedItemUnavailableError();
    return item;
  });

  const candidates = wardrobe.filter(
    (item) =>
      imposedItemIds.includes(item.id) ||
      (isWearable(item) &&
        !isExcluded(item, exclusions) &&
        temperatureFit(item, context.temperature) > 0 &&
        !isForbiddenByWeather(item, context)),
  );
  return { candidates, imposed };
}
