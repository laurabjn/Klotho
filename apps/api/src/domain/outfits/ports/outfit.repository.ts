import type {
  DislikeReason,
  Occasion,
  OutfitListFilter,
  OutfitRating,
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

export interface OutfitFeedbackFields {
  rating: OutfitRating;
  /** Empty for a like. */
  reasons: DislikeReason[];
  note: string | null;
}

export interface StoredOutfitFeedback extends OutfitFeedbackFields {
  updatedAt: Date;
}

export interface StoredOutfit extends NewOutfit {
  id: string;
  userId: string;
  createdAt: Date;
  isFavorite: boolean;
  favoritedAt: Date | null;
  feedback: StoredOutfitFeedback | null;
  /** Last day it was worn (YYYY-MM-DD). */
  lastWornOn: string | null;
}

/** A day a look was worn. Days are YYYY-MM-DD, in the user's calendar. */
export interface OutfitWearRecord {
  id: string;
  userId: string;
  outfitId: string;
  wornOn: string;
  createdAt: Date;
}

export interface OutfitListQuery {
  filter: OutfitListFilter;
  page: number;
  pageSize: number;
}

export interface OutfitHistoryQuery {
  /** Inclusive days (YYYY-MM-DD). */
  from?: string;
  to?: string;
  page: number;
  pageSize: number;
}

/** A look the user gave her opinion on, with its current pieces. */
export interface RatedOutfit {
  rating: OutfitRating;
  pieces: OutfitPieceRef[];
}

/** Every method is scoped to an owner: another user's look is a missing one. */
export interface OutfitRepository {
  /** Saves the looks in the given order, in one transaction. */
  createMany(userId: string, outfits: NewOutfit[]): Promise<StoredOutfit[]>;
  findOwned(userId: string, id: string): Promise<StoredOutfit | null>;
  findManyOwned(userId: string, ids: string[]): Promise<StoredOutfit[]>;
  /**
   * generated: most recent first; favorites: last favourited first; worn:
   * looks worn at least once, last worn first.
   */
  list(
    userId: string,
    query: OutfitListQuery,
  ): Promise<{ items: StoredOutfit[]; total: number }>;
  /** Replaces the pieces and the score of a look; null if it is not the user's. */
  updatePieces(
    userId: string,
    id: string,
    changes: Pick<NewOutfit, 'pieces' | 'score' | 'breakdown'>,
  ): Promise<StoredOutfit | null>;
  /** Idempotent: favouriting again keeps the first date. */
  setFavorite(
    userId: string,
    id: string,
    favorite: boolean,
  ): Promise<StoredOutfit | null>;
  /** One opinion per look: replaces the previous one. */
  saveFeedback(
    userId: string,
    id: string,
    feedback: OutfitFeedbackFields,
  ): Promise<StoredOutfit | null>;
  clearFeedback(userId: string, id: string): Promise<StoredOutfit | null>;
  /** Every look the user liked or disliked (feeds the engine). */
  listRated(userId: string): Promise<RatedOutfit[]>;
  /**
   * Once per look and day: an existing wear of that day is returned as is.
   * Otherwise, in one transaction, saves it and updates the usage of every
   * piece (wear count, last worn date). Null if the look is not the user's.
   */
  markWorn(
    userId: string,
    id: string,
    wornOn: string,
  ): Promise<OutfitWearRecord | null>;
  /** Last worn first. */
  listWears(
    userId: string,
    query: OutfitHistoryQuery,
  ): Promise<{ items: OutfitWearRecord[]; total: number }>;
  /**
   * Undoes a wear and the usage it added, in one transaction. False if it
   * does not exist or is someone else's.
   */
  deleteWear(userId: string, wearId: string): Promise<boolean>;
  /**
   * Deletes a look never worn, with its plans and its opinion, in one
   * transaction. 'worn' keeps it.
   */
  delete(userId: string, id: string): Promise<'deleted' | 'notFound' | 'worn'>;
}

export const OUTFIT_REPOSITORY = Symbol('OutfitRepository');

/** A worn day counts from noon UTC, so that it stays that day everywhere. */
export const wornAtOf = (day: string): Date => new Date(`${day}T12:00:00.000Z`);
