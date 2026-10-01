import type { ListOutfitsQuery, Outfit, Page } from '@klotho/shared';

import type { OutfitWorkshop } from './outfit.use-cases';

/**
 * "Mes tenues": the generated looks (the home "Tenue du jour" is the first
 * one), the favourites, or the looks already worn.
 */
export class ListOutfitsUseCase {
  constructor(private readonly workshop: OutfitWorkshop) {}

  async execute(
    userId: string,
    query: ListOutfitsQuery,
  ): Promise<Page<Outfit>> {
    const { page, pageSize } = query;
    const [{ items: outfits, total }, items] = await Promise.all([
      this.workshop.outfits.list(userId, query),
      this.workshop.wardrobe.findAllOwned(userId),
    ]);
    return {
      items: await this.workshop.present(outfits, items),
      total,
      page,
      pageSize,
      hasMore: page * pageSize < total,
    };
  }
}
