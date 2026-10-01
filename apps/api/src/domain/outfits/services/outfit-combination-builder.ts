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
 * One piece per role: never two tops or two pairs of shoes. Imposed pieces
 * take their role in every silhouette (an imposed bag, jewel or accessory is
 * added to all of them); a second imposed piece of the same role is ignored.
 */
export function buildCombinations(
  candidates: OutfitCandidate[],
  imposed: OutfitCandidate[],
  options: CombinationOptions,
): Outfit[] {
  const byRole = groupByRole(candidates);
  const imposedByRole = new Map<OutfitRole, OutfitCandidate>();
  for (const item of imposed) {
    const role = ROLE_OF[item.category];
    if (role && !imposedByRole.has(role)) imposedByRole.set(role, item);
  }

  const pool = (role: OutfitRole): OutfitCandidate[] => {
    const forced = imposedByRole.get(role);
    if (forced) return [forced];
    return [...(byRole.get(role) ?? [])]
      .sort((a, b) => options.rank(b) - options.rank(a))
      .slice(0, options.maxPerRole);
  };

  const bases: OutfitPiece[][] = [];
  if (!imposedByRole.has('dress')) {
    for (const top of pool('top'))
      for (const bottom of pool('bottom'))
        bases.push([
          { role: 'top', item: top },
          { role: 'bottom', item: bottom },
        ]);
  }
  if (!imposedByRole.has('top') && !imposedByRole.has('bottom')) {
    for (const dress of pool('dress'))
      bases.push([{ role: 'dress', item: dress }]);
  }

  const imposedLayer = imposedByRole.get('layer');
  const layers: (OutfitCandidate | null)[] = imposedLayer
    ? [imposedLayer]
    : [null, ...pool('layer')];
  const finishing: OutfitPiece[] = FINISHING_ROLES.flatMap((role) => {
    const item = imposedByRole.get(role);
    return item ? [{ role, item }] : [];
  });

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
