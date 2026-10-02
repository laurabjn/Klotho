import { Logger, Module } from '@nestjs/common';

import {
  NotificationCenter,
  type NotificationFailureReporter,
} from '../../../application/notifications/notification-center';
import {
  CountUnreadNotificationsUseCase,
  DeleteNotificationUseCase,
  GetNotificationSettingsUseCase,
  ListNotificationsUseCase,
  MarkAllNotificationsReadUseCase,
  MarkNotificationReadUseCase,
  SaveNotificationSettingsUseCase,
} from '../../../application/notifications/notifications.use-cases';
import { TimelyNotifications } from '../../../application/notifications/timely-notifications';
import {
  NOTIFICATION_SETTINGS_REPOSITORY,
  type NotificationSettingsRepository,
} from '../../../domain/notifications/ports/notification-settings.repository';
import {
  NOTIFICATION_REPOSITORY,
  type NotificationRepository,
} from '../../../domain/notifications/ports/notification.repository';
import { NOTIFIER } from '../../../domain/notifications/ports/notifier';
import {
  OUTFIT_REPOSITORY,
  type OutfitRepository,
} from '../../../domain/outfits/ports/outfit.repository';
import {
  OUTFIT_PLAN_REPOSITORY,
  type OutfitPlanRepository,
} from '../../../domain/planning/ports/outfit-plan.repository';
import { CLOCK, type Clock } from '../../../domain/shared/ports/clock';
import {
  FILE_STORAGE,
  type FileStorage,
} from '../../../domain/storage/ports/file-storage';
import {
  WARDROBE_REPOSITORY,
  type WardrobeRepository,
} from '../../../domain/wardrobe/ports/wardrobe.repository';
import { NotificationsController } from './notifications.controller';

const logger = new Logger('Notifications');

// Kind and error name only: never the user, the data or the message.
const reportFailure: NotificationFailureReporter = ({ kind, error }) =>
  logger.warn(
    `Notification ${kind} failed: ${error instanceof Error ? error.name : typeof error}`,
  );

@Module({
  controllers: [NotificationsController],
  providers: [
    {
      provide: NOTIFIER,
      inject: [
        NOTIFICATION_REPOSITORY,
        NOTIFICATION_SETTINGS_REPOSITORY,
        CLOCK,
      ],
      useFactory: (
        notifications: NotificationRepository,
        settings: NotificationSettingsRepository,
        clock: Clock,
      ) =>
        new NotificationCenter(notifications, settings, clock, reportFailure),
    },
    {
      provide: TimelyNotifications,
      inject: [
        NOTIFICATION_REPOSITORY,
        NOTIFICATION_SETTINGS_REPOSITORY,
        OUTFIT_PLAN_REPOSITORY,
        OUTFIT_REPOSITORY,
        WARDROBE_REPOSITORY,
        CLOCK,
      ],
      useFactory: (
        notifications: NotificationRepository,
        settings: NotificationSettingsRepository,
        plans: OutfitPlanRepository,
        outfits: OutfitRepository,
        wardrobe: WardrobeRepository,
        clock: Clock,
      ) =>
        new TimelyNotifications(
          notifications,
          settings,
          plans,
          outfits,
          wardrobe,
          clock,
          reportFailure,
        ),
    },
    {
      provide: ListNotificationsUseCase,
      inject: [
        NOTIFICATION_REPOSITORY,
        TimelyNotifications,
        WARDROBE_REPOSITORY,
        OUTFIT_REPOSITORY,
        FILE_STORAGE,
      ],
      useFactory: (
        notifications: NotificationRepository,
        timely: TimelyNotifications,
        wardrobe: WardrobeRepository,
        outfits: OutfitRepository,
        storage: FileStorage,
      ) =>
        new ListNotificationsUseCase(
          notifications,
          timely,
          wardrobe,
          outfits,
          storage,
        ),
    },
    {
      provide: CountUnreadNotificationsUseCase,
      inject: [NOTIFICATION_REPOSITORY, TimelyNotifications],
      useFactory: (
        notifications: NotificationRepository,
        timely: TimelyNotifications,
      ) => new CountUnreadNotificationsUseCase(notifications, timely),
    },
    ...[MarkNotificationReadUseCase, MarkAllNotificationsReadUseCase].map(
      (UseCase) => ({
        provide: UseCase,
        inject: [NOTIFICATION_REPOSITORY, CLOCK],
        useFactory: (notifications: NotificationRepository, clock: Clock) =>
          new UseCase(notifications, clock),
      }),
    ),
    {
      provide: DeleteNotificationUseCase,
      inject: [NOTIFICATION_REPOSITORY],
      useFactory: (notifications: NotificationRepository) =>
        new DeleteNotificationUseCase(notifications),
    },
    ...[GetNotificationSettingsUseCase, SaveNotificationSettingsUseCase].map(
      (UseCase) => ({
        provide: UseCase,
        inject: [NOTIFICATION_SETTINGS_REPOSITORY],
        useFactory: (settings: NotificationSettingsRepository) =>
          new UseCase(settings),
      }),
    ),
  ],
  // The outfit, planning and wardrobe use cases notify.
  exports: [NOTIFIER],
})
export class NotificationsModule {}
