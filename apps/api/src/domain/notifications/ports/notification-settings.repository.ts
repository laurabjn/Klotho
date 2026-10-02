import type { NotificationSettings } from '@klotho/shared';

/** One row per user, only once she changed them. */
export interface NotificationSettingsRepository {
  /** null: never saved (the defaults apply). */
  find(userId: string): Promise<NotificationSettings | null>;
  save(userId: string, settings: NotificationSettings): Promise<void>;
}

export const NOTIFICATION_SETTINGS_REPOSITORY = Symbol(
  'NotificationSettingsRepository',
);
