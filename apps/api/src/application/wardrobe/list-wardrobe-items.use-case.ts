import type { ListWardrobeQuery, Page, WardrobeItem } from '@klotho/shared';

import type { WardrobeRepository } from '../../domain/wardrobe/ports/wardrobe.repository';
import { toWardrobeItemDto } from './wardrobe-item.mapper';

export class ListWardrobeItemsUseCase {
  constructor(private readonly wardrobe: WardrobeRepository) {}

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
      items: items.map(toWardrobeItemDto),
      total,
      page,
      pageSize,
      hasMore: page * pageSize < total,
    };
  }
}
