import {
  sortPhotos,
  type WardrobeItem,
  type WardrobeItemChanges,
  type WardrobeItemFields,
  type WardrobeListQuery,
} from '../domain/wardrobe/entities/wardrobe-item.entity';
import type { WardrobeRepository } from '../domain/wardrobe/ports/wardrobe.repository';
import type { Clock } from '../domain/shared/ports/clock';

/** Copy with photos in API order, like the Prisma repository returns them. */
const view = (item: WardrobeItem): WardrobeItem => ({
  ...item,
  photos: sortPhotos(item.photos),
});

const intersects = <T>(values: T[], wanted: T[] | undefined) =>
  !wanted?.length || values.some((value) => wanted.includes(value));

/** Same semantics as PrismaWardrobeRepository, in memory. */
export class InMemoryWardrobeRepository implements WardrobeRepository {
  readonly items: WardrobeItem[] = [];
  private sequence = 0;

  constructor(private readonly clock: Clock) {}

  create(userId: string, fields: WardrobeItemFields): Promise<WardrobeItem> {
    const now = this.clock.now();
    const item: WardrobeItem = {
      ...fields,
      id: `item-${++this.sequence}`,
      userId,
      photos: [],
      wearCount: 0,
      lastWornAt: null,
      createdAt: now,
      updatedAt: now,
    };
    this.items.push(item);
    return Promise.resolve(view(item));
  }

  findOwned(userId: string, id: string): Promise<WardrobeItem | null> {
    const item = this.items.find((i) => i.id === id && i.userId === userId);
    return Promise.resolve(item ? view(item) : null);
  }

  list(userId: string, { filters, sort, page, pageSize }: WardrobeListQuery) {
    const q = filters.q?.toLowerCase();
    const matching = this.items
      .filter((i) => i.userId === userId)
      .filter((i) => intersects([i.category], filters.category))
      .filter((i) => intersects([i.status], filters.status))
      .filter((i) =>
        intersects([i.primaryColor, ...i.secondaryColors], filters.color),
      )
      .filter((i) => intersects(i.seasons, filters.season))
      .filter((i) => intersects(i.styles, filters.style))
      .filter(
        (i) =>
          filters.temperature === undefined ||
          ((i.minTemperature === null ||
            i.minTemperature <= filters.temperature) &&
            (i.maxTemperature === null ||
              i.maxTemperature >= filters.temperature)),
      )
      .filter(
        (i) =>
          !q ||
          [i.name, i.brand, i.subcategory].some((text) =>
            text?.toLowerCase().includes(q),
          ),
      );

    const sorted = [...matching].sort((a, b) => {
      switch (sort) {
        case 'mostWorn':
          return b.wearCount - a.wearCount;
        case 'leastWorn':
          return a.wearCount - b.wearCount;
        case 'alphabetical':
          return (a.name ?? '').localeCompare(b.name ?? '');
        default:
          return b.createdAt.getTime() - a.createdAt.getTime();
      }
    });

    const start = (page - 1) * pageSize;
    return Promise.resolve({
      items: sorted.slice(start, start + pageSize).map(view),
      total: matching.length,
    });
  }

  updateOwned(userId: string, id: string, changes: WardrobeItemChanges) {
    const index = this.items.findIndex(
      (i) => i.id === id && i.userId === userId,
    );
    if (index === -1) return Promise.resolve(null);
    const updated = {
      ...this.items[index]!,
      ...changes,
      updatedAt: this.clock.now(),
    };
    this.items[index] = updated;
    return Promise.resolve(view(updated));
  }

  deleteOwned(userId: string, id: string): Promise<boolean> {
    const index = this.items.findIndex(
      (i) => i.id === id && i.userId === userId,
    );
    if (index !== -1) this.items.splice(index, 1);
    return Promise.resolve(index !== -1);
  }
}
