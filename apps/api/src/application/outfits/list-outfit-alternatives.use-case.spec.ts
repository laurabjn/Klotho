import { OUTFIT_ALTERNATIVES_MAX } from '@klotho/shared';

import { outfitWorkshop } from '../../testing/outfit-workshop';
import { ListOutfitAlternativesUseCase } from './outfit.use-cases';

describe('ListOutfitAlternativesUseCase', () => {
  it('returns at most OUTFIT_ALTERNATIVES_MAX pieces, never the current one', async () => {
    const { workshop, add, save } = outfitWorkshop();
    const top = await add('laura', 'TOP');
    const bottom = await add('laura', 'BOTTOM');
    const shoes = await add('laura', 'SHOES');
    for (let i = 0; i < OUTFIT_ALTERNATIVES_MAX + 10; i++) {
      await add('laura', 'TOP');
    }
    const look = await save('laura', [top, bottom, shoes]);

    const alternatives = await new ListOutfitAlternativesUseCase(
      workshop,
    ).execute('laura', look.id, 'top');

    expect(alternatives).toHaveLength(OUTFIT_ALTERNATIVES_MAX);
    expect(alternatives.map((a) => a.item.id)).not.toContain(top.id);
    expect(alternatives.every((a) => a.item.category === 'TOP')).toBe(true);
  });
});
