import { Injectable } from '@nestjs/common';
import type { NotificationKind } from '@klotho/shared';

import type {
  NewNotification,
  NotificationListQuery,
  NotificationMarker,
  NotificationRepository,
  StoredNotification,
  StoredNotificationData,
} from '../../../domain/notifications/ports/notification.repository';
import type {
  Notification as NotificationRow,
  Prisma,
} from '../../../generated/prisma/client';
import { PrismaService } from '../prisma.service';

// Kinds and data are written by the notification use cases only.
const toNotification = (row: NotificationRow): StoredNotification => ({
  id: row.id,
  userId: row.userId,
  kind: row.kind as NotificationKind,
  data: row.data as StoredNotificationData,
  readAt: row.readAt,
  createdAt: row.createdAt,
});

const NEWEST_FIRST = [
  { createdAt: 'desc' },
  { id: 'desc' },
] satisfies Prisma.NotificationOrderByWithRelationInput[];

@Injectable()
export class PrismaNotificationRepository implements NotificationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async list(
    userId: string,
    { kinds, page, pageSize }: NotificationListQuery,
  ): Promise<{ items: StoredNotification[]; total: number }> {
    const where: Prisma.NotificationWhereInput = {
      userId,
      ...(kinds && { kind: { in: kinds } }),
    };
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.notification.findMany({
        where,
        orderBy: NEWEST_FIRST,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.notification.count({ where }),
    ]);
    return { items: rows.map(toNotification), total };
  }

  countUnread(userId: string): Promise<number> {
    return this.prisma.notification.count({ where: { userId, readAt: null } });
  }

  async latest(userId: string): Promise<StoredNotification | null> {
    const row = await this.prisma.notification.findFirst({
      where: { userId },
      orderBy: NEWEST_FIRST,
    });
    return row && toNotification(row);
  }

  async create(userId: string, notification: NewNotification): Promise<void> {
    await this.prisma.notification.create({
      data: { userId, ...notification },
    });
  }

  async update(
    userId: string,
    id: string,
    changes: Pick<NewNotification, 'data' | 'createdAt'>,
  ): Promise<void> {
    await this.prisma.notification.updateMany({
      where: { id, userId },
      data: changes,
    });
  }

  async markers(
    userId: string,
  ): Promise<Partial<Record<NotificationKind, NotificationMarker>>> {
    const rows = await this.prisma.notificationMarker.findMany({
      where: { userId },
    });
    return Object.fromEntries(
      rows.map((row) => [row.kind, { createdAt: row.createdAt, ref: row.ref }]),
    );
  }

  async createOnce(
    userId: string,
    notification: NewNotification,
    since: Date,
    ref: string | null,
  ): Promise<boolean> {
    const { kind, createdAt } = notification;
    return this.prisma.$transaction(async (tx) => {
      // Claims the period: the row lock (or the primary key, for a first
      // one) lets a single concurrent request through.
      const { count: renewed } = await tx.notificationMarker.updateMany({
        where: { userId, kind, createdAt: { lt: since } },
        data: { createdAt, ref },
      });
      const claimed =
        renewed === 1 ||
        (
          await tx.notificationMarker.createMany({
            data: { userId, kind, createdAt, ref },
            skipDuplicates: true,
          })
        ).count === 1;
      if (!claimed) return false;
      await tx.notification.create({ data: { userId, ...notification } });
      return true;
    });
  }

  async markRead(userId: string, id: string, at: Date): Promise<boolean> {
    const found = await this.prisma.notification.findFirst({
      where: { id, userId },
      select: { readAt: true },
    });
    if (!found) return false;
    // Keeps the first reading date.
    if (found.readAt === null)
      await this.prisma.notification.updateMany({
        where: { id, userId, readAt: null },
        data: { readAt: at },
      });
    return true;
  }

  async markAllRead(userId: string, at: Date): Promise<void> {
    await this.prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: at },
    });
  }

  async delete(userId: string, id: string): Promise<boolean> {
    const { count } = await this.prisma.notification.deleteMany({
      where: { id, userId },
    });
    return count === 1;
  }
}
