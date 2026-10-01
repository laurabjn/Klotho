import type { BottomPreference, Metal } from '@klotho/shared';

import {
  mainPieces,
  type Outfit,
  type OutfitContext,
  type OutfitFeedbackSignals,
} from '../entities/outfit-candidate';

const METAL_COLORS: Partial<Record<string, Metal>> = {
  gold: 'gold',
  silver: 'silver',
};

const clamp = (value: number) => Math.min(1, Math.max(0, value));

/** Per pair of main pieces worn together in a liked look. */
export const LIKED_PAIR_BONUS = 0.05;
/** Per pair found in a disliked look: a dislike weighs more than a like. */
export const DISLIKED_PAIR_PENALTY = 0.1;
/** Per favourite piece in the look. */
export const FAVORITE_PIECE_BONUS = 0.05;

const pairKey = (a: string, b: string) => (a < b ? `${a}|${b}` : `${b}|${a}`);

function pairsOf(ids: string[]): string[] {
  const pairs: string[] = [];
  for (let i = 0; i < ids.length; i += 1)
    for (let j = i + 1; j < ids.length; j += 1)
      pairs.push(pairKey(ids[i]!, ids[j]!));
  return pairs;
}

interface FeedbackIndex {
  liked: Set<string>;
  disliked: Set<string>;
  favorites: Set<string>;
}

// Built once per generation (thousands of looks share the same signals).
const indexes = new WeakMap<OutfitFeedbackSignals, FeedbackIndex>();

function indexOf(feedback: OutfitFeedbackSignals): FeedbackIndex {
  let index = indexes.get(feedback);
  if (!index) {
    index = {
      liked: new Set(feedback.liked.flatMap(pairsOf)),
      disliked: new Set(feedback.disliked.flatMap(pairsOf)),
      favorites: new Set(feedback.favoriteItemIds),
    };
    indexes.set(feedback, index);
  }
  return index;
}

/**
 * US8.1: pieces already liked together pull a look up, pieces disliked
 * together push it down, favourite pieces give a small bonus.
 */
function feedbackAdjustment(
  outfit: Outfit,
  feedback: OutfitFeedbackSignals | undefined,
): number {
  if (!feedback) return 0;
  const index = indexOf(feedback);
  let adjustment = 0;
  for (const pair of pairsOf(mainPieces(outfit).map((p) => p.item.id))) {
    if (index.liked.has(pair)) adjustment += LIKED_PAIR_BONUS;
    if (index.disliked.has(pair)) adjustment -= DISLIKED_PAIR_PENALTY;
  }
  for (const { item } of outfit.pieces)
    if (index.favorites.has(item.id)) adjustment += FAVORITE_PIECE_BONUS;
  return adjustment;
}

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
 * jewellery metal; then her opinions of past looks and favourite pieces.
 * Starts neutral at 0.5.
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

  return clamp(score + feedbackAdjustment(outfit, context.feedback));
}
