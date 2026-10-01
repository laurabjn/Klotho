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

function distanceBetween(idsA: Set<string>, idsB: Set<string>): number {
  let shared = 0;
  for (const id of idsA) if (idsB.has(id)) shared += 1;
  return 1 - shared / (idsA.size + idsB.size - shared);
}

/** 1 - Jaccard similarity of the main pieces: 0 same look, 1 nothing shared. */
export function outfitDistance(a: Outfit, b: Outfit): number {
  return distanceBetween(mainIds(a), mainIds(b));
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
  // Computed once per look: thousands of candidates are compared.
  const pool = scored
    .filter((entry) => !excluded.has(outfitKey(entry.outfit)))
    .map((entry) => ({
      entry,
      ids: mainIds(entry.outfit),
      base: baseKey(entry.outfit),
      picked: false,
      /** Distance to the closest look picked so far (1 before any pick). */
      distance: 1,
    }));
  const picked: ScoredOutfit[] = [];
  const perBase = new Map<string, number>();

  for (const minDistance of [options.minDistance, options.minDistance / 2, 0]) {
    while (picked.length < options.count) {
      let best: { candidate: (typeof pool)[number]; value: number } | null =
        null;
      for (const candidate of pool) {
        if (candidate.picked) continue;
        if ((perBase.get(candidate.base) ?? 0) >= options.maxPerBase) continue;
        const { distance } = candidate;
        if (picked.length && (distance < minDistance || distance === 0))
          continue;
        const value = candidate.entry.score + options.varietyWeight * distance;
        if (!best || value > best.value) best = { candidate, value };
      }
      if (!best) break;
      const chosen = best.candidate;
      chosen.picked = true;
      picked.push(chosen.entry);
      perBase.set(chosen.base, (perBase.get(chosen.base) ?? 0) + 1);
      for (const candidate of pool) {
        if (candidate.picked) continue;
        candidate.distance = Math.min(
          candidate.distance,
          distanceBetween(candidate.ids, chosen.ids),
        );
      }
    }
  }
  return picked;
}
