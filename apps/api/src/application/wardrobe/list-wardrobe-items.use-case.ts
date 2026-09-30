import type { ListWardrobeQuery, Page, WardrobeItem } from '@klotho/shared';

import type { FileStorage } from '../../domain/storage/ports/file-storage';
import type { WardrobeRepository } from '../../domain/wardrobe/ports/wardrobe.repository';
import { toWardrobeItemDto } from './wardrobe-item.mapper';

export class ListWardrobeItemsUseCase {
  constructor(
    private readonly wardrobe: WardrobeRepository,
    private readonly storage: FileStorage,
  ) {}

  async execute(
    userId: string,
    query: ListWardrobeQuery,
  ): Promise<Page<WardrobeItem>> {
    const { page, pageSize, sort, ...filters } = query;
    const { items, total } = await this.wardrobe.list(userId, {
      filters,
      sort,
      page,
      pageSize,
    });
    return {
      items: await Promise.all(
        items.map((item) => toWardrobeItemDto(item, this.storage)),
      ),
      total,
      page,
      pageSize,
      hasMore: page * pageSize < total,
    };
  }
}
