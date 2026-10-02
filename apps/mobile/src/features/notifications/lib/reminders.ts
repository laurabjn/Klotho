import type { NotificationSettings } from '@klotho/shared';
import type * as NotificationsModule from 'expo-notifications';

import i18n from '@/i18n';

import { phoneNotifications } from './phone-notifications';

const DAILY = 'klotho.daily-outfit';
const WEEKLY = 'klotho.plan-week';
/** Sunday evening: time to plan the week. */
const WEEKLY_AT = { weekday: 1, hour: 18, minute: 0 };

/**
 * The phone's own reminders (scheduled on the device, so they also work
 * offline; not in Expo Go, see phone-notifications): the look of the day
 * every morning, and on Sunday evening an invitation to plan the week.
 */
export async function syncReminders(
  settings: Pick<NotificationSettings, 'reminders' | 'reminderTime'>,
): Promise<'scheduled' | 'off' | 'denied' | 'unavailable'> {
  const Notifications = phoneNotifications();
  if (!Notifications) return 'unavailable';
  await Promise.all(
    [DAILY, WEEKLY].map((id) =>
      Notifications.cancelScheduledNotificationAsync(id).catch(() => undefined),
    ),
  );
  if (!settings.reminders) return 'off';

  if (!(await allowed(Notifications))) return 'denied';
  const [hour, minute] = settings.reminderTime.split(':').map(Number);
  await Notifications.scheduleNotificationAsync({
    identifier: DAILY,
    content: {
      title: i18n.t('notifications.local.daily.title'),
      body: i18n.t('notifications.local.daily.body'),
      data: { url: '/' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: hour!,
      minute: minute!,
    },
  });
  await Notifications.scheduleNotificationAsync({
    identifier: WEEKLY,
    content: {
      title: i18n.t('notifications.local.weekly.title'),
      body: i18n.t('notifications.local.weekly.body'),
      data: { url: '/calendar' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
      ...WEEKLY_AT,
    },
  });
  return 'scheduled';
}

/** Asks for the permission once; a refusal is respected. */
async function allowed(
  Notifications: typeof NotificationsModule,
): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  return (await Notifications.requestPermissionsAsync()).granted;
}
