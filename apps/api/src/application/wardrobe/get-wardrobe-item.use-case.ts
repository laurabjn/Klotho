import type { WardrobeItem } from '@klotho/shared';

import type { FileStorage } from '../../domain/storage/ports/file-storage';
import { WardrobeItemNotFoundError } from '../../domain/wardrobe/errors';
import type { WardrobeRepository } from '../../domain/wardrobe/ports/wardrobe.repository';
import { toWardrobeItemDto } from './wardrobe-item.mapper';

export class GetWardrobeItemUseCase {
  constructor(
    private readonly wardrobe: WardrobeRepository,
    private readonly storage: FileStorage,
  ) {}

  async execute(userId: string, id: string): Promise<WardrobeItem> {
    const item = await this.wardrobe.findOwned(userId, id);
    if (!item) throw new WardrobeItemNotFoundError();
    return toWardrobeItemDto(item, this.storage);
  }
}
