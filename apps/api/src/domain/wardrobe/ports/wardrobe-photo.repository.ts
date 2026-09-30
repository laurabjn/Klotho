import type { WardrobePhoto } from '../entities/wardrobe-item.entity';

export type NewWardrobePhoto = Pick<
  WardrobePhoto,
  'itemId' | 'storageKey' | 'width' | 'height'
>;

/** Callers check the item's ownership first (through WardrobeRepository). */
export interface WardrobePhotoRepository {
  /**
   * Appends a photo after the existing ones; it becomes the main photo if it
   * is the first. Atomic, so concurrent additions cannot exceed `max`.
   * Returns null when the item already has `max` photos.
   */
  add(photo: NewWardrobePhoto, max: number): Promise<WardrobePhoto | null>;
  find(itemId: string, photoId: string): Promise<WardrobePhoto | null>;
  /** Deletes the photo and, if it was the main one, promotes the next one. */
  remove(itemId: string, photoId: string): Promise<void>;
  setMain(itemId: string, photoId: string): Promise<void>;
}

export const WARDROBE_PHOTO_REPOSITORY = Symbol('WardrobePhotoRepository');
