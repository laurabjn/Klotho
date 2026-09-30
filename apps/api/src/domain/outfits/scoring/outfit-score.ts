import type { Outfit, OutfitContext } from '../entities/outfit-candidate';
import { scoreColor } from './color.scorer';
import { scoreCompatibility } from './compatibility.scorer';
import { scoreOccasion } from './occasion.scorer';
import { scorePreference } from './preference.scorer';
import { scoreStyle } from './style.scorer';
import { scoreUsage } from './usage.scorer';
import { scoreWeather } from './weather.scorer';

/** Weight of each sub-score; the total score is out of their sum (100). */
export interface ScoreWeights {
  weather: number;
  compatibility: number;
  style: number;
  occasion: number;
  color: number;
  preferences: number;
  usage: number;
  /** Used when picking the top N: rewards looks different from those already chosen. */
  variety: number;
}

/** The example configuration of the technical backlog. */
export const DEFAULT_WEIGHTS: ScoreWeights = {
  weather: 30,
  compatibility: 20,
  style: 15,
  occasion: 15,
  color: 10,
  preferences: 5,
  usage: 3,
  variety: 2,
};

/** Each sub-score, from 0 to 1. */
export type ScoreBreakdown = Record<
  Exclude<keyof ScoreWeights, 'variety'>,
  number
>;

export interface ScoredOutfit {
  outfit: Outfit;
  /** Weighted total, variety excluded (it depends on the other picks). */
  score: number;
  breakdown: ScoreBreakdown;
}

export function scoreOutfit(
  outfit: Outfit,
  context: OutfitContext,
  weights: ScoreWeights = DEFAULT_WEIGHTS,
): ScoredOutfit {
  const breakdown: ScoreBreakdown = {
    weather: scoreWeather(outfit, context),
    compatibility: scoreCompatibility(outfit),
    style: scoreStyle(outfit, context),
    occasion: scoreOccasion(outfit, context),
    color: scoreColor(outfit),
    preferences: scorePreference(outfit, context),
    usage: scoreUsage(outfit, context),
  };
  const score = (Object.keys(breakdown) as (keyof ScoreBreakdown)[]).reduce(
    (sum, name) => sum + weights[name] * breakdown[name],
    0,
  );
  return { outfit, score, breakdown };
}
