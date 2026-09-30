import {
  TEMPERATURE_UNITS,
  type TemperatureUnit,
  type WeatherSettings,
} from '@klotho/shared';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/brand/AppHeader';
import { Button } from '@/components/ui/Button';
import { ChipGroup } from '@/components/ui/ChipGroup';
import { EmptyState } from '@/components/ui/EmptyState';
import { FormError } from '@/components/ui/FormError';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { errorMessageKey } from '@/lib/api/errors';
import { colors, spacing } from '@/theme/tokens';

import { LocationSetup } from '../components/LocationSetup';
import {
  useSaveWeatherSettings,
  useWeatherSettings,
} from '../hooks/useWeatherSettings';

/** Moi → Météo: location mode, saved city and temperature unit. */
export function WeatherSettingsScreen() {
  const { t } = useTranslation();
  const settings = useWeatherSettings();

  return (
    <SafeAreaView style={styles.safe}>
      {settings.data ? (
        // Mounted once loaded, so the draft starts from the saved settings.
        <Editor settings={settings.data} />
      ) : settings.isError ? (
        <View style={styles.content}>
          <ScreenHeader title={t('weather.settings.title')} />
          <EmptyState
            icon="cloud-offline-outline"
            title={t('weather.settings.loadError')}
            body={t(errorMessageKey(settings.error) as 'apiErrors.unknown')}
            actionLabel={t('common.retry')}
            onAction={() => void settings.refetch()}
          />
        </View>
      ) : (
        <ActivityIndicator style={styles.loader} color={colors.primary} />
      )}
    </SafeAreaView>
  );
}

function Editor({ settings }: { settings: WeatherSettings }) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState(settings);
  const save = useSaveWeatherSettings();
  // "city" mode without a city yet: nothing valid to save.
  const incomplete = draft.locationMode === 'city' && !draft.city;

  return (
    <>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <AppHeader />
        <ScreenHeader
          title={t('weather.settings.title')}
          overline={t('weather.settings.overline')}
        />
        <View style={styles.section}>
          <SectionTitle title={t('weather.settings.location')} />
          <LocationSetup
            value={draft}
            onChange={(location) => setDraft({ ...draft, ...location })}
          />
        </View>
        <View style={styles.section}>
          <SectionTitle title={t('weather.settings.unit')} />
          <ChipGroup<TemperatureUnit>
            testIDPrefix="unit"
            options={TEMPERATURE_UNITS.map((unit) => ({
              value: unit,
              label: t(`weather.units.${unit}`),
            }))}
            value={draft.temperatureUnit}
            onChange={(unit) =>
              setDraft({ ...draft, temperatureUnit: unit ?? 'celsius' })
            }
          />
        </View>
      </ScrollView>
      <View style={styles.footer}>
        <FormError
          message={
            save.error
              ? t(errorMessageKey(save.error) as 'apiErrors.unknown')
              : null
          }
        />
        <Button
          label={t('weather.settings.save')}
          decorated={false}
          disabled={incomplete}
          loading={save.isPending}
          onPress={() => save.mutate(draft, { onSuccess: () => router.back() })}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  loader: { marginTop: spacing.xxxl },
  content: { gap: spacing.xxl, padding: spacing.xl },
  section: { gap: spacing.md },
  footer: {
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
});
