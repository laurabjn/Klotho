import { outfitHistoryQuerySchema } from '@klotho/shared';

import {
  OutfitNotFoundError,
  OutfitWearNotFoundError,
} from '../../domain/outfits/errors';
import type { WardrobeItem } from '../../domain/wardrobe/entities/wardrobe-item.entity';
import { outfitWorkshop } from '../../testing/outfit-workshop';
import {
  DeleteOutfitWearUseCase,
  ListOutfitHistoryUseCase,
  MarkOutfitWornUseCase,
} from './mark-outfit-worn.use-case';

const noon = (day: string) => new Date(`${day}T12:00:00.000Z`);

describe('Wear history', () => {
  let t: ReturnType<typeof outfitWorkshop>;
  let mark: MarkOutfitWornUseCase;
  let history: ListOutfitHistoryUseCase;
  let undo: DeleteOutfitWearUseCase;
  let dress: WardrobeItem;
  let shoes: WardrobeItem;
  let top: WardrobeItem;
  let bottom: WardrobeItem;
  let dressLook: string;
  let topLook: string;
  const query = (input: object = {}) => outfitHistoryQuerySchema.parse(input);
  const usage = (item: WardrobeItem) => {
    const { wearCount, lastWornAt } = t.item(item.id);
    return { wearCount, lastWornAt };
  };

  beforeEach(async () => {
    t = outfitWorkshop();
    mark = new MarkOutfitWornUseCase(t.workshop);
    history = new ListOutfitHistoryUseCase(t.workshop);
    undo = new DeleteOutfitWearUseCase(t.workshop);
    dress = await t.add('laura', 'DRESS');
    shoes = await t.add('laura', 'SHOES');
    top = await t.add('laura', 'TOP');
    bottom = await t.add('laura', 'BOTTOM');
    dressLook = (await t.save('laura', [dress, shoes])).id;
    topLook = (await t.save('laura', [top, bottom, shoes])).id;
  });

  describe('MarkOutfitWornUseCase', () => {
    it('saves the day and counts a wear for every piece', async () => {
      const wear = await mark.execute('laura', dressLook, '2026-09-30');

      expect(wear).toMatchObject({
        wornOn: '2026-09-30',
        outfit: { id: dressLook, lastWornOn: '2026-09-30' },
      });
      expect(usage(dress)).toEqual({
        wearCount: 1,
        lastWornAt: noon('2026-09-30'),
      });
      expect(usage(shoes).wearCount).toBe(1);
      expect(usage(top).wearCount).toBe(0);
      // The pieces of the returned look carry the new usage.
      expect(
        wear.outfit.pieces.find((p) => p.item.id === dress.id)!.item.wearCount,
      ).toBe(1);
    });

    it('is idempotent per look and day', async () => {
      const first = await mark.execute('laura', dressLook, '2026-09-30');
      const again = await mark.execute('laura', dressLook, '2026-09-30');

      expect(again.id).toBe(first.id);
      expect(t.outfits.wears).toHaveLength(1);
      expect(usage(dress).wearCount).toBe(1);
    });

    it('never moves the last day worn back', async () => {
      await mark.execute('laura', dressLook, '2026-09-30');
      await mark.execute('laura', topLook, '2026-09-10');

      expect(usage(shoes)).toEqual({
        wearCount: 2,
        lastWornAt: noon('2026-09-30'),
      });
      expect(usage(top).lastWornAt).toEqual(noon('2026-09-10'));
    });

    it("cannot mark another user's look", async () => {
      await expect(
        mark.execute('other', dressLook, '2026-09-30'),
      ).rejects.toBeInstanceOf(OutfitNotFoundError);
      expect(t.outfits.wears).toHaveLength(0);
    });
  });

  describe('ListOutfitHistoryUseCase', () => {
    beforeEach(async () => {
      await mark.execute('laura', dressLook, '2026-09-01');
      await mark.execute('laura', topLook, '2026-09-15');
      await mark.execute('laura', dressLook, '2026-09-30');
    });

    it('lists the wears, last worn first, by page', async () => {
      const page = await history.execute('laura', query({ pageSize: '2' }));

      expect(page.items.map((w) => [w.wornOn, w.outfit.id])).toEqual([
        ['2026-09-30', dressLook],
        ['2026-09-15', topLook],
      ]);
      expect(page).toMatchObject({ total: 3, hasMore: true });
    });

    it('filters a period, days included', async () => {
      const page = await history.execute(
        'laura',
        query({ from: '2026-09-01', to: '2026-09-15' }),
      );

      expect(page.items.map((w) => w.wornOn)).toEqual([
        '2026-09-15',
        '2026-09-01',
      ]);
    });

    it("never shows another user's wears", async () => {
      await expect(history.execute('other', query())).resolves.toMatchObject({
        items: [],
        total: 0,
      });
    });
  });

  describe('DeleteOutfitWearUseCase', () => {
    it('undoes the wear and the usage it added', async () => {
      await mark.execute('laura', topLook, '2026-09-10');
      const last = await mark.execute('laura', dressLook, '2026-09-30');

      await undo.execute('laura', last.id);

      expect(usage(dress)).toEqual({ wearCount: 0, lastWornAt: null });
      // Still worn with the other look.
      expect(usage(shoes)).toEqual({
        wearCount: 1,
        lastWornAt: noon('2026-09-10'),
      });
      expect(usage(top).wearCount).toBe(1);
    });

    it('never counts below zero', async () => {
      const wear = await mark.execute('laura', dressLook, '2026-09-30');
      t.wardrobe.updateUsage(dress.id, () => ({
        wearCount: 0,
        lastWornAt: null,
      }));

      await undo.execute('laura', wear.id);

      expect(usage(dress).wearCount).toBe(0);
    });

    it("cannot undo an unknown wear or another user's", async () => {
      const wear = await mark.execute('laura', dressLook, '2026-09-30');

      await expect(undo.execute('other', wear.id)).rejects.toBeInstanceOf(
        OutfitWearNotFoundError,
      );
      await expect(undo.execute('laura', 'nope')).rejects.toBeInstanceOf(
        OutfitWearNotFoundError,
      );
      expect(usage(dress).wearCount).toBe(1);
    });
  });
});
