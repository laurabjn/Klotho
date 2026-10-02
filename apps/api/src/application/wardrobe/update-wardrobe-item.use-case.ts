import type { UpdateWardrobeItem, WardrobeItem } from '@klotho/shared';

import {
  hasValidTemperatureRange,
  type WardrobeItemChanges,
} from '../../domain/wardrobe/entities/wardrobe-item.entity';
import {
  InvalidTemperatureRangeError,
  WardrobeItemNotFoundError,
} from '../../domain/wardrobe/errors';
import type { Notifier } from '../../domain/notifications/ports/notifier';
import type { FileStorage } from '../../domain/storage/ports/file-storage';
import type { WardrobeRepository } from '../../domain/wardrobe/ports/wardrobe.repository';
import { toWardrobeItemDto } from './wardrobe-item.mapper';

/**
 * Partial update (PATCH): omitted fields are left untouched. A favourite
 * piece back to AVAILABLE (from the wash, lent…) is notified.
 */
export class UpdateWardrobeItemUseCase {
  constructor(
    private readonly wardrobe: WardrobeRepository,
    private readonly storage: FileStorage,
    private readonly notifier: Notifier,
  ) {}

  async execute(
    userId: string,
    id: string,
    input: UpdateWardrobeItem,
  ): Promise<WardrobeItem> {
    const current = await this.wardrobe.findOwned(userId, id);
    if (!current) throw new WardrobeItemNotFoundError();

    const changes = Object.fromEntries(
      Object.entries(input).filter(([, value]) => value !== undefined),
    ) as WardrobeItemChanges;

    // The schema checks a range given in one request; this checks it against stored values.
    if (!hasValidTemperatureRange({ ...current, ...changes })) {
      throw new InvalidTemperatureRangeError();
    }

    const updated = await this.wardrobe.updateOwned(userId, id, changes);
    if (!updated) throw new WardrobeItemNotFoundError();
    if (
      updated.isFavorite &&
      current.status !== 'AVAILABLE' &&
      updated.status === 'AVAILABLE'
    )
      await this.notifier.pieceAvailable(userId, {
        itemId: updated.id,
        itemName: updated.name,
      });
    return toWardrobeItemDto(updated, this.storage);
  }
}
