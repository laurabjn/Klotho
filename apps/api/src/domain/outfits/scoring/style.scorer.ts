import {
  mainPieces,
  type Outfit,
  type OutfitContext,
} from '../entities/outfit-candidate';

/**
 * Share of the main pieces matching the requested style, or the user's
 * favourite styles when none is requested. 0.5 when nothing is known.
 */
export function scoreStyle(outfit: Outfit, context: OutfitContext): number {
  const wanted = context.style
    ? [context.style]
    : context.profile.preferredStyles;
  if (wanted.length === 0) return 0.5;

  const pieces = mainPieces(outfit);
  const matching = pieces.filter((piece) =>
    piece.item.styles.some((style) => wanted.includes(style)),
  ).length;
  return 0.2 + 0.8 * (matching / pieces.length);
}
