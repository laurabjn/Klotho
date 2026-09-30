import { Injectable } from '@nestjs/common';

import type {
  WardrobeItem,
  WardrobeItemChanges,
  WardrobeItemFields,
  WardrobeListQuery,
} from '../../../domain/wardrobe/entities/wardrobe-item.entity';
import type { WardrobeRepository } from '../../../domain/wardrobe/ports/wardrobe.repository';
import type { Prisma } from '../../../generated/prisma/client';
import { isRecordNotFound } from '../prisma-errors';
import { PrismaService } from '../prisma.service';

/** Photos are always loaded with their item, main photo first. */
const include = {
  photos: { orderBy: [{ isMain: 'desc' }, { position: 'asc' }] },
} satisfies Prisma.WardrobeItemInclude;

type Row = Prisma.WardrobeItemGetPayload<{ include: typeof include }>;

// Taxonomy keys are validated by the shared schemas before being stored.
const toDomain = (row: Row): WardrobeItem => row as WardrobeItem;

const ORDER_BY: Record<
  WardrobeListQuery['sort'],
  Prisma.WardrobeItemOrderByWithRelationInput[]
> = {
  recent: [{ createdAt: 'desc' }, { id: 'desc' }],
  mostWorn: [{ wearCount: 'desc' }, { createdAt: 'desc' }, { id: 'desc' }],
  leastWorn: [{ wearCount: 'asc' }, { createdAt: 'desc' }, { id: 'desc' }],
  alphabetical: [{ name: { sort: 'asc', nulls: 'last' } }, { id: 'asc' }],
};

function toWhere(
  userId: string,
  { filters }: WardrobeListQuery,
): Prisma.WardrobeItemWhereInput {
  const and: Prisma.WardrobeItemWhereInput[] = [];
  if (filters.color?.length) {
    and.push({
      OR: [
        { primaryColor: { in: filters.color } },
        { secondaryColors: { hasSome: filters.color } },
      ],
    });
  }
  if (filters.q) {
    const contains = { contains: filters.q, mode: 'insensitive' as const };
    and.push({
      OR: [{ name: contains }, { brand: contains }, { subcategory: contains }],
    });
  }
  return {
    userId,
    ...(filters.category?.length && { category: { in: filters.category } }),
    ...(filters.status?.length && { status: { in: filters.status } }),
    ...(filters.season?.length && { seasons: { hasSome: filters.season } }),
    ...(filters.style?.length && { styles: { hasSome: filters.style } }),
    AND: and,
  };
}

@Injectable()
export class PrismaWardrobeRepository implements WardrobeRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    userId: string,
    fields: WardrobeItemFields,
  ): Promise<WardrobeItem> {
    return toDomain(
      await this.prisma.wardrobeItem.create({
        data: { ...fields, userId },
        include,
      }),
    );
  }

  async findOwned(userId: string, id: string): Promise<WardrobeItem | null> {
    const row = await this.prisma.wardrobeItem.findFirst({
      where: { id, userId },
      include,
    });
    return row && toDomain(row);
  }

  async list(userId: string, query: WardrobeListQuery) {
    const where = toWhere(userId, query);
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.wardrobeItem.findMany({
        where,
        include,
        orderBy: ORDER_BY[query.sort],
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.wardrobeItem.count({ where }),
    ]);
    return { items: rows.map(toDomain), total };
  }

  async updateOwned(
    userId: string,
    id: string,
    changes: WardrobeItemChanges,
  ): Promise<WardrobeItem | null> {
    try {
      // The owner is part of the unique filter: no update across users.
      return toDomain(
        await this.prisma.wardrobeItem.update({
          where: { id, userId },
          data: changes,
          include,
        }),
      );
    } catch (error) {
      if (isRecordNotFound(error)) return null;
      throw error;
    }
  }

  async deleteOwned(userId: string, id: string): Promise<boolean> {
    const { count } = await this.prisma.wardrobeItem.deleteMany({
      where: { id, userId },
    });
    return count === 1;
  }
}
