import type { Outfit, OutfitContext } from '../entities/outfit-candidate';
import {
  LAYER_NEEDED_BELOW,
  LAYER_TOO_WARM_ABOVE,
  pieceWeatherFit,
} from '../rules/weather-rules';

/** Warm tops (sweater, very warm pieces) can replace a layer when it is cool. */
const isWarmTop = (outfit: Outfit) =>
  outfit.pieces.some(
    (piece) =>
      (piece.role === 'top' || piece.role === 'dress') &&
      ((piece.item.warmthLevel ?? 0) >= 4 ||
        piece.item.subcategory === 'sweater'),
  );

/**
 * Temperature, season, rain and wind of every piece, plus whether the look
 * needs (or has too much of) a layer.
 */
export function scoreWeather(outfit: Outfit, context: OutfitContext): number {
  const fits = outfit.pieces.map((piece) =>
    pieceWeatherFit(piece.item, context),
  );
  let score = fits.reduce((sum, fit) => sum + fit, 0) / fits.length;
  // The least suited piece weighs more than the average: one piece can spoil a look.
  score = 0.6 * score + 0.4 * Math.min(...fits);

  const { temperature } = context;
  const hasLayer = outfit.pieces.some((piece) => piece.role === 'layer');
  if (temperature !== null) {
    if (temperature < LAYER_NEEDED_BELOW && !hasLayer && !isWarmTop(outfit))
      score *= 0.5;
    if (temperature > LAYER_TOO_WARM_ABOVE && hasLayer) score *= 0.6;
  }
  return score;
}
