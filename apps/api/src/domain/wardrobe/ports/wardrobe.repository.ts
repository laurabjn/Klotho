import type {
  WardrobeItem,
  WardrobeItemChanges,
  WardrobeItemFields,
  WardrobeListQuery,
} from '../entities/wardrobe-item.entity';

/**
 * Every method is scoped to an owner: an item of another user behaves
 * exactly like a missing one.
 */
export interface WardrobeRepository {
  create(userId: string, fields: WardrobeItemFields): Promise<WardrobeItem>;
  findOwned(userId: string, id: string): Promise<WardrobeItem | null>;
  /** The whole wardrobe of a user, whatever the status (outfit engine). */
  findAllOwned(userId: string): Promise<WardrobeItem[]>;
  list(
    userId: string,
    query: WardrobeListQuery,
  ): Promise<{ items: WardrobeItem[]; total: number }>;
  /** Returns null when the item does not exist or belongs to someone else. */
  updateOwned(
    userId: string,
    id: string,
    changes: WardrobeItemChanges,
  ): Promise<WardrobeItem | null>;
  /** Returns false when the item does not exist or belongs to someone else. */
  deleteOwned(userId: string, id: string): Promise<boolean>;
}

export const WARDROBE_REPOSITORY = Symbol('WardrobeRepository');
