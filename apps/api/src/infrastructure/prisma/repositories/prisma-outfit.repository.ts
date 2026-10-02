import { Injectable } from '@nestjs/common';
import type {
  DislikeReason,
  Occasion,
  OutfitRating,
  OutfitRole,
  Style,
  WeatherCondition,
} from '@klotho/shared';

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
} from '../../../domain/outfits/ports/outfit.repository';
import type { ScoreBreakdown } from '../../../domain/outfits/scoring/outfit-score';
import type { Prisma } from '../../../generated/prisma/client';
import { isUniqueViolation } from '../prisma-errors';
import { PrismaService } from '../prisma.service';

const pieces = { items: true } satisfies Prisma.OutfitInclude;
const include = {
  ...pieces,
  // Only the owner can give an opinion on a look.
  feedbacks: { take: 1 },
  wears: { orderBy: { wornOn: 'desc' }, take: 1, select: { wornOn: true } },
} satisfies Prisma.OutfitInclude;
// Inside a transaction, only the pieces are loaded: Prisma would run the
// other relations in parallel on the transaction's single connection.
type Row = Prisma.OutfitGetPayload<{ include: typeof pieces }> &
  Partial<
    Pick<
      Prisma.OutfitGetPayload<{ include: typeof include }>,
      'feedbacks' | 'wears'
    >
  >;
type WearRow = Prisma.OutfitWearGetPayload<object>;

/** A DATE column comes back as midnight UTC. */
const dayOf = (date: Date) => date.toISOString().slice(0, 10);
const dateOf = (day: string) => new Date(`${day}T00:00:00.000Z`);

// Values were validated (shared schemas, engine) before being stored.
function toDomain(row: Row): StoredOutfit {
  const feedback = row.feedbacks?.[0];
  const wear = row.wears?.[0];
  return {
    id: row.id,
    userId: row.userId,
    style: row.style as Style | null,
    occasion: row.occasion as Occasion | null,
    temperature: row.temperature,
    condition: row.weatherCondition as WeatherCondition | null,
    score: row.score,
    breakdown: row.breakdown as unknown as ScoreBreakdown,
    variantOf: row.variantOfId,
    createdAt: row.createdAt,
    isFavorite: row.isFavorite,
    favoritedAt: row.favoritedAt,
    feedback: feedback
      ? {
          rating: feedback.rating as OutfitRating,
          reasons: feedback.reasons as DislikeReason[],
          note: feedback.note,
          updatedAt: feedback.updatedAt,
        }
      : null,
    lastWornOn: wear ? dayOf(wear.wornOn) : null,
    pieces: row.items.map((item) => ({
      role: item.role as OutfitRole,
      itemId: item.wardrobeItemId,
    })),
  };
}

const toWear = (row: WearRow): OutfitWearRecord => ({
  id: row.id,
  userId: row.userId,
  outfitId: row.outfitId,
  wornOn: dayOf(row.wornOn),
  createdAt: row.createdAt,
});

const toData = (userId: string, outfit: NewOutfit) => ({
  userId,
  style: outfit.style,
  occasion: outfit.occasion,
  temperature:
    outfit.temperature === null ? null : Math.round(outfit.temperature),
  weatherCondition: outfit.condition,
  score: outfit.score,
  breakdown: outfit.breakdown as unknown as Prisma.InputJsonValue,
  variantOfId: outfit.variantOf,
  items: {
    create: outfit.pieces.map((piece) => ({
      role: piece.role,
      wardrobeItemId: piece.itemId,
    })),
  },
});

@Injectable()
export class PrismaOutfitRepository implements OutfitRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createMany(
    userId: string,
    outfits: NewOutfit[],
  ): Promise<StoredOutfit[]> {
    // One generation, one date: its looks then sort by score among themselves.
    const createdAt = new Date();
    const rows = await this.prisma.$transaction(
      outfits.map((outfit) =>
        this.prisma.outfit.create({
          data: { ...toData(userId, outfit), createdAt },
          include: pieces,
        }),
      ),
    );
    return rows.map(toDomain);
  }

  async findOwned(userId: string, id: string): Promise<StoredOutfit | null> {
    const row = await this.prisma.outfit.findFirst({
      where: { id, userId },
      include,
    });
    return row && toDomain(row);
  }

  async findManyOwned(userId: string, ids: string[]): Promise<StoredOutfit[]> {
    if (ids.length === 0) return [];
    const rows = await this.prisma.outfit.findMany({
      where: { userId, id: { in: ids } },
      include,
    });
    return rows.map(toDomain);
  }

  async list(userId: string, { filter, page, pageSize }: OutfitListQuery) {
    const skip = (page - 1) * pageSize;
    if (filter === 'worn') return this.listWorn(userId, skip, pageSize);

    const where: Prisma.OutfitWhereInput =
      filter === 'favorites' ? { userId, isFavorite: true } : { userId };
    const orderBy: Prisma.OutfitOrderByWithRelationInput[] =
      filter === 'favorites'
        ? [{ favoritedAt: { sort: 'desc', nulls: 'last' } }, { id: 'asc' }]
        : // Ids grow with creation: a generation is saved best first.
          [{ createdAt: 'desc' }, { score: 'desc' }, { id: 'asc' }];
    const [rows, total] = await Promise.all([
      this.prisma.outfit.findMany({
        where,
        orderBy,
        skip,
        take: pageSize,
        include,
      }),
      this.prisma.outfit.count({ where }),
    ]);
    return { items: rows.map(toDomain), total };
  }

  /** Looks worn at least once, by their last day worn. */
  private async listWorn(userId: string, skip: number, take: number) {
    const [groups, total] = await this.prisma.$transaction([
      this.prisma.outfitWear.groupBy({
        by: ['outfitId'],
        where: { userId },
        _max: { wornOn: true, createdAt: true },
        orderBy: [
          { _max: { wornOn: 'desc' } },
          { _max: { createdAt: 'desc' } },
          { outfitId: 'asc' },
        ],
        skip,
        take,
      }),
      this.prisma.outfit.count({ where: { userId, wears: { some: {} } } }),
    ]);
    const ids = groups.map((group) => group.outfitId);
    const byId = new Map(
      (await this.findManyOwned(userId, ids)).map((o) => [o.id, o]),
    );
    return {
      items: ids.flatMap((id) => byId.get(id) ?? []),
      total,
    };
  }

  async updatePieces(
    userId: string,
    id: string,
    changes: Pick<NewOutfit, 'pieces' | 'score' | 'breakdown'>,
  ): Promise<StoredOutfit | null> {
    const updated = await this.prisma.$transaction(async (tx) => {
      const owned = await tx.outfit.findFirst({ where: { id, userId } });
      if (!owned) return false;
      await tx.outfitItem.deleteMany({ where: { outfitId: id } });
      await tx.outfit.update({
        where: { id },
        data: {
          score: changes.score,
          breakdown: changes.breakdown,
          items: {
            create: changes.pieces.map((piece) => ({
              role: piece.role,
              wardrobeItemId: piece.itemId,
            })),
          },
        },
      });
      return true;
    });
    return updated ? this.findOwned(userId, id) : null;
  }

  async setFavorite(
    userId: string,
    id: string,
    favorite: boolean,
  ): Promise<StoredOutfit | null> {
    // Only a real change touches the date: favouriting twice keeps the first.
    await this.prisma.outfit.updateMany({
      where: { id, userId, isFavorite: !favorite },
      data: { isFavorite: favorite, favoritedAt: favorite ? new Date() : null },
    });
    return this.findOwned(userId, id);
  }

  async saveFeedback(
    userId: string,
    id: string,
    feedback: OutfitFeedbackFields,
  ): Promise<StoredOutfit | null> {
    if (!(await this.findOwned(userId, id))) return null;
    try {
      await this.upsertFeedback(userId, id, feedback);
    } catch (error) {
      // Two answers at once: the first one created the row, update it.
      if (!isUniqueViolation(error)) throw error;
      await this.upsertFeedback(userId, id, feedback);
    }
    return this.findOwned(userId, id);
  }

  private upsertFeedback(
    userId: string,
    outfitId: string,
    feedback: OutfitFeedbackFields,
  ) {
    return this.prisma.outfitFeedback.upsert({
      where: { outfitId_userId: { outfitId, userId } },
      create: { outfitId, userId, ...feedback },
      update: feedback,
    });
  }

  async clearFeedback(
    userId: string,
    id: string,
  ): Promise<StoredOutfit | null> {
    await this.prisma.outfitFeedback.deleteMany({
      where: { outfitId: id, userId },
    });
    return this.findOwned(userId, id);
  }

  async listRated(userId: string): Promise<RatedOutfit[]> {
    const rows = await this.prisma.outfitFeedback.findMany({
      where: { userId },
      select: { rating: true, outfit: { select: { items: true } } },
    });
    return rows.map((row) => ({
      rating: row.rating as OutfitRating,
      pieces: row.outfit.items.map((item) => ({
        role: item.role as OutfitRole,
        itemId: item.wardrobeItemId,
      })),
    }));
  }

  async markWorn(
    userId: string,
    id: string,
    wornOn: string,
  ): Promise<OutfitWearRecord | null> {
    const day = dateOf(wornOn);
    const existing = () =>
      this.prisma.outfitWear.findUnique({
        where: { outfitId_wornOn: { outfitId: id, wornOn: day } },
      });
    try {
      return await this.prisma.$transaction(async (tx) => {
        const outfit = await tx.outfit.findFirst({
          where: { id, userId },
          select: { items: { select: { wardrobeItemId: true } } },
        });
        if (!outfit) return null;
        const already = await tx.outfitWear.findUnique({
          where: { outfitId_wornOn: { outfitId: id, wornOn: day } },
        });
        if (already) return toWear(already);

        const wear = await tx.outfitWear.create({
          data: { userId, outfitId: id, wornOn: day },
        });
        const pieces = {
          userId,
          id: { in: outfit.items.map((item) => item.wardrobeItemId) },
        };
        const wornAt = wornAtOf(wornOn);
        await tx.wardrobeItem.updateMany({
          where: pieces,
          data: { wearCount: { increment: 1 } },
        });
        // Wearing a look on a past day does not move a later date back.
        await tx.wardrobeItem.updateMany({
          where: {
            ...pieces,
            OR: [{ lastWornAt: null }, { lastWornAt: { lt: wornAt } }],
          },
          data: { lastWornAt: wornAt },
        });
        return toWear(wear);
      });
    } catch (error) {
      // The same day was marked at the same time: keep the first one.
      if (!isUniqueViolation(error)) throw error;
      const wear = await existing();
      if (!wear) throw error;
      return toWear(wear);
    }
  }

  async listWears(
    userId: string,
    { from, to, page, pageSize }: OutfitHistoryQuery,
  ) {
    const where: Prisma.OutfitWearWhereInput = {
      userId,
      ...((from || to) && {
        wornOn: {
          ...(from && { gte: dateOf(from) }),
          ...(to && { lte: dateOf(to) }),
        },
      }),
    };
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.outfitWear.findMany({
        where,
        orderBy: [{ wornOn: 'desc' }, { createdAt: 'desc' }, { id: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.outfitWear.count({ where }),
    ]);
    return { items: rows.map(toWear), total };
  }

  async deleteWear(userId: string, wearId: string): Promise<boolean> {
    return this.prisma.$transaction(async (tx) => {
      const wear = await tx.outfitWear.findFirst({
        where: { id: wearId, userId },
        select: {
          outfit: { select: { items: { select: { wardrobeItemId: true } } } },
        },
      });
      if (!wear) return false;
      // A concurrent undo already removed it: nothing more to undo.
      const { count } = await tx.outfitWear.deleteMany({
        where: { id: wearId, userId },
      });
      if (count === 0) return false;

      const itemIds = wear.outfit.items.map((item) => item.wardrobeItemId);
      await tx.wardrobeItem.updateMany({
        where: { userId, id: { in: itemIds }, wearCount: { gt: 0 } },
        data: { wearCount: { decrement: 1 } },
      });
      // The last day worn comes from the remaining wears of looks with it.
      for (const itemId of itemIds) {
        const latest = await tx.outfitWear.findFirst({
          where: {
            userId,
            outfit: { items: { some: { wardrobeItemId: itemId } } },
          },
          orderBy: { wornOn: 'desc' },
          select: { wornOn: true },
        });
        await tx.wardrobeItem.updateMany({
          where: { userId, id: itemId },
          data: {
            lastWornAt: latest ? wornAtOf(dayOf(latest.wornOn)) : null,
          },
        });
      }
      return true;
    });
  }

  async delete(
    userId: string,
    id: string,
  ): Promise<'deleted' | 'notFound' | 'worn'> {
    return this.prisma.$transaction(async (tx) => {
      const outfit = await tx.outfit.findFirst({
        where: { id, userId },
        select: { _count: { select: { wears: true } } },
      });
      if (!outfit) return 'notFound';
      if (outfit._count.wears > 0) return 'worn';
      // Pieces, opinion and plans go with it (cascade); a wear added
      // meanwhile makes the delete match nothing.
      const { count } = await tx.outfit.deleteMany({
        where: { id, userId, wears: { none: {} } },
      });
      return count === 1 ? 'deleted' : 'worn';
    });
  }
}
