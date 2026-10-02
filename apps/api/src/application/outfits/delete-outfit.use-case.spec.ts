import {
  OutfitNotFoundError,
  OutfitWornError,
} from '../../domain/outfits/errors';
import { InMemoryOutfitPlanRepository } from '../../testing/in-memory-planning.repositories';
import { outfitWorkshop } from '../../testing/outfit-workshop';
import { DeleteOutfitUseCase } from './outfit.use-cases';

describe('DeleteOutfitUseCase', () => {
  let t: ReturnType<typeof outfitWorkshop>;
  let remove: DeleteOutfitUseCase;
  let lookId: string;

  beforeEach(async () => {
    t = outfitWorkshop();
    remove = new DeleteOutfitUseCase(t.workshop);
    const dress = await t.add('laura', 'DRESS');
    const shoes = await t.add('laura', 'SHOES');
    lookId = (await t.save('laura', [dress, shoes])).id;
  });

  it('removes the look, its opinion and its plans', async () => {
    const plans = new InMemoryOutfitPlanRepository(t.outfits);
    await plans.save('laura', {
      day: '2026-10-02',
      outfitId: lookId,
      forecast: null,
    });
    await t.outfits.saveFeedback('laura', lookId, {
      rating: 'like',
      reasons: [],
      note: null,
    });

    await remove.execute('laura', lookId);

    expect(t.outfits.outfits).toHaveLength(0);
    expect(t.outfits.feedbacks.size).toBe(0);
    expect(plans.plans).toHaveLength(0);
  });

  it('keeps a look worn at least once', async () => {
    await t.outfits.markWorn('laura', lookId, '2026-09-30');

    await expect(remove.execute('laura', lookId)).rejects.toBeInstanceOf(
      OutfitWornError,
    );
    expect(t.outfits.outfits).toHaveLength(1);
  });

  it("cannot remove another user's look", async () => {
    await expect(remove.execute('other', lookId)).rejects.toBeInstanceOf(
      OutfitNotFoundError,
    );
    expect(t.outfits.outfits).toHaveLength(1);
  });
});
