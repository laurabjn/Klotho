import { router } from 'expo-router';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { useNotificationSettings } from '../hooks/useNotifications';
import { phoneNotifications } from './phone-notifications';
import { syncReminders } from './reminders';

// A reminder arriving while the app is open is shown like the others.
phoneNotifications()?.setNotificationHandler({
  handleNotification: () =>
    Promise.resolve({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
});

/**
 * Signed in: pressing a reminder opens its screen, and the reminders are
 * scheduled again with the saved settings (and the current language).
 */
export function useNotificationSetup() {
  const { i18n } = useTranslation();
  const settings = useNotificationSettings().data;

  useEffect(() => {
    const Notifications = phoneNotifications();
    if (!Notifications) return;
    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const url = response.notification.request.content.data?.url;
        if (typeof url === 'string') router.push(url);
      },
    );
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    // Without asking: the permission is only requested from the settings.
    const Notifications = phoneNotifications();
    if (!settings || !Notifications) return;
    void Notifications.getPermissionsAsync().then((permission) => {
      if (permission.granted || !settings.reminders)
        return syncReminders(settings);
    });
  }, [settings, i18n.language]);
}
