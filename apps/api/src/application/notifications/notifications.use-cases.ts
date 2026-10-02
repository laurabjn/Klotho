import {
  CATEGORY_OF,
  NOTIFICATION_KINDS,
  type AppNotification,
  type NotificationCategory,
  type NotificationSettings,
  type Page,
} from '@klotho/shared';

import { NotificationNotFoundError } from '../../domain/notifications/errors';
import type { NotificationSettingsRepository } from '../../domain/notifications/ports/notification-settings.repository';
import type {
  NotificationRepository,
  StoredNotification,
} from '../../domain/notifications/ports/notification.repository';
import type { OutfitRepository } from '../../domain/outfits/ports/outfit.repository';
import type { Clock } from '../../domain/shared/ports/clock';
import type { FileStorage } from '../../domain/storage/ports/file-storage';
import type { WardrobeRepository } from '../../domain/wardrobe/ports/wardrobe.repository';
import { settingsOf } from './notification-center';
import type { TimelyNotifications } from './timely-notifications';

export interface ListNotificationsQuery {
  category: NotificationCategory;
  page: number;
  pageSize: number;
}

/**
 * The notification centre, newest first. Each one is illustrated with the
 * main photo of its piece, or the first photo of its look, signed now.
 */
export class ListNotificationsUseCase {
  constructor(
    private readonly notifications: NotificationRepository,
    private readonly timely: TimelyNotifications,
    private readonly wardrobe: WardrobeRepository,
    private readonly outfits: OutfitRepository,
    private readonly storage: Pick<FileStorage, 'signedUrl'>,
  ) {}

  async execute(
    userId: string,
    { category, page, pageSize }: ListNotificationsQuery,
  ): Promise<Page<AppNotification>> {
    await this.timely.ensure(userId);
    const { items, total } = await this.notifications.list(userId, {
      kinds:
        category === 'all'
          ? undefined
          : NOTIFICATION_KINDS.filter((kind) => CATEGORY_OF[kind] === category),
      page,
      pageSize,
    });
    const imageOf = await this.images(userId, items);
    return {
      items: items.map((notification) => ({
        id: notification.id,
        kind: notification.kind,
        category: CATEGORY_OF[notification.kind],
        data: { ...notification.data, imageUrl: imageOf(notification) },
        read: notification.readAt !== null,
        createdAt: notification.createdAt.toISOString(),
      })),
      total,
      page,
      pageSize,
      hasMore: page * pageSize < total,
    };
  }

  /** Two queries at most for the page, then one signature per photo. */
  private async images(
    userId: string,
    notifications: StoredNotification[],
  ): Promise<(notification: StoredNotification) => string | null> {
    const outfitIds = notifications.flatMap(({ data }) =>
      !data.itemId && data.outfitId ? [data.outfitId] : [],
    );
    const needsPieces =
      outfitIds.length > 0 || notifications.some(({ data }) => data.itemId);
    if (!needsPieces) return () => null;

    const [items, outfits] = await Promise.all([
      this.wardrobe.findAllOwned(userId),
      outfitIds.length > 0
        ? this.outfits.findManyOwned(userId, [...new Set(outfitIds)])
        : [],
    ]);
    // Photos come main first.
    const photoOf = new Map(
      items.flatMap((item) =>
        item.photos[0] ? [[item.id, item.photos[0].storageKey] as const] : [],
      ),
    );
    const lookPhotoOf = new Map(
      outfits.flatMap((outfit) => {
        const key = outfit.pieces
          .map((piece) => photoOf.get(piece.itemId))
          .find((found) => found !== undefined);
        return key ? [[outfit.id, key] as const] : [];
      }),
    );
    const keyOf = ({ data }: StoredNotification) =>
      data.itemId
        ? photoOf.get(data.itemId)
        : data.outfitId
          ? lookPhotoOf.get(data.outfitId)
          : undefined;

    const keys = [...new Set(notifications.flatMap((n) => keyOf(n) ?? []))];
    const urls = new Map(
      await Promise.all(
        keys.map(
          async (key) => [key, await this.storage.signedUrl(key)] as const,
        ),
      ),
    );
    return (notification) => {
      const key = keyOf(notification);
      return (key && urls.get(key)) ?? null;
    };
  }
}

/** The badge of the bell. */
export class CountUnreadNotificationsUseCase {
  constructor(
    private readonly notifications: NotificationRepository,
    private readonly timely: TimelyNotifications,
  ) {}

  async execute(userId: string): Promise<{ count: number }> {
    await this.timely.ensure(userId);
    return { count: await this.notifications.countUnread(userId) };
  }
}

/** Idempotent. */
export class MarkNotificationReadUseCase {
  constructor(
    private readonly notifications: NotificationRepository,
    private readonly clock: Clock,
  ) {}

  async execute(userId: string, id: string): Promise<void> {
    if (!(await this.notifications.markRead(userId, id, this.clock.now())))
      throw new NotificationNotFoundError();
  }
}

export class MarkAllNotificationsReadUseCase {
  constructor(
    private readonly notifications: NotificationRepository,
    private readonly clock: Clock,
  ) {}

  execute(userId: string): Promise<void> {
    return this.notifications.markAllRead(userId, this.clock.now());
  }
}

export class DeleteNotificationUseCase {
  constructor(private readonly notifications: NotificationRepository) {}

  async execute(userId: string, id: string): Promise<void> {
    if (!(await this.notifications.delete(userId, id)))
      throw new NotificationNotFoundError();
  }
}

/** The defaults until the user changes them. */
export class GetNotificationSettingsUseCase {
  constructor(private readonly settings: NotificationSettingsRepository) {}

  execute(userId: string): Promise<NotificationSettings> {
    return settingsOf(this.settings, userId);
  }
}

/** Replaces them. */
export class SaveNotificationSettingsUseCase {
  constructor(private readonly settings: NotificationSettingsRepository) {}

  async execute(
    userId: string,
    settings: NotificationSettings,
  ): Promise<NotificationSettings> {
    await this.settings.save(userId, settings);
    return settings;
  }
}
