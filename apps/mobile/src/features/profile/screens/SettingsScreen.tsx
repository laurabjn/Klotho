import type { Locale } from '@klotho/i18n';
import type { TemperatureUnit } from '@klotho/shared';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Linking, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/brand/AppHeader';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { ScrollPage } from '@/components/ui/ScrollToTop';
import {
  useSaveWeatherSettings,
  useWeatherSettings,
} from '@/features/weather/hooks/useWeatherSettings';
import { useWeatherSyncStore } from '@/features/weather/store/weather-sync.store';
import { setLanguage } from '@/lib/language';
import { colors, spacing } from '@/theme/tokens';

import {
  MenuRow,
  SegmentRow,
  SettingsCard,
  ToggleRow,
} from '../components/SettingsParts';

/** Set in `.env` once the contact address exists. */
export const CONTACT_EMAIL = process.env.EXPO_PUBLIC_CONTACT_EMAIL;

/** Opens the mail app; false when there is no address yet. */
export function contactUs(): boolean {
  if (!CONTACT_EMAIL) return false;
  void Linking.openURL(`mailto:${CONTACT_EMAIL}?subject=Klotho`);
  return true;
}

/** "Paramètres", as on the mockup. */
export function SettingsScreen() {
  const { t, i18n } = useTranslation();
  const weather = useWeatherSettings();
  const saveWeather = useSaveWeatherSettings();
  const [dialog, setDialog] = useState<'soon' | 'contact' | null>(null);
  const weatherSync = useWeatherSyncStore((state) => state.enabled);
  const setWeatherSync = useWeatherSyncStore((state) => state.setEnabled);
  const unit = weather.data?.temperatureUnit ?? 'celsius';
  const location =
    weather.data?.locationMode === 'device'
      ? t('settings.preferences.locationDevice')
      : weather.data?.city
        ? [weather.data.city.name, weather.data.city.country]
            .filter(Boolean)
            .join(', ')
        : t('settings.preferences.locationNone');

  const setUnit = (temperatureUnit: TemperatureUnit) => {
    if (weather.data && temperatureUnit !== unit)
      saveWeather.mutate({ ...weather.data, temperatureUnit });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollPage contentContainerStyle={styles.content}>
        <AppHeader />
        <ScreenHeader
          title={t('settings.title')}
          overline={t('settings.overline')}
        />

        <SettingsCard
          title={t('settings.account.title')}
          overline={t('settings.account.overline')}
        >
          <MenuRow
            icon="account-outline"
            label={t('settings.account.profile')}
            onPress={() => router.push('/profile/edit')}
          />
          <MenuRow
            icon="email-outline"
            label={t('settings.account.email')}
            onPress={() => router.push('/account/email')}
          />
          <MenuRow
            icon="lock-outline"
            label={t('settings.account.password')}
            onPress={() => router.push('/account/password')}
          />
          <MenuRow
            icon="trash-can-outline"
            label={t('settings.account.delete')}
            onPress={() => router.push('/privacy')}
          />
        </SettingsCard>

        <SettingsCard
          title={t('settings.preferences.title')}
          overline={t('settings.preferences.overline')}
        >
          <SegmentRow<Locale>
            icon="web"
            label={t('settings.preferences.language')}
            options={[
              { value: 'fr', label: t('settings.languages.fr') },
              { value: 'en', label: t('settings.languages.en') },
            ]}
            value={i18n.language === 'en' ? 'en' : 'fr'}
            onChange={(locale) => void setLanguage(locale)}
          />
          <SegmentRow<TemperatureUnit>
            icon="white-balance-sunny"
            label={t('settings.preferences.unit')}
            options={[
              { value: 'celsius', label: '°C' },
              { value: 'fahrenheit', label: '°F' },
            ]}
            value={unit}
            onChange={setUnit}
          />
          <MenuRow
            icon="map-marker-outline"
            label={t('settings.preferences.location')}
            value={location}
            onPress={() => router.push('/weather-settings')}
          />
          <ToggleRow
            icon="weather-cloudy"
            label={t('settings.preferences.sync')}
            hint={t('settings.preferences.syncHint')}
            value={weatherSync}
            onPress={() => setWeatherSync(!weatherSync)}
          />
        </SettingsCard>

        {/* Notifications come with a later sprint: shown, off, "Bientôt". */}
        <SettingsCard
          title={t('settings.notifications.title')}
          overline={t('settings.notifications.overline')}
        >
          <ToggleRow
            icon="bell-outline"
            label={t('settings.notifications.tips')}
            disabled
            onPress={() => setDialog('soon')}
          />
          <ToggleRow
            icon="hanger"
            label={t('settings.notifications.reminders')}
            disabled
            onPress={() => setDialog('soon')}
          />
          <ToggleRow
            icon="email-outline"
            label={t('settings.notifications.news')}
            disabled
            onPress={() => setDialog('soon')}
          />
        </SettingsCard>

        <SettingsCard
          title={t('settings.privacy.title')}
          overline={t('settings.privacy.overline')}
        >
          <MenuRow
            icon="shield-check-outline"
            label={t('settings.privacy.data')}
            onPress={() => router.push('/privacy')}
          />
          <MenuRow
            icon="eye-outline"
            label={t('settings.privacy.settings')}
            onPress={() => router.push('/privacy')}
          />
        </SettingsCard>

        <SettingsCard
          title={t('settings.help.title')}
          overline={t('settings.help.overline')}
        >
          <MenuRow
            icon="help-circle-outline"
            label={t('settings.help.center')}
            onPress={() => router.push('/help')}
          />
          <MenuRow
            icon="message-outline"
            label={t('settings.help.contact')}
            onPress={() => {
              if (!contactUs()) setDialog('contact');
            }}
          />
          <MenuRow
            icon="file-document-outline"
            label={t('settings.help.terms')}
            onPress={() => router.push('/terms')}
          />
          <MenuRow
            icon="file-document-outline"
            label={t('settings.privacy.policy')}
            onPress={() => router.push('/privacy')}
          />
        </SettingsCard>
      </ScrollPage>
      <ConfirmDialog
        visible={dialog !== null}
        icon={dialog === 'contact' ? 'mail-outline' : 'sparkles-outline'}
        title={
          dialog === 'contact'
            ? t('settings.help.contact')
            : t('comingSoon.title')
        }
        message={
          dialog === 'contact'
            ? t('settings.helpCenter.contactSoon')
            : t('comingSoon.body')
        }
        confirmLabel={t('profile.ok')}
        onConfirm={() => setDialog(null)}
        onCancel={() => setDialog(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: {
    gap: spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
  },
});
