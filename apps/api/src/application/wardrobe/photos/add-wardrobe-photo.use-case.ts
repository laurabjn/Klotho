import type { WardrobeItem } from '@klotho/shared';

import { UploadNotFoundError } from '../../../domain/storage/errors';
import type { FileStorage } from '../../../domain/storage/ports/file-storage';
import { parseUploadKey } from '../../../domain/storage/upload-key';
import {
  PhotoLimitReachedError,
  WardrobeItemNotFoundError,
} from '../../../domain/wardrobe/errors';
import type { WardrobePhotoRepository } from '../../../domain/wardrobe/ports/wardrobe-photo.repository';
import type { WardrobeRepository } from '../../../domain/wardrobe/ports/wardrobe.repository';
import { toWardrobeItemDto } from '../wardrobe-item.mapper';
import type { PhotoSettings } from './photo-settings';

export class AddWardrobePhotoUseCase {
  constructor(
    private readonly wardrobe: WardrobeRepository,
    private readonly photos: WardrobePhotoRepository,
    private readonly storage: FileStorage,
    private readonly settings: PhotoSettings,
  ) {}

  async execute(
    userId: string,
    itemId: string,
    key: string,
  ): Promise<WardrobeItem> {
    if (!(await this.wardrobe.findOwned(userId, itemId))) {
      throw new WardrobeItemNotFoundError();
    }
    // Only an upload of this very user can be attached.
    const size = parseUploadKey(key, userId);
    if (!size || !(await this.storage.exists(key))) {
      throw new UploadNotFoundError();
    }

    const added = await this.photos.add(
      { itemId, storageKey: key, ...size },
      this.settings.maxPerItem,
    );
    if (!added) throw new PhotoLimitReachedError();

    const item = await this.wardrobe.findOwned(userId, itemId);
    if (!item) throw new WardrobeItemNotFoundError();
    return toWardrobeItemDto(item, this.storage);
  }
}
