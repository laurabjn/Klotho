import {
  OUTFIT_ALTERNATIVES_MAX,
  styleProfileSchema,
  type GenerateOutfitsRequest,
  type Outfit as OutfitDto,
  type OutfitAlternative,
  type OutfitRole,
  type OutfitWear as OutfitWearDto,
} from '@klotho/shared';

import {
  keyOfMainPieces,
  MAIN_ROLES,
  outfitKey,
  type Outfit,
  type OutfitCandidate,
  type OutfitContext,
  type OutfitFeedbackSignals,
} from '../../domain/outfits/entities/outfit-candidate';
import {
  InvalidReplacementError,
  NoOutfitPossibleError,
  OutfitNotFoundError,
  OutfitWornError,
} from '../../domain/outfits/errors';
import type {
  OutfitConditions,
  OutfitPieceRef,
  OutfitRepository,
  OutfitWearRecord,
  StoredOutfit,
} from '../../domain/outfits/ports/outfit.repository';
import { highlightsOf } from '../../domain/outfits/scoring/highlights';
import { scoreOutfit } from '../../domain/outfits/scoring/outfit-score';
import { filterCandidates } from '../../domain/outfits/services/outfit-candidate-filter';
import { ROLE_OF } from '../../domain/outfits/services/outfit-combination-builder';
import type { Notifier } from '../../domain/notifications/ports/notifier';
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

const mainIdsOf = (pieces: OutfitPieceRef[]) =>
  pieces
    .filter((piece) => MAIN_ROLES.includes(piece.role))
    .map((piece) => piece.itemId);

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

  /** The day's conditions, the user's tastes and her opinions (US8.1). */
  async context(
    userId: string,
    conditions: OutfitConditions,
    items: WardrobeItem[],
  ): Promise<OutfitContext> {
    const [stored, feedback] = await Promise.all([
      this.profiles.findByUser(userId),
      this.feedbackSignals(userId, items),
    ]);
    const profile = stored ?? styleProfileSchema.parse({});
    return this.withConditions(
      {
        precipitation: 0,
        windSpeed: 0,
        profile,
        today: this.clock.now(),
        feedback,
      },
      conditions,
    );
  }

  /** The same tastes and opinions under other conditions (another day). */
  withConditions(
    context: Omit<OutfitContext, keyof OutfitConditions>,
    // Often a stored look: only its conditions are read.
    { style, occasion, temperature, condition }: OutfitConditions,
  ): OutfitContext {
    const wet = condition === 'rain' || condition === 'storm';
    return {
      ...context,
      style,
      occasion,
      temperature,
      condition,
      precipitation: wet ? 2 : 0,
      windSpeed: 0,
    };
  }

  private async feedbackSignals(
    userId: string,
    items: WardrobeItem[],
  ): Promise<OutfitFeedbackSignals> {
    const rated = await this.outfits.listRated(userId);
    const of = (rating: string) =>
      rated
        .filter((look) => look.rating === rating)
        .map((look) => mainIdsOf(look.pieces));
    return {
      liked: of('like'),
      disliked: of('dislike'),
      favoriteItemIds: items
        .filter((item) => item.isFavorite)
        .map((item) => item.id),
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
        isFavorite: outfit.isFavorite,
        feedback: outfit.feedback && {
          rating: outfit.feedback.rating,
          reasons: outfit.feedback.reasons,
          note: outfit.feedback.note,
          updatedAt: outfit.feedback.updatedAt.toISOString(),
        },
        lastWornOn: outfit.lastWornOn,
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

  /** One look, ready for the app. */
  async presentOne(userId: string, outfit: StoredOutfit): Promise<OutfitDto> {
    const items = await this.wardrobe.findAllOwned(userId);
    const [dto] = await this.present([outfit], items);
    return dto!;
  }

  /** Wears with their looks, in the given order. */
  async presentWears(
    userId: string,
    wears: OutfitWearRecord[],
  ): Promise<OutfitWearDto[]> {
    if (wears.length === 0) return [];
    const ids = [...new Set(wears.map((wear) => wear.outfitId))];
    const [outfits, items] = await Promise.all([
      this.outfits.findManyOwned(userId, ids),
      this.wardrobe.findAllOwned(userId),
    ]);
    const presented = await this.present(outfits, items);
    const byId = new Map(presented.map((dto) => [dto.id, dto]));
    return wears.flatMap((wear) => {
      const outfit = byId.get(wear.outfitId);
      return outfit ? [{ id: wear.id, wornOn: wear.wornOn, outfit }] : [];
    });
  }

  /**
   * Keys of the looks not to propose again: those already seen, and every
   * look the user disliked.
   */
  async excludedKeys(
    userId: string,
    seenOutfitIds: string[],
    items: WardrobeItem[],
    context: OutfitContext,
  ): Promise<string[]> {
    const seen = await this.outfits.findManyOwned(userId, seenOutfitIds);
    return [
      ...seen.map((outfit) => outfitKey(this.lookOf(outfit, items))),
      ...(context.feedback?.disliked ?? []).map(keyOfMainPieces),
    ];
  }
}

/** POST /outfits/generate: the 5 looks, saved and ready to explore. */
export class CreateOutfitsUseCase {
  constructor(
    private readonly workshop: OutfitWorkshop,
    private readonly notifier: Notifier,
  ) {}

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
    const items = await this.workshop.wardrobe.findAllOwned(userId);
    const context = await this.workshop.context(userId, conditions, items);
    const excludedOutfitKeys = await this.workshop.excludedKeys(
      userId,
      request.excludeOutfitIds,
      items,
      context,
    );
    const generated = this.workshop.generator.generate(items, {
      context,
      imposedItemIds: request.mandatoryItemId ? [request.mandatoryItemId] : [],
      exclusions: { itemIds: [], ...request.exclusions },
      excludedOutfitKeys,
    });
    if (generated.length === 0) throw new NoOutfitPossibleError();
    const saved = await this.workshop.save(userId, conditions, generated);
    // Best first.
    await this.notifier.outfitsGenerated(userId, {
      count: saved.length,
      outfitId: saved[0]!.id,
    });
    return this.workshop.present(saved, items);
  }
}

export class GetOutfitUseCase {
  constructor(private readonly workshop: OutfitWorkshop) {}

  async execute(userId: string, id: string): Promise<OutfitDto> {
    const outfit = await this.workshop.ownedOutfit(userId, id);
    return this.workshop.presentOne(userId, outfit);
  }
}

/**
 * "Supprimer de mes tenues": the look, its plans and its opinion. A look
 * worn at least once stays, so that the history remains true.
 */
export class DeleteOutfitUseCase {
  constructor(private readonly workshop: OutfitWorkshop) {}

  async execute(userId: string, id: string): Promise<void> {
    const result = await this.workshop.outfits.delete(userId, id);
    if (result === 'notFound') throw new OutfitNotFoundError();
    if (result === 'worn') throw new OutfitWornError();
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
    const items = await this.workshop.wardrobe.findAllOwned(userId);
    const context = await this.workshop.context(userId, outfit, items);
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
      .sort((a, b) => b.score - a.score)
      // Bounded: each alternative carries signed photo URLs.
      .slice(0, OUTFIT_ALTERNATIVES_MAX);

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
    const items = await this.workshop.wardrobe.findAllOwned(userId);
    const context = await this.workshop.context(userId, outfit, items);
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

    const items = await this.workshop.wardrobe.findAllOwned(userId);
    const context = await this.workshop.context(userId, outfit, items);
    const excludedOutfitKeys = await this.workshop.excludedKeys(
      userId,
      [id, ...excludeOutfitIds],
      items,
      context,
    );
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
