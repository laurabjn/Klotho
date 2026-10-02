import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import {
  listNotificationsQuerySchema,
  notificationSettingsSchema,
  type AppNotification,
  type NotificationSettings,
  type Page,
} from '@klotho/shared';
import type { z } from 'zod';

import {
  CountUnreadNotificationsUseCase,
  DeleteNotificationUseCase,
  GetNotificationSettingsUseCase,
  ListNotificationsUseCase,
  MarkAllNotificationsReadUseCase,
  MarkNotificationReadUseCase,
  SaveNotificationSettingsUseCase,
} from '../../../application/notifications/notifications.use-cases';
import { CurrentUserId } from '../auth/current-user.decorator';
import { ZodValidationPipe } from '../validation/zod-validation.pipe';

@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly listNotifications: ListNotificationsUseCase,
    private readonly countUnread: CountUnreadNotificationsUseCase,
    private readonly markRead: MarkNotificationReadUseCase,
    private readonly markAllRead: MarkAllNotificationsReadUseCase,
    private readonly deleteNotification: DeleteNotificationUseCase,
    private readonly getSettings: GetNotificationSettingsUseCase,
    private readonly saveSettings: SaveNotificationSettingsUseCase,
  ) {}

  /** Newest first; creates the time-based ones that are due. */
  @Get()
  list(
    @CurrentUserId() userId: string,
    @Query(new ZodValidationPipe(listNotificationsQuerySchema))
    query: z.output<typeof listNotificationsQuerySchema>,
  ): Promise<Page<AppNotification>> {
    return this.listNotifications.execute(userId, query);
  }

  /** The bell's badge. */
  @Get('unread-count')
  unreadCount(@CurrentUserId() userId: string): Promise<{ count: number }> {
    return this.countUnread.execute(userId);
  }

  @Get('settings')
  settings(@CurrentUserId() userId: string): Promise<NotificationSettings> {
    return this.getSettings.execute(userId);
  }

  /** Replaces them. */
  @Put('settings')
  save(
    @CurrentUserId() userId: string,
    @Body(new ZodValidationPipe(notificationSettingsSchema))
    body: NotificationSettings,
  ): Promise<NotificationSettings> {
    return this.saveSettings.execute(userId, body);
  }

  @Post('read-all')
  @HttpCode(HttpStatus.NO_CONTENT)
  readAll(@CurrentUserId() userId: string): Promise<void> {
    return this.markAllRead.execute(userId);
  }

  /** Idempotent. */
  @Post(':id/read')
  @HttpCode(HttpStatus.NO_CONTENT)
  read(
    @CurrentUserId() userId: string,
    @Param('id') id: string,
  ): Promise<void> {
    return this.markRead.execute(userId, id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @CurrentUserId() userId: string,
    @Param('id') id: string,
  ): Promise<void> {
    return this.deleteNotification.execute(userId, id);
  }
}
