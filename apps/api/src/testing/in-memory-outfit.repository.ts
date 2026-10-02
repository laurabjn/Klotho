import {
  wornAtOf,
  type NewOutfit,
  type OutfitFeedbackFields,
  type OutfitHistoryQuery,
  type OutfitListQuery,
  type OutfitRepository,
  type OutfitWearRecord,
  type RatedOutfit,
  type StoredOutfit,
  type StoredOutfitFeedback,
} from '../domain/outfits/ports/outfit.repository';
import type { Clock } from '../domain/shared/ports/clock';
import type { InMemoryWardrobeRepository } from './in-memory-wardrobe.repository';

type OutfitRow = Omit<StoredOutfit, 'feedback' | 'lastWornOn'>;

const byWornOnDesc = (a: OutfitWearRecord, b: OutfitWearRecord) =>
  b.wornOn.localeCompare(a.wornOn) ||
  b.createdAt.getTime() - a.createdAt.getTime() ||
  b.id.localeCompare(a.id);

/**
 * Same semantics as PrismaOutfitRepository, in memory. Wears update the
 * usage of the pieces in the given wardrobe repository.
 */
export class InMemoryOutfitRepository implements OutfitRepository {
  readonly outfits: OutfitRow[] = [];
  readonly feedbacks = new Map<string, StoredOutfitFeedback>();
  readonly wears: OutfitWearRecord[] = [];
  private sequence = 0;

  constructor(
    private readonly clock: Clock,
    private readonly wardrobe?: InMemoryWardrobeRepository,
  ) {}

  /** A copy with its feedback and last day worn, like the Prisma one. */
  private view(outfit: OutfitRow): StoredOutfit {
    const [last] = this.wears
      .filter((wear) => wear.outfitId === outfit.id)
      .sort(byWornOnDesc);
    const feedback = this.feedbacks.get(outfit.id);
    return {
      ...outfit,
      pieces: [...outfit.pieces],
      feedback: feedback ? { ...feedback } : null,
      lastWornOn: last?.wornOn ?? null,
    };
  }

  private owned(userId: string, id: string): OutfitRow | undefined {
    return this.outfits.find((o) => o.id === id && o.userId === userId);
  }

  createMany(userId: string, outfits: NewOutfit[]): Promise<StoredOutfit[]> {
    const stored = outfits.map((outfit) => {
      this.sequence += 1;
      return {
        ...outfit,
        pieces: [...outfit.pieces],
        id: `outfit-${this.sequence}`,
        userId,
        createdAt: this.clock.now(),
        isFavorite: false,
        favoritedAt: null,
      };
    });
    this.outfits.push(...stored);
    return Promise.resolve(stored.map((outfit) => this.view(outfit)));
  }

  findOwned(userId: string, id: string): Promise<StoredOutfit | null> {
    const outfit = this.owned(userId, id);
    return Promise.resolve(outfit ? this.view(outfit) : null);
  }

  findManyOwned(userId: string, ids: string[]): Promise<StoredOutfit[]> {
    return Promise.resolve(
      this.outfits
        .filter((o) => o.userId === userId && ids.includes(o.id))
        .map((outfit) => this.view(outfit)),
    );
  }

  list(userId: string, { filter, page, pageSize }: OutfitListQuery) {
    const mine = this.outfits
      .filter((o) => o.userId === userId)
      .map((outfit, index) => ({ outfit: this.view(outfit), index }));
    let sorted: StoredOutfit[];
    if (filter === 'favorites') {
      sorted = mine
        .filter(({ outfit }) => outfit.isFavorite)
        .sort(
          (a, b) =>
            (b.outfit.favoritedAt?.getTime() ?? 0) -
              (a.outfit.favoritedAt?.getTime() ?? 0) || a.index - b.index,
        )
        .map(({ outfit }) => outfit);
    } else if (filter === 'worn') {
      const order = [...this.wears]
        .filter((wear) => wear.userId === userId)
        .sort(byWornOnDesc)
        .map((wear) => wear.outfitId);
      const ids = [...new Set(order)];
      sorted = ids.flatMap((id) =>
        mine.filter(({ outfit }) => outfit.id === id).map((m) => m.outfit),
      );
    } else {
      // Most recent first; among a same generation, best score first.
      sorted = mine
        .sort(
          (a, b) =>
            b.outfit.createdAt.getTime() - a.outfit.createdAt.getTime() ||
            b.outfit.score - a.outfit.score ||
            a.index - b.index,
        )
        .map(({ outfit }) => outfit);
    }
    const start = (page - 1) * pageSize;
    return Promise.resolve({
      items: sorted.slice(start, start + pageSize),
      total: sorted.length,
    });
  }

  updatePieces(
    userId: string,
    id: string,
    changes: Pick<NewOutfit, 'pieces' | 'score' | 'breakdown'>,
  ): Promise<StoredOutfit | null> {
    const outfit = this.owned(userId, id);
    if (!outfit) return Promise.resolve(null);
    Object.assign(outfit, changes);
    return Promise.resolve(this.view(outfit));
  }

  setFavorite(
    userId: string,
    id: string,
    favorite: boolean,
  ): Promise<StoredOutfit | null> {
    const outfit = this.owned(userId, id);
    if (!outfit) return Promise.resolve(null);
    if (outfit.isFavorite !== favorite) {
      outfit.isFavorite = favorite;
      outfit.favoritedAt = favorite ? this.clock.now() : null;
    }
    return Promise.resolve(this.view(outfit));
  }

  saveFeedback(
    userId: string,
    id: string,
    feedback: OutfitFeedbackFields,
  ): Promise<StoredOutfit | null> {
    const outfit = this.owned(userId, id);
    if (!outfit) return Promise.resolve(null);
    this.feedbacks.set(id, {
      ...feedback,
      reasons: [...feedback.reasons],
      updatedAt: this.clock.now(),
    });
    return Promise.resolve(this.view(outfit));
  }

  clearFeedback(userId: string, id: string): Promise<StoredOutfit | null> {
    const outfit = this.owned(userId, id);
    if (!outfit) return Promise.resolve(null);
    this.feedbacks.delete(id);
    return Promise.resolve(this.view(outfit));
  }

  listRated(userId: string): Promise<RatedOutfit[]> {
    return Promise.resolve(
      this.outfits
        .filter((o) => o.userId === userId && this.feedbacks.has(o.id))
        .map((o) => ({
          rating: this.feedbacks.get(o.id)!.rating,
          pieces: [...o.pieces],
        })),
    );
  }

  markWorn(
    userId: string,
    id: string,
    wornOn: string,
  ): Promise<OutfitWearRecord | null> {
    const outfit = this.owned(userId, id);
    if (!outfit) return Promise.resolve(null);
    const already = this.wears.find(
      (wear) => wear.outfitId === id && wear.wornOn === wornOn,
    );
    if (already) return Promise.resolve({ ...already });

    this.sequence += 1;
    const wear: OutfitWearRecord = {
      id: `wear-${this.sequence}`,
      userId,
      outfitId: id,
      wornOn,
      createdAt: this.clock.now(),
    };
    this.wears.push(wear);
    const wornAt = wornAtOf(wornOn);
    for (const { itemId } of outfit.pieces)
      this.wardrobe?.updateUsage(itemId, (item) => ({
        wearCount: item.wearCount + 1,
        lastWornAt:
          item.lastWornAt && item.lastWornAt > wornAt
            ? item.lastWornAt
            : wornAt,
      }));
    return Promise.resolve({ ...wear });
  }

  listWears(userId: string, { from, to, page, pageSize }: OutfitHistoryQuery) {
    const matching = this.wears
      .filter((wear) => wear.userId === userId)
      .filter((wear) => !from || wear.wornOn >= from)
      .filter((wear) => !to || wear.wornOn <= to)
      .sort(byWornOnDesc);
    const start = (page - 1) * pageSize;
    return Promise.resolve({
      items: matching.slice(start, start + pageSize).map((w) => ({ ...w })),
      total: matching.length,
    });
  }

  deleteWear(userId: string, wearId: string): Promise<boolean> {
    const index = this.wears.findIndex(
      (wear) => wear.id === wearId && wear.userId === userId,
    );
    if (index === -1) return Promise.resolve(false);
    const [wear] = this.wears.splice(index, 1);
    const outfit = this.outfits.find((o) => o.id === wear!.outfitId)!;
    for (const { itemId } of outfit.pieces) {
      const [latest] = this.wears
        .filter(
          (w) =>
            w.userId === userId &&
            this.outfits
              .find((o) => o.id === w.outfitId)
              ?.pieces.some((piece) => piece.itemId === itemId),
        )
        .sort(byWornOnDesc);
      this.wardrobe?.updateUsage(itemId, (item) => ({
        wearCount: Math.max(0, item.wearCount - 1),
        lastWornAt: latest ? wornAtOf(latest.wornOn) : null,
      }));
    }
    return Promise.resolve(true);
  }

  delete(userId: string, id: string): Promise<'deleted' | 'notFound' | 'worn'> {
    const outfit = this.owned(userId, id);
    if (!outfit) return Promise.resolve('notFound');
    if (this.wears.some((wear) => wear.outfitId === id))
      return Promise.resolve('worn');
    this.outfits.splice(this.outfits.indexOf(outfit), 1);
    this.feedbacks.delete(id);
    return Promise.resolve('deleted');
  }
}
