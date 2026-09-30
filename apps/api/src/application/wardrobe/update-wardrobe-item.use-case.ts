import type { UpdateWardrobeItem, WardrobeItem } from '@klotho/shared';

import {
  hasValidTemperatureRange,
  type WardrobeItemChanges,
} from '../../domain/wardrobe/entities/wardrobe-item.entity';
import {
  InvalidTemperatureRangeError,
  WardrobeItemNotFoundError,
} from '../../domain/wardrobe/errors';
import type { WardrobeRepository } from '../../domain/wardrobe/ports/wardrobe.repository';
import { toWardrobeItemDto } from './wardrobe-item.mapper';

/** Partial update (PATCH): omitted fields are left untouched. */
export class UpdateWardrobeItemUseCase {
  constructor(private readonly wardrobe: WardrobeRepository) {}

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
    return toWardrobeItemDto(updated);
  }
}
