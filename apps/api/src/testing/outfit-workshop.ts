// An OutfitWorkshop on in-memory repositories, for the outfit use case tests.
import type { OutfitRole, WardrobeCategory } from '@klotho/shared';

import { OutfitGeneratorService } from '../application/outfits/outfit-generator.service';
import { OutfitWorkshop } from '../application/outfits/outfit.use-cases';
import type { StoredOutfit } from '../domain/outfits/ports/outfit.repository';
import type { WardrobeItem } from '../domain/wardrobe/entities/wardrobe-item.entity';
import { FixedClock } from './fakes';
import { InMemoryOutfitRepository } from './in-memory-outfit.repository';
import { InMemoryStyleProfileRepository } from './in-memory-style-profile.repository';
import { InMemoryWardrobeRepository } from './in-memory-wardrobe.repository';
import { InMemoryFileStorage } from './storage-fakes';

const ROLES: Partial<Record<WardrobeCategory, OutfitRole>> = {
  TOP: 'top',
  BOTTOM: 'bottom',
  DRESS: 'dress',
  LAYER: 'layer',
  SHOES: 'shoes',
  BAG: 'bag',
};

export function outfitWorkshop() {
  const clock = new FixedClock();
  const wardrobe = new InMemoryWardrobeRepository(clock);
  const outfits = new InMemoryOutfitRepository(clock, wardrobe);
  const profiles = new InMemoryStyleProfileRepository(clock);
  const workshop = new OutfitWorkshop(
    wardrobe,
    outfits,
    profiles,
    new OutfitGeneratorService(),
    new InMemoryFileStorage(),
    clock,
  );

  const add = (
    userId: string,
    category: WardrobeCategory,
    fields: Partial<WardrobeItem> = {},
  ) =>
    wardrobe.create(userId, {
      name: null,
      category,
      subcategory: null,
      primaryColor: 'ecru',
      secondaryColors: [],
      pattern: null,
      material: null,
      styles: [],
      seasons: [],
      minTemperature: null,
      maxTemperature: null,
      warmthLevel: null,
      formalityLevel: null,
      brand: null,
      size: null,
      status: 'AVAILABLE',
      ...fields,
    });

  /** Saves a look made of these pieces, each in the role of its category. */
  const save = async (
    userId: string,
    items: WardrobeItem[],
    score = 70,
  ): Promise<StoredOutfit> => {
    const [outfit] = await outfits.createMany(userId, [
      {
        style: null,
        occasion: null,
        temperature: 18,
        condition: null,
        pieces: items.map((item) => ({
          role: ROLES[item.category]!,
          itemId: item.id,
        })),
        score,
        breakdown: {
          weather: 1,
          compatibility: 1,
          style: 0.5,
          occasion: 0.5,
          color: 1,
          preferences: 0.5,
          usage: 0.5,
        },
        variantOf: null,
      },
    ]);
    return outfit!;
  };

  const item = (id: string) => wardrobe.items.find((i) => i.id === id)!;

  return { clock, wardrobe, outfits, profiles, workshop, add, save, item };
}
