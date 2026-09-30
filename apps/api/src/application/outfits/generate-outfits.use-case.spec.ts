import { styleProfileSchema } from '@klotho/shared';

import { FixedClock } from '../../testing/fakes';
import { InMemoryStyleProfileRepository } from '../../testing/in-memory-style-profile.repository';
import { InMemoryWardrobeRepository } from '../../testing/in-memory-wardrobe.repository';
import { GenerateOutfitsUseCase } from './generate-outfits.use-case';
import { OutfitGeneratorService } from './outfit-generator.service';

describe('GenerateOutfitsUseCase', () => {
  let wardrobe: InMemoryWardrobeRepository;
  let profiles: InMemoryStyleProfileRepository;
  let generate: GenerateOutfitsUseCase;

  const add = (userId: string, fields: Record<string, unknown>) =>
    wardrobe.create(userId, {
      name: null,
      subcategory: null,
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
    } as never);

  beforeEach(async () => {
    const clock = new FixedClock();
    wardrobe = new InMemoryWardrobeRepository(clock);
    profiles = new InMemoryStyleProfileRepository(clock);
    generate = new GenerateOutfitsUseCase(
      wardrobe,
      profiles,
      new OutfitGeneratorService(),
      clock,
    );
    await add('laura', { category: 'TOP', primaryColor: 'white' });
    await add('laura', { category: 'BOTTOM', primaryColor: 'denim' });
    await add('laura', { category: 'SHOES', primaryColor: 'black' });
    await add('other', { category: 'DRESS', primaryColor: 'red' });
    await add('other', { category: 'SHOES', primaryColor: 'red' });
  });

  it("builds looks from the user's own wardrobe only", async () => {
    const [outfit, ...rest] = await generate.execute('laura', {
      style: null,
      occasion: 'everyday',
      temperature: 20,
    });
    const mine = (await wardrobe.findAllOwned('laura')).map((i) => i.id);

    expect(rest).toEqual([]);
    expect(outfit!.pieces.map((p) => p.itemId).sort()).toEqual(
      [...mine].sort(),
    );
  });

  it('uses the style profile of the user', async () => {
    await profiles.upsert(
      'laura',
      styleProfileSchema.parse({ avoidedColors: ['denim'] }),
    );

    const [outfit] = await generate.execute('laura', {
      style: null,
      occasion: null,
      temperature: 20,
    });

    expect(outfit!.breakdown.preferences).toBeLessThan(0.5);
  });
});
