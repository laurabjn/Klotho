import type {
  Occasion,
  OutfitRole,
  Style,
  WeatherCondition,
} from '@klotho/shared';

import type { ScoreBreakdown } from '../scoring/outfit-score';

export interface OutfitPieceRef {
  role: OutfitRole;
  itemId: string;
}

/** The conditions the look was made for. */
export interface OutfitConditions {
  style: Style | null;
  occasion: Occasion | null;
  temperature: number | null;
  condition: WeatherCondition | null;
}

export interface NewOutfit extends OutfitConditions {
  pieces: OutfitPieceRef[];
  score: number;
  breakdown: ScoreBreakdown;
  variantOf: string | null;
}

export interface StoredOutfit extends NewOutfit {
  id: string;
  userId: string;
  createdAt: Date;
}

/** Every method is scoped to an owner: another user's look is a missing one. */
export interface OutfitRepository {
  /** Saves the looks in the given order, in one transaction. */
  createMany(userId: string, outfits: NewOutfit[]): Promise<StoredOutfit[]>;
  findOwned(userId: string, id: string): Promise<StoredOutfit | null>;
  findManyOwned(userId: string, ids: string[]): Promise<StoredOutfit[]>;
  /** Most recent first. */
  listRecent(userId: string, limit: number): Promise<StoredOutfit[]>;
  /** Replaces the pieces and the score of a look; null if it is not the user's. */
  updatePieces(
    userId: string,
    id: string,
    changes: Pick<NewOutfit, 'pieces' | 'score' | 'breakdown'>,
  ): Promise<StoredOutfit | null>;
}

export const OUTFIT_REPOSITORY = Symbol('OutfitRepository');
