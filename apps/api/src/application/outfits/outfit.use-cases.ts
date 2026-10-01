import {
  styleProfileSchema,
  type GenerateOutfitsRequest,
  type Outfit as OutfitDto,
  type OutfitAlternative,
  type OutfitRole,
} from '@klotho/shared';

import type {
  Outfit,
  OutfitCandidate,
  OutfitContext,
} from '../../domain/outfits/entities/outfit-candidate';
import {
  InvalidReplacementError,
  NoOutfitPossibleError,
  OutfitNotFoundError,
} from '../../domain/outfits/errors';
import type {
  OutfitConditions,
  OutfitRepository,
  StoredOutfit,
} from '../../domain/outfits/ports/outfit.repository';
import { highlightsOf } from '../../domain/outfits/scoring/highlights';
import { scoreOutfit } from '../../domain/outfits/scoring/outfit-score';
import { filterCandidates } from '../../domain/outfits/services/outfit-candidate-filter';
import { ROLE_OF } from '../../domain/outfits/services/outfit-combination-builder';
import { outfitKey } from '../../domain/outfits/entities/outfit-candidate';
import type { StyleProfileRepository } from '../../domain/preferences/ports/style-profile.repository';
import type { Clock } from '../../domain/shared/ports/clock';
import type { FileStorage } from '../../domain/storage/ports/file-storage';
import type { WardrobeItem } from '../../domain/wardrobe/entities/wardrobe-item.entity';
import type { WardrobeRepository } from '../../domain/wardrobe/ports/wardrobe.repository';
import { toWardrobeItemDto } from '../wardrobe/wardrobe-item.mapper';
import type {
  GeneratedOutfit,
  OutfitGeneratorService,
} from './outfit-generator.service';

/** A replacement keeps the look "compatible" if it loses at most this (out of 100). */
const COMPATIBLE_WITHIN = 8;

/**
 * What the outfit use cases share: loading the wardrobe and the profile,
 * rebuilding the day's context, and presenting looks to the app.
 */
export class OutfitWorkshop {
  constructor(
    readonly wardrobe: WardrobeRepository,
    readonly outfits: OutfitRepository,
    private readonly profiles: StyleProfileRepository,
    readonly generator: OutfitGeneratorService,
    private readonly storage: Pick<FileStorage, 'signedUrl'>,
    private readonly clock: Clock,
  ) {}

  async context(
    userId: string,
    conditions: OutfitConditions,
  ): Promise<OutfitContext> {
    const profile =
      (await this.profiles.findByUser(userId)) ?? styleProfileSchema.parse({});
    const wet =
      conditions.condition === 'rain' || conditions.condition === 'storm';
    return {
      ...conditions,
      precipitation: wet ? 2 : 0,
      windSpeed: 0,
      profile,
      today: this.clock.now(),
    };
  }

  async ownedOutfit(userId: string, id: string): Promise<StoredOutfit> {
    const outfit = await this.outfits.findOwned(userId, id);
    if (!outfit) throw new OutfitNotFoundError();
    return outfit;
  }

  /** Rebuilds a stored look with its pieces, for scoring. */
  lookOf(outfit: Pick<StoredOutfit, 'pieces'>, items: WardrobeItem[]): Outfit {
    const byId = new Map(items.map((item) => [item.id, item]));
    return {
      pieces: outfit.pieces.flatMap(({ role, itemId }) => {
        const item = byId.get(itemId);
        return item ? [{ role, item }] : [];
      }),
    };
  }

  itemDto(item: WardrobeItem) {
    return toWardrobeItemDto(item, this.storage);
  }

  async present(
    outfits: StoredOutfit[],
    items: WardrobeItem[],
  ): Promise<OutfitDto[]> {
    const byId = new Map(items.map((item) => [item.id, item]));
    return Promise.all(
      outfits.map(async (outfit) => ({
        id: outfit.id,
        style: outfit.style,
        occasion: outfit.occasion,
        temperature: outfit.temperature,
        condition: outfit.condition,
        highlights: highlightsOf(outfit.breakdown),
        variantOf: outfit.variantOf,
        createdAt: outfit.createdAt.toISOString(),
        pieces: await Promise.all(
          outfit.pieces.flatMap(({ role, itemId }) => {
            const item = byId.get(itemId);
            return item
              ? [
                  this.itemDto(item).then((dto) => ({
                    role,
                    item: dto,
                  })),
                ]
              : [];
          }),
        ),
      })),
    );
  }

  async save(
    userId: string,
    conditions: OutfitConditions,
    generated: GeneratedOutfit[],
    variantOf: string | null = null,
  ): Promise<StoredOutfit[]> {
    return this.outfits.createMany(
      userId,
      generated.map((outfit) => ({
        ...conditions,
        pieces: outfit.pieces,
        score: outfit.score,
        breakdown: outfit.breakdown,
        variantOf,
      })),
    );
  }

  /** Keys of looks already seen, so that they are not proposed again. */
  async seenKeys(userId: string, outfitIds: string[]): Promise<string[]> {
    const seen = await this.outfits.findManyOwned(userId, outfitIds);
    const items = seen.length ? await this.wardrobe.findAllOwned(userId) : [];
    return seen.map((outfit) => outfitKey(this.lookOf(outfit, items)));
  }
}

/** POST /outfits/generate: the 5 looks, saved and ready to explore. */
export class CreateOutfitsUseCase {
  constructor(private readonly workshop: OutfitWorkshop) {}

  async execute(
    userId: string,
    request: GenerateOutfitsRequest,
  ): Promise<OutfitDto[]> {
    const conditions: OutfitConditions = {
      style: request.style,
      occasion: request.occasion,
      temperature: request.temperature,
      condition: request.condition,
    };
    const [items, context, excludedOutfitKeys] = await Promise.all([
      this.workshop.wardrobe.findAllOwned(userId),
      this.workshop.context(userId, conditions),
      this.workshop.seenKeys(userId, request.excludeOutfitIds),
    ]);
    const generated = this.workshop.generator.generate(items, {
      context,
      imposedItemIds: request.mandatoryItemId ? [request.mandatoryItemId] : [],
      exclusions: { itemIds: [], ...request.exclusions },
      excludedOutfitKeys,
    });
    if (generated.length === 0) throw new NoOutfitPossibleError();
    const saved = await this.workshop.save(userId, conditions, generated);
    return this.workshop.present(saved, items);
  }
}

export class GetOutfitUseCase {
  constructor(private readonly workshop: OutfitWorkshop) {}

  async execute(userId: string, id: string): Promise<OutfitDto> {
    const outfit = await this.workshop.ownedOutfit(userId, id);
    const items = await this.workshop.wardrobe.findAllOwned(userId);
    const [dto] = await this.workshop.present([outfit], items);
    return dto!;
  }
}

/** The latest looks (the home "Tenue du jour" shows the first one). */
export class ListRecentOutfitsUseCase {
  constructor(private readonly workshop: OutfitWorkshop) {}

  async execute(userId: string, limit: number): Promise<OutfitDto[]> {
    const [outfits, items] = await Promise.all([
      this.workshop.outfits.listRecent(userId, limit),
      this.workshop.wardrobe.findAllOwned(userId),
    ]);
    return this.workshop.present(outfits, items);
  }
}

/**
 * US7.3: the pieces that could take a role in the look, best first, each
 * with whether the look stays about as good.
 */
export class ListOutfitAlternativesUseCase {
  constructor(private readonly workshop: OutfitWorkshop) {}

  async execute(
    userId: string,
    id: string,
    role: OutfitRole,
  ): Promise<OutfitAlternative[]> {
    const outfit = await this.workshop.ownedOutfit(userId, id);
    const [items, context] = await Promise.all([
      this.workshop.wardrobe.findAllOwned(userId),
      this.workshop.context(userId, outfit),
    ]);
    const look = this.workshop.lookOf(outfit, items);
    const current = look.pieces.find((piece) => piece.role === role)?.item;
    const reference = current
      ? scoreOutfit(look, context).score
      : Number.NEGATIVE_INFINITY;

    const { candidates } = filterCandidates(items, context);
    const scored = candidates
      .filter(
        (item) => ROLE_OF[item.category] === role && item.id !== current?.id,
      )
      .map((item) => ({
        item,
        score: scoreOutfit(withPiece(look, role, item), context).score,
      }))
      .sort((a, b) => b.score - a.score);

    const byId = new Map(items.map((item) => [item.id, item]));
    return Promise.all(
      scored.map(async ({ item, score }) => ({
        item: await this.workshop.itemDto(byId.get(item.id)!),
        compatible: score >= reference - COMPATIBLE_WITHIN,
      })),
    );
  }
}

/** US7.3: swaps one piece; the look is scored again and saved. */
export class ReplaceOutfitItemUseCase {
  constructor(private readonly workshop: OutfitWorkshop) {}

  async execute(
    userId: string,
    id: string,
    role: OutfitRole,
    replacementItemId: string,
  ): Promise<OutfitDto> {
    const outfit = await this.workshop.ownedOutfit(userId, id);
    const [items, context] = await Promise.all([
      this.workshop.wardrobe.findAllOwned(userId),
      this.workshop.context(userId, outfit),
    ]);
    const replacement = items.find((item) => item.id === replacementItemId);
    if (
      !replacement ||
      ROLE_OF[replacement.category] !== role ||
      replacement.status !== 'AVAILABLE'
    ) {
      throw new InvalidReplacementError();
    }

    const look = withPiece(
      this.workshop.lookOf(outfit, items),
      role,
      replacement,
    );
    const { score, breakdown } = scoreOutfit(look, context);
    const updated = await this.workshop.outfits.updatePieces(userId, id, {
      pieces: look.pieces.map((piece) => ({
        role: piece.role,
        itemId: piece.item.id,
      })),
      score,
      breakdown,
    });
    if (!updated) throw new OutfitNotFoundError();
    const [dto] = await this.workshop.present([updated], items);
    return dto!;
  }
}

/**
 * US7.4: keeps the locked pieces of a look and varies the rest, never
 * proposing again the look itself nor those already seen.
 */
export class CreateOutfitVariantUseCase {
  constructor(private readonly workshop: OutfitWorkshop) {}

  async execute(
    userId: string,
    id: string,
    lockedItemIds: string[],
    excludeOutfitIds: string[],
  ): Promise<OutfitDto> {
    const outfit = await this.workshop.ownedOutfit(userId, id);
    const inLook = new Set(outfit.pieces.map((piece) => piece.itemId));
    const locked = lockedItemIds.filter((itemId) => inLook.has(itemId));

    const [items, context, excludedOutfitKeys] = await Promise.all([
      this.workshop.wardrobe.findAllOwned(userId),
      this.workshop.context(userId, outfit),
      this.workshop.seenKeys(userId, [id, ...excludeOutfitIds]),
    ]);
    const [variant] = this.workshop.generator.generate(items, {
      context,
      imposedItemIds: locked,
      excludedOutfitKeys,
      count: 1,
    });
    if (!variant) throw new NoOutfitPossibleError();
    const [saved] = await this.workshop.save(userId, outfit, [variant], id);
    const [dto] = await this.workshop.present([saved!], items);
    return dto!;
  }
}

function withPiece(
  look: Outfit,
  role: OutfitRole,
  item: OutfitCandidate,
): Outfit {
  const others = look.pieces.filter((piece) => piece.role !== role);
  // A dress replaces top + bottom and the other way round.
  const kept =
    role === 'dress'
      ? others.filter((p) => p.role !== 'top' && p.role !== 'bottom')
      : role === 'top' || role === 'bottom'
        ? others.filter((p) => p.role !== 'dress')
        : others;
  return { pieces: [...kept, { role, item }] };
}
