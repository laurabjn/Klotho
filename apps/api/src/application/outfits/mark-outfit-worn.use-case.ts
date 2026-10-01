import type { OutfitHistoryQuery, OutfitWear, Page } from '@klotho/shared';

import {
  OutfitNotFoundError,
  OutfitWearNotFoundError,
} from '../../domain/outfits/errors';
import type { OutfitWorkshop } from './outfit.use-cases';

/**
 * "Marquer comme portée": once per look and day. Every piece of the look
 * counts one more wear and remembers the day.
 */
export class MarkOutfitWornUseCase {
  constructor(private readonly workshop: OutfitWorkshop) {}

  async execute(
    userId: string,
    id: string,
    wornOn: string,
  ): Promise<OutfitWear> {
    const wear = await this.workshop.outfits.markWorn(userId, id, wornOn);
    if (!wear) throw new OutfitNotFoundError();
    const [dto] = await this.workshop.presentWears(userId, [wear]);
    return dto!;
  }
}

/** "Historique de mes tenues" and the calendar: last worn first. */
export class ListOutfitHistoryUseCase {
  constructor(private readonly workshop: OutfitWorkshop) {}

  async execute(
    userId: string,
    query: OutfitHistoryQuery,
  ): Promise<Page<OutfitWear>> {
    const { page, pageSize } = query;
    const { items, total } = await this.workshop.outfits.listWears(
      userId,
      query,
    );
    return {
      items: await this.workshop.presentWears(userId, items),
      total,
      page,
      pageSize,
      hasMore: page * pageSize < total,
    };
  }
}

/** Undoes a wear by mistake, and the usage it added to the pieces. */
export class DeleteOutfitWearUseCase {
  constructor(private readonly workshop: OutfitWorkshop) {}

  async execute(userId: string, wearId: string): Promise<void> {
    if (!(await this.workshop.outfits.deleteWear(userId, wearId)))
      throw new OutfitWearNotFoundError();
  }
}
