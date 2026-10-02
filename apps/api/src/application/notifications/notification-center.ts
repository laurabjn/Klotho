import {
  notificationSettingsSchema,
  type NotificationKind,
  type NotificationSettings,
} from '@klotho/shared';

import {
  isEnabled,
  joinsLatest,
} from '../../domain/notifications/notification-rules';
import type { NotificationSettingsRepository } from '../../domain/notifications/ports/notification-settings.repository';
import type { NotificationRepository } from '../../domain/notifications/ports/notification.repository';
import type { Notifier } from '../../domain/notifications/ports/notifier';
import type { Clock } from '../../domain/shared/ports/clock';

/**
 * Told when a notification could not be created ('timely': loading what the
 * time-based ones need); never receives its data.
 */
export type NotificationFailureReporter = (failure: {
  kind: NotificationKind | 'timely';
  error: unknown;
}) => void;

/** The user's settings, or the defaults when she never changed them. */
export async function settingsOf(
  settings: NotificationSettingsRepository,
  userId: string,
): Promise<NotificationSettings> {
  return (await settings.find(userId)) ?? notificationSettingsSchema.parse({});
}

/** Creates the notifications of the user's actions, if her settings allow. */
export class NotificationCenter implements Notifier {
  constructor(
    private readonly notifications: NotificationRepository,
    private readonly settings: NotificationSettingsRepository,
    private readonly clock: Clock,
    private readonly reportFailure: NotificationFailureReporter = () => {},
  ) {}

  /** Generations close together make one notification, not a series. */
  outfitsGenerated(
    userId: string,
    { count, outfitId }: { count: number; outfitId: string },
  ): Promise<void> {
    return this.notify(userId, 'outfitsGenerated', async (now) => {
      const latest = await this.notifications.latest(userId);
      if (joinsLatest(latest, now)) {
        await this.notifications.update(userId, latest.id, {
          data: { count: (latest.data.count ?? 0) + count, outfitId },
          createdAt: now,
        });
        return;
      }
      await this.notifications.create(userId, {
        kind: 'outfitsGenerated',
        data: { count, outfitId },
        createdAt: now,
      });
    });
  }

  weekPlanned(
    userId: string,
    data: { count: number; outfitId: string },
  ): Promise<void> {
    return this.notify(userId, 'weekPlanned', (now) =>
      this.notifications.create(userId, {
        kind: 'weekPlanned',
        data,
        createdAt: now,
      }),
    );
  }

  pieceAvailable(
    userId: string,
    data: { itemId: string; itemName: string | null },
  ): Promise<void> {
    return this.notify(userId, 'pieceAvailable', (now) =>
      this.notifications.create(userId, {
        kind: 'pieceAvailable',
        data,
        createdAt: now,
      }),
    );
  }

  private async notify(
    userId: string,
    kind: NotificationKind,
    create: (now: Date) => Promise<void>,
  ): Promise<void> {
    try {
      if (!isEnabled(kind, await settingsOf(this.settings, userId))) return;
      await create(this.clock.now());
    } catch (error) {
      this.reportFailure({ kind, error });
    }
  }
}
