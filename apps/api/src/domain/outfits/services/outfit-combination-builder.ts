import type { WardrobeCategory } from '@klotho/shared';

import type {
  Outfit,
  OutfitCandidate,
  OutfitPiece,
  OutfitRole,
} from '../entities/outfit-candidate';

export const ROLE_OF: Record<WardrobeCategory, OutfitRole | null> = {
  TOP: 'top',
  BOTTOM: 'bottom',
  DRESS: 'dress',
  LAYER: 'layer',
  SHOES: 'shoes',
  BAG: 'bag',
  JEWELRY: 'jewelry',
  ACCESSORY: 'accessory',
  UNDERWEAR: null,
};

/** Bag, jewellery and accessory complete a look once it is chosen. */
export const FINISHING_ROLES: readonly OutfitRole[] = [
  'bag',
  'jewelry',
  'accessory',
];

export interface CombinationOptions {
  /** Keeps the combinations count reasonable: best pieces of each role only. */
  maxPerRole: number;
  /** Ranks the pieces of a role (higher first) before trimming. */
  rank: (item: OutfitCandidate) => number;
}

export function groupByRole(
  candidates: OutfitCandidate[],
): Map<OutfitRole, OutfitCandidate[]> {
  const byRole = new Map<OutfitRole, OutfitCandidate[]>();
  for (const item of candidates) {
    const role = ROLE_OF[item.category];
    if (!role) continue;
    byRole.set(role, [...(byRole.get(role) ?? []), item]);
  }
  return byRole;
}

/**
 * US6.2: structurally valid silhouettes only —
 * TOP + BOTTOM + SHOES or DRESS + SHOES, each with or without one LAYER.
 * One piece per role: never two tops or two pairs of shoes. An imposed piece
 * takes its role in every silhouette (an imposed bag, jewel or accessory is
 * added to all of them).
 */
export function buildCombinations(
  candidates: OutfitCandidate[],
  imposed: OutfitCandidate | null,
  options: CombinationOptions,
): Outfit[] {
  const byRole = groupByRole(candidates);
  const imposedRole = imposed ? ROLE_OF[imposed.category] : null;

  const pool = (role: OutfitRole): OutfitCandidate[] => {
    if (imposed && imposedRole === role) return [imposed];
    return [...(byRole.get(role) ?? [])]
      .sort((a, b) => options.rank(b) - options.rank(a))
      .slice(0, options.maxPerRole);
  };

  const bases: OutfitPiece[][] = [];
  if (imposedRole !== 'dress') {
    for (const top of pool('top'))
      for (const bottom of pool('bottom'))
        bases.push([
          { role: 'top', item: top },
          { role: 'bottom', item: bottom },
        ]);
  }
  if (imposedRole !== 'top' && imposedRole !== 'bottom') {
    for (const dress of pool('dress'))
      bases.push([{ role: 'dress', item: dress }]);
  }

  const layers: (OutfitCandidate | null)[] =
    imposedRole === 'layer' ? [imposed] : [null, ...pool('layer')];
  const finishing =
    imposed && imposedRole && FINISHING_ROLES.includes(imposedRole)
      ? [{ role: imposedRole, item: imposed }]
      : [];

  const outfits: Outfit[] = [];
  for (const base of bases)
    for (const layer of layers)
      for (const shoes of pool('shoes'))
        outfits.push({
          pieces: [
            ...base,
            ...(layer ? [{ role: 'layer' as const, item: layer }] : []),
            { role: 'shoes', item: shoes },
            ...finishing,
          ],
        });
  return outfits;
}
