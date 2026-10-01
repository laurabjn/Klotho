import { Ionicons } from '@expo/vector-icons';
import {
  COLOR_FAMILIES,
  COLOR_FAMILY_KEYS,
  COLOR_KEYS,
  COLORS,
  type ColorFamily,
  type ColorKey,
} from '@klotho/shared';
import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { colors, fonts, radii, spacing } from '@/theme/tokens';

import { AppText } from './AppText';
import { Chip } from './Chip';

type Props = (
  | {
      multiple?: false;
      value: ColorKey | undefined;
      onChange: (value: ColorKey) => void;
    }
  | {
      multiple: true;
      value: ColorKey[];
      onChange: (value: ColorKey[]) => void;
    }
) & {
  /**
   * Shows only this many swatches (plus the selected ones) and an "Autres"
   * button that opens the full palette, as in the "Filtres" mockup.
   */
  compactCount?: number;
  /** Four big swatches per row, as in the onboarding mockup. */
  large?: boolean;
  /** One line of swatches scrolling sideways instead of a grid. */
  row?: boolean;
};

/** Grid of colour swatches with their name, as in the "Palette complète" mockup. */
export function ColorPicker(props: Props) {
  const { t } = useTranslation();
  const cellStyle = [
    styles.cell,
    props.large && styles.cellLarge,
    props.row && styles.cellRow,
  ];
  const swatchSize = props.large && styles.swatchLarge;
  const [family, setFamily] = useState<ColorFamily | 'all'>('all');
  const [expanded, setExpanded] = useState(props.compactCount === undefined);

  const isSelected = (key: ColorKey) =>
    props.multiple ? props.value.includes(key) : props.value === key;

  const keys = !expanded
    ? COLOR_KEYS.filter(
        (key, i) => i < (props.compactCount ?? 0) || isSelected(key),
      )
    : family === 'all'
      ? COLOR_KEYS
      : (Object.keys(COLOR_FAMILIES[family]) as ColorKey[]);

  const toggle = (key: ColorKey) => {
    if (!props.multiple) return props.onChange(key);
    props.onChange(
      props.value.includes(key)
        ? props.value.filter((k) => k !== key)
        : [...props.value, key],
    );
  };

  return (
    <View style={styles.container}>
      {expanded && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.families}
        >
          {(['all', ...COLOR_FAMILY_KEYS] as const).map((key) => (
            <Chip
              key={key}
              label={t(`wardrobe.colorFamilies.${key}`)}
              selected={family === key}
              onPress={() => setFamily(key)}
            />
          ))}
        </ScrollView>
      )}
      <Swatches row={props.row}>
        {keys.map((key) => {
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
              style={cellStyle}
            >
              <View
                style={[
                  styles.swatch,
                  swatchSize,
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
        {!expanded && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('wardrobe.filters.otherColors')}
            onPress={() => setExpanded(true)}
            style={cellStyle}
          >
            <View style={[styles.swatch, swatchSize, styles.more]}>
              <Ionicons name="add" size={24} color={colors.title} />
            </View>
            <AppText variant="hint" center style={styles.label}>
              {t('wardrobe.filters.otherColors')}
            </AppText>
          </Pressable>
        )}
      </Swatches>
    </View>
  );
}

/** The swatches: wrapped in a grid, or on one line scrolling sideways. */
function Swatches({ row, children }: { row?: boolean; children: ReactNode }) {
  if (!row) return <View style={styles.grid}>{children}</View>;
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.line}
    >
      {children}
    </ScrollView>
  );
}

const SWATCH = 52;

const styles = StyleSheet.create({
  container: { gap: spacing.md },
  families: { gap: spacing.sm, paddingVertical: 2 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: spacing.md },
  cell: { width: '20%', alignItems: 'center', gap: spacing.xs },
  cellLarge: { width: '25%' },
  line: { gap: spacing.xs, paddingVertical: 2 },
  cellRow: { width: 76 },
  swatchLarge: { width: 64, height: 64 },
  swatch: {
    width: SWATCH,
    height: SWATCH,
    borderRadius: radii.pill,
    borderWidth: 2,
    borderColor: colors.surface,
    shadowColor: colors.shadow,
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  more: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.input,
  },
  swatchSelected: { borderColor: colors.primaryLight },
  badge: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 22,
    height: 22,
    borderWidth: 1.5,
    borderColor: colors.onPrimary,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  // Full cell width, so that two-word names wrap instead of being cut.
  label: {
    alignSelf: 'stretch',
    fontFamily: fonts.serifRegular,
    fontSize: 14,
    lineHeight: 16,
    color: colors.title,
  },
});
