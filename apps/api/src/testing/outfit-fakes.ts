// Builders for the outfit engine tests.
import { styleProfileSchema } from '@klotho/shared';

import type {
  Outfit,
  OutfitCandidate,
  OutfitContext,
  OutfitRole,
} from '../domain/outfits/entities/outfit-candidate';
import { ROLE_OF } from '../domain/outfits/services/outfit-combination-builder';

let sequence = 0;

/** A plain, available piece that suits any weather unless told otherwise. */
export function piece(
  overrides: Partial<OutfitCandidate> & Pick<OutfitCandidate, 'category'>,
): OutfitCandidate {
  sequence += 1;
  return {
    id: `item-${sequence}`,
    subcategory: null,
    primaryColor: 'ecru',
    secondaryColors: [],
    pattern: null,
    styles: [],
    seasons: [],
    minTemperature: null,
    maxTemperature: null,
    warmthLevel: null,
    formalityLevel: null,
    status: 'AVAILABLE',
    wearCount: 3,
    lastWornAt: new Date('2026-08-01T08:00:00.000Z'),
    ...overrides,
  };
}

export const TODAY = new Date('2026-10-01T08:00:00.000Z');

export function context(overrides: Partial<OutfitContext> = {}): OutfitContext {
  return {
    temperature: 18,
    condition: 'clear',
    precipitation: 0,
    windSpeed: 5,
    style: null,
    occasion: null,
    profile: styleProfileSchema.parse({}),
    today: TODAY,
    ...overrides,
  };
}

/** A look made of the given pieces, each in the role of its category. */
export function look(...items: OutfitCandidate[]): Outfit {
  return {
    pieces: items.map((item) => ({
      role: ROLE_OF[item.category] as OutfitRole,
      item,
    })),
  };
}
