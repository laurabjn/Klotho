import type { Outfit } from '@klotho/shared';

import { OutfitNotFoundError } from '../../domain/outfits/errors';
import type { OutfitWorkshop } from './outfit.use-cases';

/** Adds a look to the favourites or removes it; idempotent. */
export class ToggleOutfitFavoriteUseCase {
  constructor(private readonly workshop: OutfitWorkshop) {}

  async execute(
    userId: string,
    id: string,
    favorite: boolean,
  ): Promise<Outfit> {
    const outfit = await this.workshop.outfits.setFavorite(
      userId,
      id,
      favorite,
    );
    if (!outfit) throw new OutfitNotFoundError();
    return this.workshop.presentOne(userId, outfit);
  }
}
