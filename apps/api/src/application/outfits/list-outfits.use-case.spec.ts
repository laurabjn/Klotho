import { listOutfitsQuerySchema } from '@klotho/shared';

import { MINUTE } from '../../testing/fakes';
import { outfitWorkshop } from '../../testing/outfit-workshop';
import { ListOutfitsUseCase } from './list-outfits.use-case';

describe('ListOutfitsUseCase', () => {
  let t: ReturnType<typeof outfitWorkshop>;
  let list: ListOutfitsUseCase;
  const query = (input: object = {}) => listOutfitsQuerySchema.parse(input);
  const ids = (page: { items: { id: string }[] }) =>
    page.items.map((outfit) => outfit.id);

  /** Three looks, created a minute apart: a, then b, then c. */
  async function looks() {
    const dress = await t.add('laura', 'DRESS');
    const shoes = await t.add('laura', 'SHOES');
    const top = await t.add('laura', 'TOP');
    const bottom = await t.add('laura', 'BOTTOM');
    const a = await t.save('laura', [dress, shoes]);
    t.clock.advance(MINUTE);
    const b = await t.save('laura', [top, bottom, shoes]);
    t.clock.advance(MINUTE);
    const c = await t.save('laura', [top, bottom]);
    return { a, b, c };
  }

  beforeEach(() => {
    t = outfitWorkshop();
    list = new ListOutfitsUseCase(t.workshop);
  });

  it('lists the generated looks, most recent first, by page', async () => {
    const { a, b, c } = await looks();
    await t.save('other', [await t.add('other', 'DRESS')]);

    const first = await list.execute('laura', query({ pageSize: '2' }));
    const second = await list.execute(
      'laura',
      query({ page: '2', pageSize: '2' }),
    );

    expect(ids(first)).toEqual([c.id, b.id]);
    expect(first).toMatchObject({
      total: 3,
      page: 1,
      pageSize: 2,
      hasMore: true,
    });
    expect(ids(second)).toEqual([a.id]);
    expect(second.hasMore).toBe(false);
    expect(first.items[0]).toMatchObject({
      isFavorite: false,
      feedback: null,
      lastWornOn: null,
    });
  });

  it('lists the favourites, last favourited first', async () => {
    const { a, b, c } = await looks();
    await t.outfits.setFavorite('laura', b.id, true);
    t.clock.advance(MINUTE);
    await t.outfits.setFavorite('laura', a.id, true);
    t.clock.advance(MINUTE);
    await t.outfits.setFavorite('laura', c.id, true);
    await t.outfits.setFavorite('laura', c.id, false);

    const page = await list.execute('laura', query({ filter: 'favorites' }));

    expect(ids(page)).toEqual([a.id, b.id]);
    expect(page.total).toBe(2);
    expect(page.items.every((outfit) => outfit.isFavorite)).toBe(true);
  });

  it('lists the looks worn, last worn first, once each', async () => {
    const { a, b } = await looks();
    await t.outfits.markWorn('laura', a.id, '2026-09-20');
    await t.outfits.markWorn('laura', b.id, '2026-09-25');
    await t.outfits.markWorn('laura', a.id, '2026-09-28');

    const page = await list.execute('laura', query({ filter: 'worn' }));

    expect(ids(page)).toEqual([a.id, b.id]);
    expect(page.items.map((outfit) => outfit.lastWornOn)).toEqual([
      '2026-09-28',
      '2026-09-25',
    ]);
    expect(page.total).toBe(2);
  });
});
