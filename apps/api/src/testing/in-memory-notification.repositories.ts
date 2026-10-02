import type { NotificationKind, NotificationSettings } from '@klotho/shared';

import type { NotificationSettingsRepository } from '../domain/notifications/ports/notification-settings.repository';
import type {
  NewNotification,
  NotificationListQuery,
  NotificationMarker,
  NotificationRepository,
  StoredNotification,
} from '../domain/notifications/ports/notification.repository';
import type { Notifier } from '../domain/notifications/ports/notifier';

const newestFirst = (a: StoredNotification, b: StoredNotification) =>
  b.createdAt.getTime() - a.createdAt.getTime() || b.id.localeCompare(a.id);

/** Same semantics as PrismaNotificationRepository, in memory. */
export class InMemoryNotificationRepository implements NotificationRepository {
  readonly notifications: StoredNotification[] = [];
  readonly markerRows = new Map<string, NotificationMarker>();
  /** When set, every method fails (database outage). */
  failing = false;
  private sequence = 0;

  private copy = (notification: StoredNotification): StoredNotification => ({
    ...notification,
    data: { ...notification.data },
  });

  private mine(userId: string, id: string) {
    return this.notifications.find((n) => n.id === id && n.userId === userId);
  }

  private check(): Promise<void> {
    return this.failing
      ? Promise.reject(new Error('database is down'))
      : Promise.resolve();
  }

  async list(userId: string, { kinds, page, pageSize }: NotificationListQuery) {
    await this.check();
    const matching = this.notifications
      .filter((n) => n.userId === userId && (!kinds || kinds.includes(n.kind)))
      .sort(newestFirst);
    const start = (page - 1) * pageSize;
    return {
      items: matching.slice(start, start + pageSize).map(this.copy),
      total: matching.length,
    };
  }

  async countUnread(userId: string): Promise<number> {
    await this.check();
    return this.notifications.filter(
      (n) => n.userId === userId && n.readAt === null,
    ).length;
  }

  async latest(userId: string): Promise<StoredNotification | null> {
    await this.check();
    const [latest] = this.notifications
      .filter((n) => n.userId === userId)
      .sort(newestFirst);
    return latest ? this.copy(latest) : null;
  }

  async create(userId: string, notification: NewNotification): Promise<void> {
    await this.check();
    this.notifications.push({
      ...notification,
      data: { ...notification.data },
      id: `notification-${String(++this.sequence).padStart(4, '0')}`,
      userId,
      readAt: null,
    });
  }

  async update(
    userId: string,
    id: string,
    changes: Pick<NewNotification, 'data' | 'createdAt'>,
  ): Promise<void> {
    await this.check();
    const notification = this.mine(userId, id);
    if (notification) Object.assign(notification, changes);
  }

  async markers(userId: string) {
    await this.check();
    const markers: Partial<Record<NotificationKind, NotificationMarker>> = {};
    for (const [key, marker] of this.markerRows) {
      const [owner, kind] = key.split('|') as [string, NotificationKind];
      if (owner === userId) markers[kind] = { ...marker };
    }
    return markers;
  }

  async createOnce(
    userId: string,
    notification: NewNotification,
    since: Date,
    ref: string | null,
  ): Promise<boolean> {
    await this.check();
    const key = `${userId}|${notification.kind}`;
    const marker = this.markerRows.get(key);
    if (marker && marker.createdAt >= since) return false;
    this.markerRows.set(key, { createdAt: notification.createdAt, ref });
    await this.create(userId, notification);
    return true;
  }

  async markRead(userId: string, id: string, at: Date): Promise<boolean> {
    await this.check();
    const notification = this.mine(userId, id);
    if (notification) notification.readAt ??= at;
    return Boolean(notification);
  }

  async markAllRead(userId: string, at: Date): Promise<void> {
    await this.check();
    for (const n of this.notifications)
      if (n.userId === userId) n.readAt ??= at;
  }

  async delete(userId: string, id: string): Promise<boolean> {
    await this.check();
    const notification = this.mine(userId, id);
    if (notification)
      this.notifications.splice(this.notifications.indexOf(notification), 1);
    return Boolean(notification);
  }

  /** The user's notifications, newest first. */
  of(userId: string): StoredNotification[] {
    return this.notifications
      .filter((n) => n.userId === userId)
      .sort(newestFirst)
      .map(this.copy);
  }
}

export class InMemoryNotificationSettingsRepository implements NotificationSettingsRepository {
  readonly rows = new Map<string, NotificationSettings>();

  find(userId: string): Promise<NotificationSettings | null> {
    const found = this.rows.get(userId);
    return Promise.resolve(found ? { ...found } : null);
  }

  save(userId: string, settings: NotificationSettings): Promise<void> {
    this.rows.set(userId, { ...settings });
    return Promise.resolve();
  }
}

type NotifierCall = {
  [K in keyof Notifier]: {
    kind: K;
    userId: string;
    data: Parameters<Notifier[K]>[1];
  };
}[keyof Notifier];

/** Records what the use cases notify. */
export class SpyNotifier implements Notifier {
  readonly calls: NotifierCall[] = [];

  outfitsGenerated(userId: string, data: { count: number; outfitId: string }) {
    this.calls.push({ kind: 'outfitsGenerated', userId, data });
    return Promise.resolve();
  }

  weekPlanned(userId: string, data: { count: number; outfitId: string }) {
    this.calls.push({ kind: 'weekPlanned', userId, data });
    return Promise.resolve();
  }

  pieceAvailable(
    userId: string,
    data: { itemId: string; itemName: string | null },
  ) {
    this.calls.push({ kind: 'pieceAvailable', userId, data });
    return Promise.resolve();
  }
}
