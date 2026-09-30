import {
  mainPieces,
  outfitKey,
  type Outfit,
} from '../entities/outfit-candidate';
import type { ScoredOutfit } from '../scoring/outfit-score';

export interface DiversityOptions {
  count: number;
  /** Minimal distance (0 to 1) between two proposed looks. */
  minDistance: number;
  /** A same base (top + bottom, or dress) appears at most this many times. */
  maxPerBase: number;
  /** Weight of the novelty of a look compared with those already picked. */
  varietyWeight: number;
  /** Looks already proposed, left out when generating again. */
  excludedKeys: string[];
}

const mainIds = (outfit: Outfit) =>
  new Set(mainPieces(outfit).map((piece) => piece.item.id));

/** 1 - Jaccard similarity of the main pieces: 0 same look, 1 nothing shared. */
export function outfitDistance(a: Outfit, b: Outfit): number {
  const idsA = mainIds(a);
  const idsB = mainIds(b);
  const shared = [...idsA].filter((id) => idsB.has(id)).length;
  return 1 - shared / new Set([...idsA, ...idsB]).size;
}

export function baseKey(outfit: Outfit): string {
  return outfit.pieces
    .filter((piece) => ['top', 'bottom', 'dress'].includes(piece.role))
    .map((piece) => piece.item.id)
    .sort()
    .join('+');
}

/**
 * US6.4: picks the top N, trading score for variety (each pick maximises
 * score + variety × distance to the looks already picked), keeping a minimal
 * distance and not letting one base monopolise the list. When the wardrobe
 * is too small for the minimal distance, it is relaxed rather than returning
 * fewer looks.
 */
export function selectDiverse(
  scored: ScoredOutfit[],
  options: DiversityOptions,
): ScoredOutfit[] {
  const excluded = new Set(options.excludedKeys);
  const pool = scored.filter((entry) => !excluded.has(outfitKey(entry.outfit)));
  const picked: ScoredOutfit[] = [];
  const perBase = new Map<string, number>();

  for (const minDistance of [options.minDistance, options.minDistance / 2, 0]) {
    while (picked.length < options.count) {
      let best: { entry: ScoredOutfit; value: number } | null = null;
      for (const entry of pool) {
        if (picked.includes(entry)) continue;
        if ((perBase.get(baseKey(entry.outfit)) ?? 0) >= options.maxPerBase)
          continue;
        const distance = picked.length
          ? Math.min(
              ...picked.map((other) =>
                outfitDistance(entry.outfit, other.outfit),
              ),
            )
          : 1;
        if (picked.length && (distance < minDistance || distance === 0))
          continue;
        const value = entry.score + options.varietyWeight * distance;
        if (!best || value > best.value) best = { entry, value };
      }
      if (!best) break;
      picked.push(best.entry);
      const key = baseKey(best.entry.outfit);
      perBase.set(key, (perBase.get(key) ?? 0) + 1);
    }
  }
  return picked;
}
