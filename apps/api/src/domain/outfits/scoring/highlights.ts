import type { OutfitHighlight } from '@klotho/shared';

import type { ScoreBreakdown } from './outfit-score';

/** A sub-score at least this good is worth telling. */
const WORTH_TELLING = 0.75;
/** Enough pieces rarely worn to suggest rediscovering them. */
const REDISCOVER_FROM = 0.58;
const MAX_HIGHLIGHTS = 3;

const TOLD: (keyof ScoreBreakdown & OutfitHighlight)[] = [
  'weather',
  'style',
  'occasion',
  'color',
  'compatibility',
  'preferences',
];

/**
 * US7.2: explains briefly why a look was chosen, from its best sub-scores,
 * without exposing the raw score.
 */
export function highlightsOf(breakdown: ScoreBreakdown): OutfitHighlight[] {
  const best: OutfitHighlight[] = TOLD.filter(
    (name) => breakdown[name] >= WORTH_TELLING,
  ).sort((a, b) => breakdown[b] - breakdown[a]);
  if (breakdown.usage >= REDISCOVER_FROM) best.push('rediscover');
  return best.slice(0, MAX_HIGHLIGHTS);
}
