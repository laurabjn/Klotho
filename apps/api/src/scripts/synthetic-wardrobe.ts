// Deterministic fake wardrobes, to profile the outfit engine at scale.
import {
  COLOR_KEYS,
  PATTERNS,
  SEASONS,
  STYLES,
  SUBCATEGORIES,
  type WardrobeCategory,
  type WardrobeStatus,
} from '@klotho/shared';

import type {
  OutfitCandidate,
  OutfitFeedbackSignals,
} from '../domain/outfits/entities/outfit-candidate';

/** mulberry32: a small seeded generator, same pieces on every run. */
export function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Share of each category in a typical wardrobe. */
const CATEGORY_SHARES: [WardrobeCategory, number][] = [
  ['TOP', 0.27],
  ['BOTTOM', 0.17],
  ['DRESS', 0.08],
  ['LAYER', 0.1],
  ['SHOES', 0.12],
  ['BAG', 0.08],
  ['JEWELRY', 0.08],
  ['ACCESSORY', 0.07],
  ['UNDERWEAR', 0.03],
];

const STATUSES: [WardrobeStatus, number][] = [
  ['AVAILABLE', 0.85],
  ['WASHING', 0.07],
  ['LENT', 0.02],
  ['ARCHIVED', 0.06],
];

const DAY = 24 * 60 * 60 * 1000;

export function syntheticWardrobe(
  size: number,
  seed = 42,
  today = new Date('2026-10-01T08:00:00.000Z'),
): OutfitCandidate[] {
  const random = seededRandom(seed);
  const pick = <T>(values: readonly T[]): T =>
    values[Math.floor(random() * values.length)]!;
  const weighted = <T>(shares: [T, number][]): T => {
    let roll = random();
    for (const [value, share] of shares) {
      roll -= share;
      if (roll <= 0) return value;
    }
    return shares[0]![0];
  };
  const some = <T>(values: readonly T[], max: number): T[] => [
    ...new Set(
      Array.from({ length: Math.floor(random() * (max + 1)) }, () =>
        pick(values),
      ),
    ),
  ];

  return Array.from({ length: size }, (_, index) => {
    const category = weighted(CATEGORY_SHARES);
    const warmth = 1 + Math.floor(random() * 5);
    const minTemperature =
      random() < 0.6 ? -5 + warmth * -2 + Math.floor(random() * 15) : null;
    return {
      id: `piece-${String(index).padStart(4, '0')}`,
      category,
      subcategory: random() < 0.7 ? pick(SUBCATEGORIES[category]) : null,
      primaryColor: pick(COLOR_KEYS),
      secondaryColors: some(COLOR_KEYS, 2),
      pattern: random() < 0.8 ? pick(PATTERNS) : null,
      styles: some(STYLES, 3),
      seasons: some(SEASONS, 3),
      minTemperature,
      maxTemperature:
        minTemperature === null || random() < 0.5
          ? null
          : minTemperature + 10 + Math.floor(random() * 20),
      warmthLevel: random() < 0.7 ? warmth : null,
      formalityLevel: random() < 0.7 ? 1 + Math.floor(random() * 5) : null,
      status: weighted(STATUSES),
      wearCount: Math.floor(random() * 30),
      lastWornAt:
        random() < 0.8
          ? new Date(today.getTime() - Math.floor(random() * 120) * DAY)
          : null,
    };
  });
}

/** Opinions on past looks, as a long-time user would have given. */
export function syntheticFeedback(
  wardrobe: OutfitCandidate[],
  looks = 60,
  seed = 7,
): OutfitFeedbackSignals {
  const random = seededRandom(seed);
  const ids = (category: WardrobeCategory) =>
    wardrobe.filter((item) => item.category === category).map((i) => i.id);
  const [tops, bottoms, shoes] = [ids('TOP'), ids('BOTTOM'), ids('SHOES')];
  const pick = (values: string[]) =>
    values[Math.floor(random() * values.length)]!;
  const lookOf = () => [pick(tops), pick(bottoms), pick(shoes)];
  return {
    liked: Array.from({ length: Math.round(looks * 0.6) }, lookOf),
    disliked: Array.from({ length: Math.round(looks * 0.4) }, lookOf),
    favoriteItemIds: wardrobe
      .filter(() => random() < 0.1)
      .map((item) => item.id),
  };
}
