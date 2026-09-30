import { Ionicons } from '@expo/vector-icons';
import { METALS, type Metal } from '@klotho/shared';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { colors, fonts, radii, spacing } from '@/theme/tokens';

/** Swatches of the "Mon métal préféré" mockup. */
const METAL_COLORS: Record<Metal, string> = {
  gold: '#D8B46A',
  silver: '#C4C4C8',
  roseGold: '#E2AE9E',
};

interface MetalPickerProps {
  value: Metal[];
  onChange: (value: Metal[]) => void;
}

/** Gold, silver, rose gold as round swatches; several can be chosen. */
export function MetalPicker({ value, onChange }: MetalPickerProps) {
  const { t } = useTranslation();
  return (
    <View style={styles.row}>
      {METALS.map((metal) => {
        const selected = value.includes(metal);
        return (
          <Pressable
            key={metal}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: selected }}
            accessibilityLabel={t(`preferences.metals.${metal}`)}
            testID={`metal-${metal}`}
            onPress={() =>
              onChange(
                selected ? value.filter((m) => m !== metal) : [...value, metal],
              )
            }
            style={styles.metal}
          >
            <View
              style={[
                styles.swatch,
                selected && styles.swatchSelected,
                { backgroundColor: METAL_COLORS[metal] },
              ]}
            >
              {selected && (
                <View style={styles.check}>
                  <Ionicons
                    name="checkmark"
                    size={11}
                    color={colors.onPrimary}
                  />
                </View>
              )}
            </View>
            <AppText style={styles.label}>
              {t(`preferences.metals.${metal}`)}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: spacing.xs,
  },
  metal: { alignItems: 'center', gap: spacing.xs, minWidth: 64 },
  swatch: {
    width: 44,
    height: 44,
    borderRadius: radii.pill,
    borderWidth: 2,
    borderColor: colors.surface,
    shadowColor: colors.shadow,
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  swatchSelected: { borderColor: colors.primaryLight },
  check: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.onPrimary,
    backgroundColor: colors.primary,
  },
  label: {
    fontFamily: fonts.serifRegular,
    fontSize: 14,
    lineHeight: 18,
    color: colors.title,
  },
});
