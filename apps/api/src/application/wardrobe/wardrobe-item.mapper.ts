import type { WardrobeItem as WardrobeItemDto } from '@klotho/shared';

import type { FileStorage } from '../../domain/storage/ports/file-storage';
import type { WardrobeItem } from '../../domain/wardrobe/entities/wardrobe-item.entity';

/**
 * API view of an item: dates as ISO strings, owner id and storage keys
 * omitted, photos exposed through short-lived signed URLs.
 */
export async function toWardrobeItemDto(
  { userId: _owner, photos, ...item }: WardrobeItem,
  storage: Pick<FileStorage, 'signedUrl'>,
): Promise<WardrobeItemDto> {
  return {
    ...item,
    photos: await Promise.all(
      photos.map(async (photo) => ({
        id: photo.id,
        url: await storage.signedUrl(photo.storageKey),
        width: photo.width,
        height: photo.height,
        isMain: photo.isMain,
      })),
    ),
    lastWornAt: item.lastWornAt?.toISOString() ?? null,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}
