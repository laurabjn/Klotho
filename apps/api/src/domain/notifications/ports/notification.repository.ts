import type { NotificationData, NotificationKind } from '@klotho/shared';

/** What is stored: never a signed URL, the photo is found when read. */
export type StoredNotificationData = Omit<NotificationData, 'imageUrl'>;

export interface NewNotification {
  kind: NotificationKind;
  data: StoredNotificationData;
  createdAt: Date;
}

export interface StoredNotification extends NewNotification {
  id: string;
  userId: string;
  readAt: Date | null;
}

/** When a kind was last created for a user, even if deleted since. */
export interface NotificationMarker {
  createdAt: Date;
  /** What it was about (the piece of a forgottenPiece). */
  ref: string | null;
}

export interface NotificationListQuery {
  /** Every kind when omitted. */
  kinds?: NotificationKind[];
  page: number;
  pageSize: number;
}

/** Every method is scoped to an owner: another user's notification is a missing one. */
export interface NotificationRepository {
  /** Newest first. */
  list(
    userId: string,
    query: NotificationListQuery,
  ): Promise<{ items: StoredNotification[]; total: number }>;
  countUnread(userId: string): Promise<number>;
  /** The user's newest notification. */
  latest(userId: string): Promise<StoredNotification | null>;
  create(userId: string, notification: NewNotification): Promise<void>;
  /** Replaces the data and the date of a notification (grouping). */
  update(
    userId: string,
    id: string,
    changes: Pick<NewNotification, 'data' | 'createdAt'>,
  ): Promise<void>;
  /** Markers of the kinds created through createOnce. */
  markers(
    userId: string,
  ): Promise<Partial<Record<NotificationKind, NotificationMarker>>>;
  /**
   * Creates the notification unless one of its kind was created through
   * this method after `since` (even if deleted since), and records it.
   * Atomic: concurrent calls create at most one. Returns whether it did.
   */
  createOnce(
    userId: string,
    notification: NewNotification,
    since: Date,
    ref: string | null,
  ): Promise<boolean>;
  /** Idempotent; false when it does not exist or is someone else's. */
  markRead(userId: string, id: string, at: Date): Promise<boolean>;
  markAllRead(userId: string, at: Date): Promise<void>;
  /** False when it does not exist or is someone else's. */
  delete(userId: string, id: string): Promise<boolean>;
}

export const NOTIFICATION_REPOSITORY = Symbol('NotificationRepository');
