import type { WardrobeItem } from '@klotho/shared';

import type { FileStorage } from '../../domain/storage/ports/file-storage';
import { WardrobeItemNotFoundError } from '../../domain/wardrobe/errors';
import type { WardrobeRepository } from '../../domain/wardrobe/ports/wardrobe.repository';
import { toWardrobeItemDto } from './wardrobe-item.mapper';

/** "Mes pièces favorites": adds or removes a piece; idempotent. */
export class SetWardrobeFavoriteUseCase {
  constructor(
    private readonly wardrobe: WardrobeRepository,
    private readonly storage: FileStorage,
  ) {}

  async execute(
    userId: string,
    id: string,
    favorite: boolean,
  ): Promise<WardrobeItem> {
    const item = await this.wardrobe.findOwned(userId, id);
    if (!item) throw new WardrobeItemNotFoundError();
    // Nothing to change: the item (and its updatedAt) stays as it is.
    const updated =
      item.isFavorite === favorite
        ? item
        : await this.wardrobe.setFavorite(userId, id, favorite);
    if (!updated) throw new WardrobeItemNotFoundError();
    return toWardrobeItemDto(updated, this.storage);
  }
}
