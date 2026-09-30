/** Occasions of the specification (5.1), from the most relaxed to the most formal. */
export const OCCASIONS = [
  'walk',
  'everyday',
  'date',
  'restaurant',
  'work',
  'evening',
  'ceremony',
] as const;
export type Occasion = (typeof OCCASIONS)[number];

/** Number of outfits proposed by default (specification 5.3). */
export const OUTFITS_PER_GENERATION = 5;
