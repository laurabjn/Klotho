import { OutfitNotFoundError } from '../../domain/outfits/errors';
import { MINUTE } from '../../testing/fakes';
import { outfitWorkshop } from '../../testing/outfit-workshop';
import { ToggleOutfitFavoriteUseCase } from './toggle-outfit-favorite.use-case';

describe('ToggleOutfitFavoriteUseCase', () => {
  let t: ReturnType<typeof outfitWorkshop>;
  let toggle: ToggleOutfitFavoriteUseCase;
  let outfitId: string;

  beforeEach(async () => {
    t = outfitWorkshop();
    toggle = new ToggleOutfitFavoriteUseCase(t.workshop);
    ({ id: outfitId } = await t.save('laura', [
      await t.add('laura', 'DRESS'),
      await t.add('laura', 'SHOES'),
    ]));
  });

  it('adds and removes a favourite, idempotently', async () => {
    await expect(
      toggle.execute('laura', outfitId, true),
    ).resolves.toMatchObject({ id: outfitId, isFavorite: true });
    const since = t.outfits.outfits[0]!.favoritedAt;
    t.clock.advance(MINUTE);
    await toggle.execute('laura', outfitId, true);

    // Favouriting again keeps the first date (the "Favoris" order).
    expect(t.outfits.outfits[0]!.favoritedAt).toEqual(since);

    await expect(
      toggle.execute('laura', outfitId, false),
    ).resolves.toMatchObject({ isFavorite: false });
    await expect(
      toggle.execute('laura', outfitId, false),
    ).resolves.toMatchObject({ isFavorite: false });
    expect(t.outfits.outfits[0]!.favoritedAt).toBeNull();
  });

  it("cannot touch another user's look", async () => {
    await expect(
      toggle.execute('other', outfitId, true),
    ).rejects.toBeInstanceOf(OutfitNotFoundError);
    expect(t.outfits.outfits[0]!.isFavorite).toBe(false);
  });
});
