import type { NotificationKind } from '@klotho/shared';

import {
  FORGOTTEN_AFTER_MS,
  FORGOTTEN_EVERY_MS,
  startOfUtcDay,
  weeksBetween,
} from '../../domain/notifications/notification-rules';
import type { NotificationSettingsRepository } from '../../domain/notifications/ports/notification-settings.repository';
import type {
  NotificationMarker,
  NotificationRepository,
} from '../../domain/notifications/ports/notification.repository';
import type { OutfitRepository } from '../../domain/outfits/ports/outfit.repository';
import { dayOf } from '../../domain/planning/calendar';
import type { OutfitPlanRepository } from '../../domain/planning/ports/outfit-plan.repository';
import type { Clock } from '../../domain/shared/ports/clock';
import type { WardrobeRepository } from '../../domain/wardrobe/ports/wardrobe.repository';
import {
  settingsOf,
  type NotificationFailureReporter,
} from './notification-center';

/**
 * The notifications that depend on time rather than on an action, created
 * lazily when the user reads her notifications:
 * - dailyOutfit: once a calendar day (the server's, UTC), when a look is
 *   planned that day or was generated that day;
 * - forgottenPiece: once a week at most, the available piece least
 *   recently worn for 3 weeks, never the same one twice in a row.
 * Each is created at most once per period, even under concurrent requests
 * and even if the user deleted it (markers of the repository).
 */
export class TimelyNotifications {
  constructor(
    private readonly notifications: NotificationRepository,
    private readonly settings: NotificationSettingsRepository,
    private readonly plans: OutfitPlanRepository,
    private readonly outfits: OutfitRepository,
    private readonly wardrobe: WardrobeRepository,
    private readonly clock: Clock,
    private readonly reportFailure: NotificationFailureReporter = () => {},
  ) {}

  /** Never rejects: reading the notifications must keep working. */
  async ensure(userId: string): Promise<void> {
    const loaded = await this.attempt('timely', async () => ({
      settings: await settingsOf(this.settings, userId),
      markers: await this.notifications.markers(userId),
    }));
    if (!loaded) return;
    const { settings, markers } = loaded;
    const now = this.clock.now();
    if (settings.reminders)
      await this.attempt('dailyOutfit', () =>
        this.dailyOutfit(userId, now, markers.dailyOutfit),
      );
    if (settings.tips)
      await this.attempt('forgottenPiece', () =>
        this.forgottenPiece(userId, now, markers.forgottenPiece),
      );
  }

  private async attempt<T>(
    kind: NotificationKind | 'timely',
    run: () => Promise<T>,
  ): Promise<T | null> {
    try {
      return await run();
    } catch (error) {
      this.reportFailure({ kind, error });
      return null;
    }
  }

  private async dailyOutfit(
    userId: string,
    now: Date,
    marker: NotificationMarker | undefined,
  ): Promise<void> {
    const today = startOfUtcDay(now);
    if (marker && marker.createdAt >= today) return;
    const outfitId = await this.outfitOfToday(userId, now);
    if (!outfitId) return;
    await this.notifications.createOnce(
      userId,
      { kind: 'dailyOutfit', data: { outfitId }, createdAt: now },
      today,
      null,
    );
  }

  /** The look planned today, else the last one generated today. */
  private async outfitOfToday(
    userId: string,
    now: Date,
  ): Promise<string | null> {
    const plan = await this.plans.findByDay(userId, dayOf(now));
    if (plan) return plan.outfitId;
    const {
      items: [latest],
    } = await this.outfits.list(userId, {
      filter: 'generated',
      page: 1,
      pageSize: 1,
    });
    return latest && latest.createdAt >= startOfUtcDay(now) ? latest.id : null;
  }

  private async forgottenPiece(
    userId: string,
    now: Date,
    marker: NotificationMarker | undefined,
  ): Promise<void> {
    const since = new Date(now.getTime() - FORGOTTEN_EVERY_MS);
    if (marker && marker.createdAt >= since) return;
    // Two: the first one may be the piece of the previous notification.
    const candidates = await this.wardrobe.findForgotten(
      userId,
      new Date(now.getTime() - FORGOTTEN_AFTER_MS),
      2,
    );
    const piece = candidates.find((item) => item.id !== marker?.ref);
    if (!piece) return;
    await this.notifications.createOnce(
      userId,
      {
        kind: 'forgottenPiece',
        data: {
          itemId: piece.id,
          itemName: piece.name,
          weeks: weeksBetween(piece.lastWornAt ?? piece.createdAt, now),
        },
        createdAt: now,
      },
      since,
      piece.id,
    );
  }
}
