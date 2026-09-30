import { Injectable } from '@nestjs/common';

import type { WardrobePhoto } from '../../../domain/wardrobe/entities/wardrobe-item.entity';
import type {
  NewWardrobePhoto,
  WardrobePhotoRepository,
} from '../../../domain/wardrobe/ports/wardrobe-photo.repository';
import { UploadNotFoundError } from '../../../domain/storage/errors';
import { isUniqueViolation } from '../prisma-errors';
import { PrismaService } from '../prisma.service';

@Injectable()
export class PrismaWardrobePhotoRepository implements WardrobePhotoRepository {
  constructor(private readonly prisma: PrismaService) {}

  async add(
    photo: NewWardrobePhoto,
    max: number,
  ): Promise<WardrobePhoto | null> {
    try {
      return await this.addInTransaction(photo, max);
    } catch (error) {
      // An upload can only be attached once (unique storage key).
      if (isUniqueViolation(error)) throw new UploadNotFoundError();
      throw error;
    }
  }

  private addInTransaction(photo: NewWardrobePhoto, max: number) {
    return this.prisma.$transaction(async (tx) => {
      // Locks the item row: concurrent additions are serialised, so the
      // count, the position and the "main" flag stay consistent.
      await tx.$queryRaw`SELECT id FROM "WardrobeItem" WHERE id = ${photo.itemId} FOR UPDATE`;

      const existing = await tx.wardrobeItemPhoto.findMany({
        where: { itemId: photo.itemId },
        select: { position: true },
      });
      if (existing.length >= max) return null;

      return tx.wardrobeItemPhoto.create({
        data: {
          ...photo,
          position: Math.max(-1, ...existing.map((p) => p.position)) + 1,
          isMain: existing.length === 0,
        },
      });
    });
  }

  find(itemId: string, photoId: string): Promise<WardrobePhoto | null> {
    return this.prisma.wardrobeItemPhoto.findFirst({
      where: { id: photoId, itemId },
    });
  }

  async remove(itemId: string, photoId: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const removed = await tx.wardrobeItemPhoto.delete({
        where: { id: photoId, itemId },
      });
      if (!removed.isMain) return;
      const next = await tx.wardrobeItemPhoto.findFirst({
        where: { itemId },
        orderBy: { position: 'asc' },
      });
      if (next) {
        await tx.wardrobeItemPhoto.update({
          where: { id: next.id },
          data: { isMain: true },
        });
      }
    });
  }

  async setMain(itemId: string, photoId: string): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.wardrobeItemPhoto.updateMany({
        where: { itemId, isMain: true },
        data: { isMain: false },
      }),
      this.prisma.wardrobeItemPhoto.update({
        where: { id: photoId, itemId },
        data: { isMain: true },
      }),
    ]);
  }
}
