import type {
  Occasion,
  Style,
  StyleProfileFields,
  WeatherCondition,
} from '@klotho/shared';

import type { WardrobeItem } from '../../wardrobe/entities/wardrobe-item.entity';

/** What the engine needs to know about a piece of the wardrobe. */
export type OutfitCandidate = Pick<
  WardrobeItem,
  | 'id'
  | 'category'
  | 'subcategory'
  | 'primaryColor'
  | 'secondaryColors'
  | 'pattern'
  | 'styles'
  | 'seasons'
  | 'minTemperature'
  | 'maxTemperature'
  | 'warmthLevel'
  | 'formalityLevel'
  | 'status'
  | 'wearCount'
  | 'lastWornAt'
>;

/** Place of a piece in a look. */
export type OutfitRole =
  | 'top'
  | 'bottom'
  | 'dress'
  | 'layer'
  | 'shoes'
  | 'bag'
  | 'jewelry'
  | 'accessory';

/** The roles making the silhouette; bag, jewellery and accessory complete it. */
export const MAIN_ROLES: readonly OutfitRole[] = [
  'top',
  'bottom',
  'dress',
  'layer',
  'shoes',
];

export interface OutfitPiece {
  role: OutfitRole;
  item: OutfitCandidate;
}

export interface Outfit {
  pieces: OutfitPiece[];
}

/** Everything that shapes the day's looks, besides the wardrobe itself. */
export interface OutfitContext {
  /** In °C: the manual temperature when given, else the weather; null if unknown. */
  temperature: number | null;
  condition: WeatherCondition | null;
  /** mm over the last hour. */
  precipitation: number;
  /** km/h. */
  windSpeed: number;
  style: Style | null;
  occasion: Occasion | null;
  profile: StyleProfileFields;
  today: Date;
}

export const mainPieces = (outfit: Outfit): OutfitPiece[] =>
  outfit.pieces.filter((piece) => MAIN_ROLES.includes(piece.role));

/**
 * Stable identity of a look: its main pieces, whatever their order. The
 * same look with another bag is the same look.
 */
export function outfitKey(outfit: Outfit): string {
  return mainPieces(outfit)
    .map((piece) => piece.item.id)
    .sort()
    .join('+');
}
