/**
 * Notifies the user of what just happened. Respects her settings and never
 * rejects: a failure must not fail the action that triggered it.
 */
export interface Notifier {
  /** POST /outfits/generate: `outfitId` is the best look. */
  outfitsGenerated(
    userId: string,
    data: { count: number; outfitId: string },
  ): Promise<void>;
  /** POST /plans/week: `outfitId` is the look of the first planned day. */
  weekPlanned(
    userId: string,
    data: { count: number; outfitId: string },
  ): Promise<void>;
  /** A favourite piece is available again. */
  pieceAvailable(
    userId: string,
    data: { itemId: string; itemName: string | null },
  ): Promise<void>;
}

export const NOTIFIER = Symbol('Notifier');
