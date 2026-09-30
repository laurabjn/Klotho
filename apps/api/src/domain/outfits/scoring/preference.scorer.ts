import type { BottomPreference, Metal } from '@klotho/shared';

import type { Outfit, OutfitContext } from '../entities/outfit-candidate';

const METAL_COLORS: Partial<Record<string, Metal>> = {
  gold: 'gold',
  silver: 'silver',
};

const clamp = (value: number) => Math.min(1, Math.max(0, value));

/** Which of "skirts / dresses / trousers" the look's base is. */
function baseKind(outfit: Outfit): BottomPreference | null {
  if (outfit.pieces.some((piece) => piece.role === 'dress')) return 'dresses';
  const bottom = outfit.pieces.find((piece) => piece.role === 'bottom');
  if (!bottom) return null;
  return bottom.item.subcategory?.endsWith('Skirt') ? 'skirts' : 'trousers';
}

/**
 * The user's explicit tastes (style profile): favourite and avoided
 * colours, colours near the face, heels, skirts / dresses / trousers,
 * jewellery metal. Starts neutral at 0.5.
 */
export function scorePreference(
  outfit: Outfit,
  context: OutfitContext,
): number {
  const { profile } = context;
  let score = 0.5;

  for (const { role, item } of outfit.pieces) {
    const itemColors = [item.primaryColor, ...item.secondaryColors];
    if (itemColors.some((color) => profile.preferredColors.includes(color)))
      score += 0.1;
    if (itemColors.some((color) => profile.avoidedColors.includes(color)))
      score -= 0.25;
    if (
      (role === 'top' || role === 'dress') &&
      profile.facePreferredColors.includes(item.primaryColor)
    )
      score += 0.1;
    if (profile.acceptsHeels === false && item.subcategory === 'pumps')
      score -= 0.3;
    const metal = METAL_COLORS[item.primaryColor];
    if (role === 'jewelry' && metal && profile.preferredMetals.length > 0)
      score += profile.preferredMetals.includes(metal) ? 0.1 : -0.1;
  }

  const kind = baseKind(outfit);
  if (kind && profile.preferredBottoms.length > 0)
    score += profile.preferredBottoms.includes(kind) ? 0.15 : -0.1;

  return clamp(score);
}
