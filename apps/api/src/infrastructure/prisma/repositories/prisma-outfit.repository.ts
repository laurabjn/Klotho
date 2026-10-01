import { Injectable } from '@nestjs/common';
import type {
  Occasion,
  OutfitRole,
  Style,
  WeatherCondition,
} from '@klotho/shared';

import type {
  NewOutfit,
  OutfitRepository,
  StoredOutfit,
} from '../../../domain/outfits/ports/outfit.repository';
import type { ScoreBreakdown } from '../../../domain/outfits/scoring/outfit-score';
import type { Prisma } from '../../../generated/prisma/client';
import { PrismaService } from '../prisma.service';

const include = { items: true } as const;
type Row = Prisma.OutfitGetPayload<{ include: typeof include }>;

// Values were validated (shared schemas, engine) before being stored.
function toDomain(row: Row): StoredOutfit {
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
    pieces: row.items.map((item) => ({
      role: item.role as OutfitRole,
      itemId: item.wardrobeItemId,
    })),
  };
}

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
          include,
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

  async listRecent(userId: string, limit: number): Promise<StoredOutfit[]> {
    const rows = await this.prisma.outfit.findMany({
      where: { userId },
      // Ids grow with creation: a generation is saved best first.
      orderBy: [{ createdAt: 'desc' }, { score: 'desc' }, { id: 'asc' }],
      take: limit,
      include,
    });
    return rows.map(toDomain);
  }

  async updatePieces(
    userId: string,
    id: string,
    changes: Pick<NewOutfit, 'pieces' | 'score' | 'breakdown'>,
  ): Promise<StoredOutfit | null> {
    return this.prisma.$transaction(async (tx) => {
      const owned = await tx.outfit.findFirst({ where: { id, userId } });
      if (!owned) return null;
      await tx.outfitItem.deleteMany({ where: { outfitId: id } });
      const row = await tx.outfit.update({
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
        include,
      });
      return toDomain(row);
    });
  }
}
