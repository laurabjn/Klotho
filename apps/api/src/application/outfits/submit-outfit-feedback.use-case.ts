import type { Outfit, OutfitFeedbackRequest } from '@klotho/shared';

import { OutfitNotFoundError } from '../../domain/outfits/errors';
import type { OutfitWorkshop } from './outfit.use-cases';

/**
 * US8.1: "J'aime / Je n'aime pas". One opinion per look, the last one wins;
 * the next looks take it into account and a disliked look never comes back.
 */
export class SubmitOutfitFeedbackUseCase {
  constructor(private readonly workshop: OutfitWorkshop) {}

  async execute(
    userId: string,
    id: string,
    request: OutfitFeedbackRequest,
  ): Promise<Outfit> {
    const outfit = await this.workshop.outfits.saveFeedback(userId, id, {
      rating: request.rating,
      // Reasons explain a dislike only.
      reasons: request.rating === 'dislike' ? request.reasons : [],
      note: request.note,
    });
    if (!outfit) throw new OutfitNotFoundError();
    return this.workshop.presentOne(userId, outfit);
  }
}

/** Withdraws the opinion; idempotent. */
export class ClearOutfitFeedbackUseCase {
  constructor(private readonly workshop: OutfitWorkshop) {}

  async execute(userId: string, id: string): Promise<Outfit> {
    const outfit = await this.workshop.outfits.clearFeedback(userId, id);
    if (!outfit) throw new OutfitNotFoundError();
    return this.workshop.presentOne(userId, outfit);
  }
}
