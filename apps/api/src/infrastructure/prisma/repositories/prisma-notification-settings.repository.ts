import { Injectable } from '@nestjs/common';
import type { NotificationSettings } from '@klotho/shared';

import type { NotificationSettingsRepository } from '../../../domain/notifications/ports/notification-settings.repository';
import { isUniqueViolation } from '../prisma-errors';
import { PrismaService } from '../prisma.service';

@Injectable()
export class PrismaNotificationSettingsRepository implements NotificationSettingsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async find(userId: string): Promise<NotificationSettings | null> {
    return this.prisma.notificationSettings.findUnique({
      where: { userId },
      select: { tips: true, reminders: true, news: true, reminderTime: true },
    });
  }

  async save(userId: string, settings: NotificationSettings): Promise<void> {
    const upsert = () =>
      this.prisma.notificationSettings.upsert({
        where: { userId },
        create: { userId, ...settings },
        update: settings,
      });
    try {
      await upsert();
    } catch (error) {
      // Saved twice at once: the first created them, update them.
      if (!isUniqueViolation(error)) throw error;
      await upsert();
    }
  }
}
