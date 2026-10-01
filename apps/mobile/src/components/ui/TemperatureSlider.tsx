import Slider from '@react-native-community/slider';
import { displayTemperature, type TemperatureUnit } from '@klotho/shared';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { colors, fonts, spacing } from '@/theme/tokens';

import { AppText } from './AppText';

/** Range of the mockup slider, in °C. */
const RANGE = { min: -5, max: 30 };
const TICKS = [-5, 0, 5, 10, 15, 20, 25, 30];

interface TemperatureSliderProps {
  /** Title on the left ("Température", "4. Quelle est la température ?"). */
  title: ReactNode;
  /** °C, or null for "any temperature". */
  value: number | null;
  onChange: (celsius: number) => void;
  unit: TemperatureUnit;
  /** Shown instead of a value when it is null. */
  emptyLabel?: string;
  testID?: string;
}

/** Title, value in the user's unit, slider and graduations, as on the mockups. */
export function TemperatureSlider({
  title,
  value,
  onChange,
  unit,
  emptyLabel = '—',
  testID,
}: TemperatureSliderProps) {
  const symbol = unit === 'fahrenheit' ? '°F' : '°C';
  const label =
    value === null ? emptyLabel : `${displayTemperature(value, unit)}${symbol}`;
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.flex}>{title}</View>
        <AppText style={styles.value}>{label}</AppText>
      </View>
      <Slider
        accessibilityLabel={label}
        minimumValue={RANGE.min}
        maximumValue={RANGE.max}
        step={1}
        value={value ?? RANGE.min}
        onValueChange={onChange}
        minimumTrackTintColor={colors.primary}
        maximumTrackTintColor={colors.border}
        thumbTintColor={colors.primary}
        testID={testID}
      />
      <View
        style={styles.ticks}
        importantForAccessibility="no-hide-descendants"
      >
        {TICKS.map((tick) => (
          <AppText key={tick} variant="hint">
            {`${displayTemperature(tick, unit)}°`}
          </AppText>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm },
  header: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  flex: { flex: 1 },
  value: { fontFamily: fonts.serif, fontSize: 26, color: colors.title },
  ticks: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xs,
    marginTop: -spacing.sm,
  },
});
