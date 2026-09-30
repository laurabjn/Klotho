import type { Season } from '@klotho/shared';

import type {
  OutfitCandidate,
  OutfitContext,
} from '../entities/outfit-candidate';

type Range = readonly [min: number, max: number];

/** Beyond its range by more than this (°C), a piece is not proposed at all. */
export const TEMPERATURE_TOLERANCE = 3;

/** Comfortable temperatures for each warmth level ("Très léger" … "Très chaud"). */
const WARMTH_RANGES: Record<number, Range> = {
  1: [20, 50],
  2: [14, 35],
  3: [6, 24],
  4: [-5, 16],
  5: [-30, 8],
};

/** Defaults when the user gave neither a range nor a warmth level. */
const SUBCATEGORY_RANGES: Partial<Record<string, Range>> = {
  puffer: [-30, 10],
  coat: [-20, 14],
  trench: [6, 20],
  leatherJacket: [6, 20],
  jacket: [8, 22],
  blazer: [10, 26],
  sweater: [-10, 18],
  cardigan: [5, 22],
  tankTop: [20, 50],
  shorts: [20, 50],
  sandals: [20, 50],
  boots: [-30, 16],
  ankleBoots: [-20, 20],
  beanie: [-30, 10],
  gloves: [-30, 8],
};

/** Temperatures a piece is comfortable in, or null when nothing is known. */
export function comfortRange(item: OutfitCandidate): Range | null {
  if (item.minTemperature !== null || item.maxTemperature !== null) {
    return [item.minTemperature ?? -Infinity, item.maxTemperature ?? Infinity];
  }
  if (item.warmthLevel !== null) return WARMTH_RANGES[item.warmthLevel] ?? null;
  return (item.subcategory && SUBCATEGORY_RANGES[item.subcategory]) || null;
}

/**
 * 1 inside the comfort range, decreasing to 0.3 at the tolerance, 0 beyond
 * (the piece is then excluded). 1 when the temperature or the range is unknown.
 */
export function temperatureFit(
  item: OutfitCandidate,
  temperature: number | null,
): number {
  const range = comfortRange(item);
  if (temperature === null || !range) return 1;
  const [min, max] = range;
  const gap = temperature < min ? min - temperature : temperature - max;
  if (gap <= 0) return 1;
  if (gap > TEMPERATURE_TOLERANCE) return 0;
  return 1 - (gap / TEMPERATURE_TOLERANCE) * 0.7;
}

/** Northern hemisphere, meteorological seasons. */
export function seasonOf(date: Date): Season {
  const month = date.getMonth();
  if (month >= 2 && month <= 4) return 'spring';
  if (month >= 5 && month <= 7) return 'summer';
  if (month >= 8 && month <= 10) return 'autumn';
  return 'winter';
}

const isWet = (context: OutfitContext) =>
  context.condition === 'rain' ||
  context.condition === 'storm' ||
  context.precipitation > 0.5;

const OPEN_SHOES = ['sandals', 'flats', 'pumps'];
const RAIN_FRIENDLY = ['boots', 'ankleBoots', 'trench'];
const WIND_SENSITIVE = ['shortSkirt', 'shortDress'];

/** Hard weather rules: snow forbids sandals. */
export function isForbiddenByWeather(
  item: OutfitCandidate,
  context: OutfitContext,
): boolean {
  return context.condition === 'snow' && item.subcategory === 'sandals';
}

/**
 * How well a piece suits the day's weather, from 0 to 1: temperature,
 * season, rain and wind.
 */
export function pieceWeatherFit(
  item: OutfitCandidate,
  context: OutfitContext,
): number {
  let fit = temperatureFit(item, context.temperature);
  if (
    item.seasons.length > 0 &&
    !item.seasons.includes(seasonOf(context.today))
  )
    fit *= 0.6;
  const subcategory = item.subcategory ?? '';
  if (isWet(context)) {
    if (OPEN_SHOES.includes(subcategory)) fit *= 0.5;
    if (RAIN_FRIENDLY.includes(subcategory)) fit = Math.min(1, fit * 1.15);
  }
  if (context.windSpeed > 40 && WIND_SENSITIVE.includes(subcategory))
    fit *= 0.7;
  return fit;
}

/** Below this, a look without a layer is under-dressed. */
export const LAYER_NEEDED_BELOW = 16;
/** Above this, a layer is too much. */
export const LAYER_TOO_WARM_ABOVE = 24;
