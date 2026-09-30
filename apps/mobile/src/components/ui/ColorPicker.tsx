import { Ionicons } from '@expo/vector-icons';
import { COLOR_KEYS, COLORS, type ColorKey } from '@klotho/shared';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { colors, radii, spacing } from '@/theme/tokens';

import { AppText } from './AppText';

type Props =
  | {
      multiple?: false;
      value: ColorKey | undefined;
      onChange: (value: ColorKey) => void;
    }
  | {
      multiple: true;
      value: ColorKey[];
      onChange: (value: ColorKey[]) => void;
    };

/** Grid of colour swatches with their name, as in the "Palette complète" mockup. */
export function ColorPicker(props: Props) {
  const { t } = useTranslation();

  const isSelected = (key: ColorKey) =>
    props.multiple ? props.value.includes(key) : props.value === key;

  const toggle = (key: ColorKey) => {
    if (!props.multiple) return props.onChange(key);
    props.onChange(
      props.value.includes(key)
        ? props.value.filter((k) => k !== key)
        : [...props.value, key],
    );
  };

  return (
    <View style={styles.grid}>
      {COLOR_KEYS.map((key) => {
        const selected = isSelected(key);
        const label = t(`wardrobe.colors.${key}`);
        return (
          <Pressable
            key={key}
            accessibilityRole={props.multiple ? 'checkbox' : 'radio'}
            accessibilityState={
              props.multiple ? { checked: selected } : { selected }
            }
            accessibilityLabel={label}
            onPress={() => toggle(key)}
            style={styles.cell}
          >
            <View
              style={[
                styles.swatch,
                { backgroundColor: COLORS[key] },
                selected && styles.swatchSelected,
              ]}
            >
              {selected && (
                <View style={styles.badge}>
                  <Ionicons
                    name="checkmark"
                    size={12}
                    color={colors.onPrimary}
                  />
                </View>
              )}
            </View>
            <AppText
              variant="hint"
              center
              numberOfLines={2}
              style={styles.label}
            >
              {label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const SWATCH = 44;

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: spacing.md },
  cell: { width: '20%', alignItems: 'center', gap: spacing.xs },
  swatch: {
    width: SWATCH,
    height: SWATCH,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  swatchSelected: { borderWidth: 2, borderColor: colors.primary },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  label: { fontSize: 11, lineHeight: 14 },
});
