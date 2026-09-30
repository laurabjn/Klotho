import { Ionicons } from '@expo/vector-icons';
import {
  displayTemperature,
  type TemperatureUnit,
  type WeatherCondition,
} from '@klotho/shared';
import { router } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { errorMessageKey } from '@/lib/api/errors';
import { colors, fonts, radii, spacing } from '@/theme/tokens';

import {
  useCurrentWeather,
  type CurrentWeatherState,
} from '../hooks/useCurrentWeather';
import {
  useManualTemperature,
  useManualTemperatureStore,
} from '../store/manual-temperature.store';
import { ManualTemperatureSheet } from './ManualTemperatureSheet';

type IoniconName = keyof typeof Ionicons.glyphMap;

const CONDITION_ICONS: Record<WeatherCondition, IoniconName> = {
  clear: 'sunny-outline',
  cloudy: 'cloudy-outline',
  fog: 'cloud-outline',
  rain: 'rainy-outline',
  snow: 'snow-outline',
  storm: 'thunderstorm-outline',
};

/** Neither the weather nor a manual value: start the stepper from a mild day. */
const DEFAULT_MANUAL_CELSIUS = 15;

const degrees = (celsius: number, unit: TemperatureUnit) =>
  `${displayTemperature(celsius, unit)}°`;
/** Main value, with the unit as on the mockup ("17°C"). */
const withUnit = (celsius: number, unit: TemperatureUnit) =>
  `${degrees(celsius, unit)}${unit === 'fahrenheit' ? 'F' : 'C'}`;

type OpenSheet = 'details' | 'manual' | null;

/**
 * Home: small weather card of the mockup (icon, "17°C", condition, place).
 * Pressing it opens the details: feels like, rain, wind, manual temperature.
 */
export function WeatherTile() {
  const { t } = useTranslation();
  const current = useCurrentWeather();
  const manual = useManualTemperature();
  const clearManual = useManualTemperatureStore((state) => state.clear);
  const setManual = useManualTemperatureStore((state) => state.set);
  const [sheet, setSheet] = useState<OpenSheet>(null);
  const { unit } = current;
  const weather = current.status === 'ready' ? current.weather : null;

  const summary = ((): {
    icon: IoniconName;
    value: string;
    label: string;
    place?: string | null;
  } | null => {
    if (manual !== null)
      return {
        icon: 'thermometer-outline',
        value: withUnit(manual, unit),
        label: t('weather.tile.manual'),
      };
    if (weather)
      return {
        icon: CONDITION_ICONS[weather.condition],
        value: withUnit(weather.temperature, unit),
        label: t(`weather.conditions.${weather.condition}`),
        place: weather.locationName,
      };
    if (current.status === 'loading') return null;
    if (current.status === 'unconfigured')
      return {
        icon: 'partly-sunny-outline',
        value: t('weather.open'),
        label: t('weather.tile.unconfigured'),
      };
    return {
      icon: 'cloud-offline-outline',
      value: '—',
      label: t('weather.tile.unavailable'),
    };
  })();

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={
          summary
            ? `${t('weather.tile.open')}, ${summary.value}, ${summary.label}`
            : t('weather.card.loading')
        }
        onPress={() => setSheet('details')}
        style={({ pressed }) => [styles.tile, pressed && styles.pressed]}
      >
        {summary ? (
          <>
            <Ionicons name={summary.icon} size={40} color={colors.muted} />
            <View style={styles.tileText}>
              <AppText style={styles.value} numberOfLines={1}>
                {summary.value}
              </AppText>
              <AppText style={styles.label} numberOfLines={1}>
                {summary.label}
              </AppText>
              {summary.place && (
                <View style={styles.place}>
                  <Ionicons
                    name="location-outline"
                    size={12}
                    color={colors.primary}
                  />
                  <AppText
                    variant="overline"
                    numberOfLines={1}
                    style={styles.flex}
                  >
                    {summary.place}
                  </AppText>
                </View>
              )}
            </View>
          </>
        ) : (
          <ActivityIndicator
            color={colors.primary}
            accessibilityLabel={t('weather.card.loading')}
          />
        )}
      </Pressable>

      <BottomSheet
        visible={sheet === 'details'}
        title={t('weather.card.overline')}
        onClose={() => setSheet(null)}
      >
        <Details
          current={current}
          manual={manual}
          onSetTemperature={() => setSheet('manual')}
          onUseWeather={clearManual}
          onNavigate={(path) => {
            setSheet(null);
            router.push(path);
          }}
        />
      </BottomSheet>
      {sheet === 'manual' && (
        <ManualTemperatureSheet
          visible
          unit={unit}
          initialCelsius={
            manual ?? weather?.temperature ?? DEFAULT_MANUAL_CELSIUS
          }
          onApply={(celsius) => {
            setManual(celsius);
            setSheet(null);
          }}
          onClose={() => setSheet(null)}
        />
      )}
    </>
  );
}

function Details({
  current,
  manual,
  onSetTemperature,
  onUseWeather,
  onNavigate,
}: {
  current: CurrentWeatherState & { unit: TemperatureUnit; retry: () => void };
  manual: number | null;
  onSetTemperature: () => void;
  onUseWeather: () => void;
  onNavigate: (path: '/weather-settings') => void;
}) {
  const { t } = useTranslation();
  const { unit } = current;
  const setTemperature = (
    <Button
      variant="secondary"
      icon="thermometer-outline"
      label={t('weather.card.setTemperature')}
      onPress={onSetTemperature}
    />
  );
  const settings = (
    <Button
      variant="link"
      label={t('weather.tile.settings')}
      onPress={() => onNavigate('/weather-settings')}
    />
  );

  if (manual !== null) {
    return (
      <View style={styles.details}>
        <Summary
          icon="thermometer-outline"
          temperature={withUnit(manual, unit)}
          label={t('weather.card.manual')}
        />
        {setTemperature}
        <Button
          variant="link"
          label={t('weather.card.useWeather')}
          onPress={onUseWeather}
        />
      </View>
    );
  }
  if (current.status === 'ready') {
    const { weather } = current;
    return (
      <View style={styles.details}>
        <Summary
          icon={CONDITION_ICONS[weather.condition]}
          temperature={withUnit(weather.temperature, unit)}
          label={t(`weather.conditions.${weather.condition}`)}
          place={weather.locationName}
        />
        <View style={styles.facts}>
          <Fact icon="body-outline">
            {t('weather.card.feelsLike', {
              value: degrees(weather.feelsLike, unit),
            })}
          </Fact>
          <Fact icon="umbrella-outline">
            {weather.precipitation > 0
              ? t('weather.card.rain', { value: weather.precipitation })
              : t('weather.card.noRain')}
          </Fact>
          <Fact icon="leaf-outline">
            {t('weather.card.wind', { value: Math.round(weather.windSpeed) })}
          </Fact>
        </View>
        {setTemperature}
        {settings}
      </View>
    );
  }
  if (current.status === 'loading') {
    return (
      <ActivityIndicator
        color={colors.primary}
        accessibilityLabel={t('weather.card.loading')}
      />
    );
  }
  if (current.status === 'unconfigured') {
    return (
      <View style={styles.details}>
        <AppText variant="heading">
          {t('weather.card.unconfiguredTitle')}
        </AppText>
        <AppText>{t('weather.card.unconfiguredBody')}</AppText>
        <Button
          icon="partly-sunny-outline"
          label={t('weather.card.configure')}
          decorated={false}
          onPress={() => onNavigate('/weather-settings')}
        />
        {setTemperature}
      </View>
    );
  }
  const message =
    current.status === 'positionUnavailable'
      ? t('weather.card.positionUnavailable')
      : t(errorMessageKey(current.error) as 'apiErrors.unknown');
  return (
    <View style={styles.details}>
      <AppText accessibilityRole="alert">{message}</AppText>
      {current.status === 'positionUnavailable' ? (
        <Button
          label={t('weather.card.configure')}
          decorated={false}
          onPress={() => onNavigate('/weather-settings')}
        />
      ) : (
        <Button
          icon="refresh"
          label={t('weather.card.retry')}
          decorated={false}
          onPress={current.retry}
        />
      )}
      {setTemperature}
    </View>
  );
}

/** Big icon in a soft circle, "17°C", condition and place. */
function Summary({
  icon,
  temperature,
  label,
  place,
}: {
  icon: IoniconName;
  temperature: string;
  label: string;
  place?: string | null;
}) {
  return (
    <View style={styles.summary}>
      <View style={styles.iconCircle}>
        <Ionicons name={icon} size={40} color={colors.gold} />
      </View>
      <View style={styles.flex}>
        <AppText style={styles.temperature}>{temperature}</AppText>
        <AppText style={styles.condition}>{label}</AppText>
        {place && (
          <View style={styles.place}>
            <Ionicons
              name="location-outline"
              size={14}
              color={colors.primary}
            />
            <AppText variant="overline" numberOfLines={1} style={styles.flex}>
              {place}
            </AppText>
          </View>
        )}
      </View>
    </View>
  );
}

function Fact({ icon, children }: { icon: IoniconName; children: ReactNode }) {
  return (
    <View style={styles.fact}>
      <Ionicons name={icon} size={16} color={colors.muted} />
      <AppText variant="hint">{children}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    minHeight: 96,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radii.card,
    backgroundColor: colors.input,
    shadowColor: colors.shadow,
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
  },
  pressed: { opacity: 0.8 },
  tileText: { flexShrink: 1 },
  value: {
    fontFamily: fonts.serif,
    fontSize: 28,
    lineHeight: 32,
    color: colors.title,
  },
  label: {
    fontFamily: fonts.serifRegular,
    fontSize: 16,
    lineHeight: 20,
    color: colors.body,
  },
  place: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  flex: { flex: 1 },
  details: { gap: spacing.lg },
  summary: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  iconCircle: {
    width: 76,
    height: 76,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.input,
  },
  temperature: {
    fontFamily: fonts.serif,
    fontSize: 40,
    lineHeight: 44,
    color: colors.title,
  },
  condition: {
    fontFamily: fonts.serifRegular,
    fontSize: 19,
    lineHeight: 24,
    color: colors.body,
  },
  facts: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.lg },
  fact: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
});
