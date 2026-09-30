import { Ionicons } from '@expo/vector-icons';
import {
  displayTemperature,
  TEMPERATURE_MAX,
  TEMPERATURE_MIN,
  toCelsius,
  type TemperatureUnit,
} from '@klotho/shared';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { colors, radii, spacing, touchTarget } from '@/theme/tokens';

interface ManualTemperatureSheetProps {
  visible: boolean;
  /** Starting value, in °C. */
  initialCelsius: number;
  unit: TemperatureUnit;
  onApply: (celsius: number) => void;
  onClose: () => void;
}

/** Stepper, one degree at a time in the user's unit. */
export function ManualTemperatureSheet({
  visible,
  initialCelsius,
  unit,
  onApply,
  onClose,
}: ManualTemperatureSheetProps) {
  const { t } = useTranslation();
  const [value, setValue] = useState(() =>
    displayTemperature(initialCelsius, unit),
  );
  const min = displayTemperature(TEMPERATURE_MIN, unit);
  const max = displayTemperature(TEMPERATURE_MAX, unit);
  const symbol = unit === 'fahrenheit' ? '°F' : '°C';

  return (
    <BottomSheet
      visible={visible}
      title={t('weather.manual.title')}
      onClose={onClose}
      footer={
        <Button
          label={t('weather.manual.apply')}
          decorated={false}
          onPress={() =>
            onApply(unit === 'fahrenheit' ? toCelsius(value) : value)
          }
        />
      }
    >
      <AppText center>{t('weather.manual.hint')}</AppText>
      <View style={styles.stepper}>
        <Step
          icon="remove"
          label={t('weather.manual.decrease')}
          disabled={value <= min}
          onPress={() => setValue(value - 1)}
        />
        <AppText
          variant="title"
          style={styles.value}
          accessibilityLiveRegion="polite"
        >
          {`${value}${symbol}`}
        </AppText>
        <Step
          icon="add"
          label={t('weather.manual.increase')}
          disabled={value >= max}
          onPress={() => setValue(value + 1)}
        />
      </View>
    </BottomSheet>
  );
}

function Step({
  icon,
  label,
  disabled,
  onPress,
}: {
  icon: 'add' | 'remove';
  label: string;
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => [
        styles.step,
        disabled && styles.disabled,
        pressed && styles.pressed,
      ]}
    >
      <Ionicons name={icon} size={24} color={colors.primary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xxl,
    paddingVertical: spacing.lg,
  },
  value: { minWidth: 110, textAlign: 'center' },
  step: {
    width: touchTarget,
    height: touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  disabled: { opacity: 0.4 },
  pressed: { backgroundColor: colors.primaryLight },
});
