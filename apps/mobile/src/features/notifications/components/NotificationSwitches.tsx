import type { NotificationSettings } from '@klotho/shared';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { ChipGroup } from '@/components/ui/ChipGroup';
import { ToggleRow } from '@/features/profile/components/SettingsParts';
import { spacing } from '@/theme/tokens';

import {
  useNotificationSettings,
  useSaveNotificationSettings,
} from '../hooks/useNotifications';

const TIMES = ['07:00', '07:30', '08:00', '08:30', '09:00', '10:00'];

/**
 * The notification switches (Paramètres, and the first two in Moi), and
 * the time of the morning reminder.
 */
export function NotificationSwitches({ full = false }: { full?: boolean }) {
  const { t } = useTranslation();
  const settings = useNotificationSettings().data;
  const save = useSaveNotificationSettings();
  const denied = save.data?.reminders === 'denied';
  const unavailable = save.data?.reminders === 'unavailable';

  const set = (changes: Partial<NotificationSettings>) =>
    settings && save.mutate({ ...settings, ...changes });

  return (
    <>
      <ToggleRow
        icon="bell-outline"
        label={t('settings.notifications.tips')}
        value={settings?.tips ?? false}
        disabled={!settings}
        onPress={() => set({ tips: !settings?.tips })}
      />
      <ToggleRow
        icon="hanger"
        label={t('settings.notifications.reminders')}
        value={settings?.reminders ?? false}
        disabled={!settings}
        onPress={() => set({ reminders: !settings?.reminders })}
      />
      {full && settings?.reminders && (
        <View style={styles.time}>
          <AppText variant="hint">{t('notifications.reminderTime')}</AppText>
          <ChipGroup
            options={TIMES.map((value) => ({ value, label: value }))}
            value={settings.reminderTime}
            onChange={(reminderTime) => reminderTime && set({ reminderTime })}
          />
        </View>
      )}
      {full && (
        <ToggleRow
          icon="email-outline"
          label={t('settings.notifications.news')}
          value={settings?.news ?? false}
          disabled={!settings}
          onPress={() => set({ news: !settings?.news })}
        />
      )}
      {(denied || unavailable) && (
        <AppText variant="hint" style={styles.denied}>
          {denied
            ? t('notifications.permissionDenied')
            : t('notifications.expoGo')}
        </AppText>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  time: { gap: spacing.xs, paddingBottom: spacing.sm },
  denied: { paddingVertical: spacing.xs },
});
