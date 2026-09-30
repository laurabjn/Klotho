import type { WardrobeItem } from '@klotho/shared';

import type { FileStorage } from '../../../domain/storage/ports/file-storage';
import {
  WardrobeItemNotFoundError,
  WardrobePhotoNotFoundError,
} from '../../../domain/wardrobe/errors';
import type { WardrobePhotoRepository } from '../../../domain/wardrobe/ports/wardrobe-photo.repository';
import type { WardrobeRepository } from '../../../domain/wardrobe/ports/wardrobe.repository';
import { toWardrobeItemDto } from '../wardrobe-item.mapper';

export class SetMainWardrobePhotoUseCase {
  constructor(
    private readonly wardrobe: WardrobeRepository,
    private readonly photos: WardrobePhotoRepository,
    private readonly storage: FileStorage,
  ) {}

  async execute(
    userId: string,
    itemId: string,
    photoId: string,
  ): Promise<WardrobeItem> {
    if (!(await this.wardrobe.findOwned(userId, itemId))) {
      throw new WardrobeItemNotFoundError();
    }
    if (!(await this.photos.find(itemId, photoId))) {
      throw new WardrobePhotoNotFoundError();
    }
    await this.photos.setMain(itemId, photoId);

    const item = await this.wardrobe.findOwned(userId, itemId);
    if (!item) throw new WardrobeItemNotFoundError();
    return toWardrobeItemDto(item, this.storage);
  }
}
