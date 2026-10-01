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

/**
 * What the user told about past looks (US8.1): the main pieces of the looks
 * she liked and disliked, and her favourite pieces.
 */
export interface OutfitFeedbackSignals {
  liked: string[][];
  disliked: string[][];
  favoriteItemIds: string[];
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
  /** None for a user who never gave an opinion. */
  feedback?: OutfitFeedbackSignals;
}

export const mainPieces = (outfit: Outfit): OutfitPiece[] =>
  outfit.pieces.filter((piece) => MAIN_ROLES.includes(piece.role));

/** Same identity as outfitKey, from the ids of the main pieces. */
export const keyOfMainPieces = (itemIds: string[]): string =>
  [...itemIds].sort().join('+');

/**
 * Stable identity of a look: its main pieces, whatever their order. The
 * same look with another bag is the same look.
 */
export function outfitKey(outfit: Outfit): string {
  return keyOfMainPieces(mainPieces(outfit).map((piece) => piece.item.id));
}
