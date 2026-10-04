import type { CreateWardrobeItem, WardrobeItem } from '@klotho/shared';

import { NO_LIMITS, type PlanGate } from '../../domain/billing/ports/plan-gate';
import type { FileStorage } from '../../domain/storage/ports/file-storage';
import type { WardrobeRepository } from '../../domain/wardrobe/ports/wardrobe.repository';
import { toWardrobeItemDto } from './wardrobe-item.mapper';

export class CreateWardrobeItemUseCase {
  constructor(
    private readonly wardrobe: WardrobeRepository,
    private readonly storage: FileStorage,
    private readonly plans: PlanGate = NO_LIMITS,
  ) {}

  /** The owner is always the authenticated user, never taken from the body. */
  async execute(
    userId: string,
    input: CreateWardrobeItem,
  ): Promise<WardrobeItem> {
    await this.plans.assertCanAddPiece(userId);
    const item = await this.wardrobe.create(userId, {
      name: input.name ?? null,
      category: input.category,
      subcategory: input.subcategory ?? null,
      primaryColor: input.primaryColor,
      secondaryColors: input.secondaryColors,
      pattern: input.pattern ?? null,
      material: input.material ?? null,
      styles: input.styles,
      seasons: input.seasons,
      minTemperature: input.minTemperature ?? null,
      maxTemperature: input.maxTemperature ?? null,
      warmthLevel: input.warmthLevel ?? null,
      formalityLevel: input.formalityLevel ?? null,
      brand: input.brand ?? null,
      size: input.size ?? null,
      status: input.status,
    });
    return toWardrobeItemDto(item, this.storage);
  }
}
