import { Ionicons } from '@expo/vector-icons';
import type { City, LocationMode } from '@klotho/shared';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Linking, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { colors, radii, spacing, touchTarget } from '@/theme/tokens';

import {
  requestLocationPermission,
  type PermissionAnswer,
} from '../lib/device-position';
import { CitySearch } from './CitySearch';

export interface LocationChoice {
  locationMode: LocationMode | null;
  city: City | null;
}

interface LocationSetupProps {
  value: LocationChoice;
  onChange: (next: LocationChoice) => void;
}

/**
 * "Utiliser ma position" (asks the permission only then) or "Choisir une
 * ville". A refusal is not blocking: the city search opens instead.
 */
export function LocationSetup({ value, onChange }: LocationSetupProps) {
  const { t } = useTranslation();
  const [refusal, setRefusal] = useState<Exclude<
    PermissionAnswer,
    'granted'
  > | null>(null);
  const [asking, setAsking] = useState(false);

  const chooseDevice = async () => {
    setAsking(true);
    const answer = await requestLocationPermission().finally(() =>
      setAsking(false),
    );
    if (answer === 'granted') {
      setRefusal(null);
      onChange({ ...value, locationMode: 'device' });
    } else {
      setRefusal(answer);
      onChange({ ...value, locationMode: 'city' });
    }
  };

  return (
    <View style={styles.container}>
      <Option
        icon="navigate-outline"
        title={t('weather.location.useDevice')}
        hint={t('weather.location.useDeviceHint')}
        selected={value.locationMode === 'device'}
        busy={asking}
        onPress={() => void chooseDevice()}
      />
      {value.locationMode === 'device' && (
        <AppText variant="hint">{t('weather.location.deviceActive')}</AppText>
      )}

      <Option
        icon="business-outline"
        title={t('weather.location.chooseCity')}
        selected={value.locationMode === 'city'}
        onPress={() => onChange({ ...value, locationMode: 'city' })}
      />
      {refusal && (
        <View accessibilityLiveRegion="polite" style={styles.refusal}>
          <AppText>
            {t(
              refusal === 'blocked'
                ? 'weather.location.blocked'
                : 'weather.location.denied',
            )}
          </AppText>
          {refusal === 'blocked' && (
            <Button
              variant="link"
              label={t('weather.location.openSettings')}
              onPress={() => void Linking.openSettings()}
            />
          )}
        </View>
      )}
      {value.locationMode === 'city' && (
        <CitySearch
          value={value.city}
          onChange={(city) => onChange({ ...value, city })}
        />
      )}
    </View>
  );
}

function Option({
  icon,
  title,
  hint,
  selected,
  busy = false,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  hint?: string;
  selected: boolean;
  busy?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityLabel={title}
      accessibilityHint={hint}
      accessibilityState={{ selected, busy }}
      onPress={onPress}
      disabled={busy}
      style={({ pressed }) => [
        styles.option,
        selected && styles.optionSelected,
        pressed && styles.pressed,
      ]}
    >
      <Ionicons name={icon} size={22} color={colors.primary} />
      <View style={styles.optionText}>
        <AppText variant="label">{title}</AppText>
        {hint && <AppText variant="hint">{hint}</AppText>}
      </View>
      <Ionicons
        name={selected ? 'radio-button-on' : 'radio-button-off'}
        size={22}
        color={selected ? colors.primary : colors.muted}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.md },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: touchTarget,
    padding: spacing.lg,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  optionSelected: { borderColor: colors.primary },
  optionText: { flex: 1, gap: 2 },
  refusal: { gap: spacing.xs },
  pressed: { opacity: 0.8 },
});
