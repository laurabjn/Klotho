import {
  COLOR_FAMILIES,
  type ColorFamily,
  type ColorKey,
} from '@klotho/shared';

import { mainPieces, type Outfit } from '../entities/outfit-candidate';

/** Families that go with anything. */
const NEUTRAL_FAMILIES: ColorFamily[] = ['neutrals', 'browns', 'metallics'];

const familyOf = (color: ColorKey): ColorFamily =>
  (Object.keys(COLOR_FAMILIES) as ColorFamily[]).find(
    (family) => color in COLOR_FAMILIES[family],
  )!;

/** Score by number of distinct "colourful" families in the look. */
const BY_COLOURFUL_FAMILIES = [0.9, 1, 0.85, 0.55, 0.25];

/**
 * Colour harmony: neutrals go with everything, one or two colourful
 * families look good, more gets busy; and at most one patterned piece.
 */
export function scoreColor(outfit: Outfit): number {
  const pieces = mainPieces(outfit);
  const families = new Set(
    pieces
      .flatMap((piece) => [
        piece.item.primaryColor,
        ...piece.item.secondaryColors,
      ])
      .map(familyOf)
      .filter((family) => !NEUTRAL_FAMILIES.includes(family)),
  );
  let score =
    BY_COLOURFUL_FAMILIES[Math.min(families.size, 4)] ??
    BY_COLOURFUL_FAMILIES[4]!;

  const patterned = pieces.filter(
    (piece) => piece.item.pattern !== null && piece.item.pattern !== 'plain',
  ).length;
  if (patterned === 2) score *= 0.6;
  if (patterned > 2) score *= 0.3;
  return score;
}
