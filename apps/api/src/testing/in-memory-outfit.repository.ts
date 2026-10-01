import type {
  NewOutfit,
  OutfitRepository,
  StoredOutfit,
} from '../domain/outfits/ports/outfit.repository';
import type { Clock } from '../domain/shared/ports/clock';

export class InMemoryOutfitRepository implements OutfitRepository {
  readonly outfits: StoredOutfit[] = [];
  private sequence = 0;

  constructor(private readonly clock: Clock) {}

  createMany(userId: string, outfits: NewOutfit[]): Promise<StoredOutfit[]> {
    const stored = outfits.map((outfit) => {
      this.sequence += 1;
      return {
        ...outfit,
        pieces: [...outfit.pieces],
        id: `outfit-${this.sequence}`,
        userId,
        createdAt: this.clock.now(),
      };
    });
    this.outfits.push(...stored);
    return Promise.resolve(stored);
  }

  findOwned(userId: string, id: string): Promise<StoredOutfit | null> {
    return Promise.resolve(
      this.outfits.find((o) => o.id === id && o.userId === userId) ?? null,
    );
  }

  findManyOwned(userId: string, ids: string[]): Promise<StoredOutfit[]> {
    return Promise.resolve(
      this.outfits.filter((o) => o.userId === userId && ids.includes(o.id)),
    );
  }

  listRecent(userId: string, limit: number): Promise<StoredOutfit[]> {
    return Promise.resolve(
      this.outfits
        .filter((o) => o.userId === userId)
        .map((outfit, index) => ({ outfit, index }))
        // Most recent first; among a same generation, best score first.
        .sort(
          (a, b) =>
            b.outfit.createdAt.getTime() - a.outfit.createdAt.getTime() ||
            b.outfit.score - a.outfit.score ||
            a.index - b.index,
        )
        .map(({ outfit }) => outfit)
        .slice(0, limit),
    );
  }

  updatePieces(
    userId: string,
    id: string,
    changes: Pick<NewOutfit, 'pieces' | 'score' | 'breakdown'>,
  ): Promise<StoredOutfit | null> {
    const outfit = this.outfits.find((o) => o.id === id && o.userId === userId);
    if (!outfit) return Promise.resolve(null);
    Object.assign(outfit, changes);
    return Promise.resolve(outfit);
  }
}
