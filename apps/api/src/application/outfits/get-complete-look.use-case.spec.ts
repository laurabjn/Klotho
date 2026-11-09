import { styleProfileSchema } from '@klotho/shared';

import { PremiumRequiredError } from '../../domain/billing/errors';
import { NO_LIMITS } from '../../domain/billing/ports/plan-gate';
import { OutfitNotFoundError } from '../../domain/outfits/errors';
import { outfitWorkshop } from '../../testing/outfit-workshop';
import { GetCompleteLookUseCase } from './outfit.use-cases';

describe('GetCompleteLookUseCase', () => {
  it('suggests a hairstyle and a makeup look for her look', async () => {
    const { workshop, add, save, profiles } = outfitWorkshop();
    const look = await save('laura', [
      await add('laura', 'TOP'),
      await add('laura', 'BOTTOM'),
      await add('laura', 'SHOES'),
    ]);
    await profiles.upsert(
      'laura',
      styleProfileSchema.parse({ makeupPreference: 'none' }),
    );

    const result = await new GetCompleteLookUseCase(workshop).execute(
      'laura',
      look.id,
    );

    expect(result.hairstyles).toHaveLength(2);
    expect(result.makeups).toEqual([]);
  });

  it('is kept for Premium, and for her own looks', async () => {
    const { workshop, add, save } = outfitWorkshop();
    const look = await save('laura', [await add('laura', 'DRESS')]);
    const premiumOnly = new GetCompleteLookUseCase(workshop, {
      ...NO_LIMITS,
      assertPremium: () => Promise.reject(new PremiumRequiredError()),
    });

    await expect(premiumOnly.execute('laura', look.id)).rejects.toBeInstanceOf(
      PremiumRequiredError,
    );
    await expect(
      new GetCompleteLookUseCase(workshop).execute('someone', look.id),
    ).rejects.toBeInstanceOf(OutfitNotFoundError);
  });
});
