import {
  createWardrobeItemSchema,
  listWardrobeQuerySchema,
  type CreateWardrobeItemInput,
} from '@klotho/shared';

import {
  InvalidTemperatureRangeError,
  WardrobeItemNotFoundError,
} from '../../domain/wardrobe/errors';
import { FixedClock, MINUTE } from '../../testing/fakes';
import { InMemoryWardrobeRepository } from '../../testing/in-memory-wardrobe.repository';
import { InMemoryFileStorage } from '../../testing/storage-fakes';
import { CreateWardrobeItemUseCase } from './create-wardrobe-item.use-case';
import { DeleteWardrobeItemUseCase } from './delete-wardrobe-item.use-case';
import { GetWardrobeItemUseCase } from './get-wardrobe-item.use-case';
import { ListWardrobeItemsUseCase } from './list-wardrobe-items.use-case';
import { UpdateWardrobeItemUseCase } from './update-wardrobe-item.use-case';

const LAURA = 'user-laura';
const OTHER = 'user-other';

describe('Wardrobe use cases', () => {
  let clock: FixedClock;
  let repository: InMemoryWardrobeRepository;
  let storage: InMemoryFileStorage;
  let create: CreateWardrobeItemUseCase;
  let list: ListWardrobeItemsUseCase;
  let get: GetWardrobeItemUseCase;
  let update: UpdateWardrobeItemUseCase;
  let remove: DeleteWardrobeItemUseCase;

  /** Goes through the shared schema, like the HTTP layer does. */
  const add = (userId: string, input: CreateWardrobeItemInput) => {
    clock.advance(MINUTE); // distinct creation dates for sorting
    return create.execute(userId, createWardrobeItemSchema.parse(input));
  };
  const query = (input: object = {}) => listWardrobeQuerySchema.parse(input);

  beforeEach(() => {
    clock = new FixedClock();
    repository = new InMemoryWardrobeRepository(clock);
    storage = new InMemoryFileStorage();
    create = new CreateWardrobeItemUseCase(repository, storage);
    list = new ListWardrobeItemsUseCase(repository, storage);
    get = new GetWardrobeItemUseCase(repository, storage);
    update = new UpdateWardrobeItemUseCase(repository, storage);
    remove = new DeleteWardrobeItemUseCase(repository, storage);
  });

  describe('CreateWardrobeItemUseCase', () => {
    it('creates an available item owned by the user', async () => {
      const item = await add(LAURA, { category: 'TOP', primaryColor: 'ecru' });

      expect(item).toMatchObject({
        category: 'TOP',
        primaryColor: 'ecru',
        status: 'AVAILABLE',
        wearCount: 0,
        lastWornAt: null,
        createdAt: expect.any(String),
      });
      expect(repository.items[0]?.userId).toBe(LAURA);
      expect(item).not.toHaveProperty('userId');
    });
  });

  describe('ListWardrobeItemsUseCase', () => {
    beforeEach(async () => {
      await add(LAURA, {
        name: 'Blouse fleurie',
        category: 'TOP',
        primaryColor: 'powderPink',
        seasons: ['spring', 'summer'],
        styles: ['romantic'],
      });
      await add(LAURA, {
        name: 'Jean droit',
        category: 'BOTTOM',
        primaryColor: 'denim',
        brand: 'Levis',
        styles: ['casual'],
        status: 'WASHING',
      });
      await add(LAURA, {
        name: 'Ceinture',
        category: 'ACCESSORY',
        primaryColor: 'chocolate',
        secondaryColors: ['gold'],
      });
      await add(OTHER, {
        name: 'Pas à moi',
        category: 'TOP',
        primaryColor: 'black',
      });
    });

    it("never returns another user's items", async () => {
      const page = await list.execute(LAURA, query());

      expect(page.total).toBe(3);
      expect(page.items.map((i) => i.name)).not.toContain('Pas à moi');
    });

    it('sorts the most recent first by default', async () => {
      const page = await list.execute(LAURA, query());

      expect(page.items.map((i) => i.name)).toEqual([
        'Ceinture',
        'Jean droit',
        'Blouse fleurie',
      ]);
    });

    it('paginates', async () => {
      const page = await list.execute(
        LAURA,
        query({ page: '2', pageSize: '2' }),
      );

      expect(page).toMatchObject({
        total: 3,
        page: 2,
        pageSize: 2,
        hasMore: false,
      });
      expect(page.items.map((i) => i.name)).toEqual(['Blouse fleurie']);
    });

    it.each([
      [{ category: 'TOP,BOTTOM' }, ['Jean droit', 'Blouse fleurie']],
      [{ status: 'WASHING' }, ['Jean droit']],
      [{ season: 'summer' }, ['Blouse fleurie']],
      [{ style: 'casual' }, ['Jean droit']],
      [{ color: 'gold' }, ['Ceinture']], // secondary colour
      [{ q: 'levis' }, ['Jean droit']], // brand, case-insensitive
    ])('filters by %j', async (filter, expected) => {
      const page = await list.execute(LAURA, query(filter));

      expect(page.items.map((i) => i.name)).toEqual(expected);
    });
  });

  describe('Get / Update / Delete', () => {
    let itemId: string;

    beforeEach(async () => {
      ({ id: itemId } = await add(LAURA, {
        category: 'TOP',
        primaryColor: 'ecru',
        minTemperature: 10,
        maxTemperature: 20,
      }));
    });

    it('returns my item', async () => {
      await expect(get.execute(LAURA, itemId)).resolves.toMatchObject({
        id: itemId,
      });
    });

    it.each([
      ['get', () => get.execute(OTHER, itemId)],
      ['update', () => update.execute(OTHER, itemId, { status: 'ARCHIVED' })],
      ['delete', () => remove.execute(OTHER, itemId)],
    ])("cannot %s another user's item (neutral 404)", async (_action, act) => {
      await expect(act()).rejects.toBeInstanceOf(WardrobeItemNotFoundError);
      expect(repository.items[0]?.status).toBe('AVAILABLE');
    });

    it('updates only the given fields', async () => {
      const updated = await update.execute(LAURA, itemId, {
        status: 'WASHING',
      });

      expect(updated).toMatchObject({
        status: 'WASHING',
        primaryColor: 'ecru',
      });
    });

    it('refuses a change that inverts the temperature range', async () => {
      await expect(
        update.execute(LAURA, itemId, { minTemperature: 25 }),
      ).rejects.toBeInstanceOf(InvalidTemperatureRangeError);
    });

    it('deletes my item', async () => {
      await remove.execute(LAURA, itemId);

      await expect(get.execute(LAURA, itemId)).rejects.toBeInstanceOf(
        WardrobeItemNotFoundError,
      );
    });
  });
});
