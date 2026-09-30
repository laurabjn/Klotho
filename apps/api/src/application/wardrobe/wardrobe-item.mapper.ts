import type { WardrobeItem as WardrobeItemDto } from '@klotho/shared';

import type { WardrobeItem } from '../../domain/wardrobe/entities/wardrobe-item.entity';

/** API view of an item: dates as ISO strings, owner id omitted. */
export function toWardrobeItemDto({
  userId: _owner,
  ...item
}: WardrobeItem): WardrobeItemDto {
  return {
    ...item,
    lastWornAt: item.lastWornAt?.toISOString() ?? null,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}
