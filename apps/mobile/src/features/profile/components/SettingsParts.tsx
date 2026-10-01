import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Children, Fragment, type ReactNode } from 'react';
import { Pressable, StyleSheet, Switch, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import type { IconName } from '@/theme/icons';
import { colors, fonts, radii, spacing, touchTarget } from '@/theme/tokens';

/** A card of the "Paramètres" mockup: title, overline, rows separated by a line. */
export function SettingsCard({
  title,
  overline,
  children,
}: {
  title: string;
  overline?: string;
  children: ReactNode;
}) {
  const rows = Children.toArray(children).filter(Boolean);
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <AppText variant="heading" style={styles.cardTitle}>
          {title}
        </AppText>
        {overline && <AppText variant="overline">{overline}</AppText>}
      </View>
      {rows.map((row, index) => (
        <Fragment key={index}>
          {index > 0 && <View style={styles.separator} />}
          {row}
        </Fragment>
      ))}
    </View>
  );
}

export function MenuRow({
  icon,
  label,
  value,
  onPress,
  danger = false,
}: {
  icon: IconName;
  label: string;
  /** Shown on the right, before the chevron ("Paris, France"). */
  value?: string;
  onPress: () => void;
  danger?: boolean;
}) {
  const color = danger ? colors.link : colors.title;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={value ? `${label}, ${value}` : label}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <MaterialCommunityIcons name={icon} size={22} color={color} />
      <AppText style={[styles.label, { color }]}>{label}</AppText>
      {value && (
        <AppText variant="hint" numberOfLines={1} style={styles.value}>
          {value}
        </AppText>
      )}
      <Ionicons name="chevron-forward" size={18} color={color} />
    </Pressable>
  );
}

/** A switch row; `onPress` alone (no value) shows it off, for "Bientôt". */
export function ToggleRow({
  icon,
  label,
  hint,
  value = false,
  disabled = false,
  onPress,
}: {
  icon: IconName;
  label: string;
  /** A second, smaller line under the label. */
  hint?: string;
  value?: boolean;
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked: value, disabled }}
      onPress={onPress}
      style={styles.row}
    >
      <MaterialCommunityIcons name={icon} size={22} color={colors.title} />
      <View style={styles.toggleText}>
        <AppText style={styles.toggleLabel}>{label}</AppText>
        {hint && <AppText variant="hint">{hint}</AppText>}
      </View>
      <View pointerEvents="none">
        <Switch
          value={value}
          disabled={disabled}
          trackColor={{ false: colors.border, true: colors.primary }}
          thumbColor={colors.surface}
        />
      </View>
    </Pressable>
  );
}

/** A label with a two-or-more choice segmented control on its right. */
export function SegmentRow<T extends string>({
  icon,
  label,
  options,
  value,
  onChange,
}: {
  icon: IconName;
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <View style={styles.row}>
      <MaterialCommunityIcons name={icon} size={22} color={colors.title} />
      <AppText style={styles.label}>{label}</AppText>
      <View
        style={styles.segmented}
        accessibilityRole="radiogroup"
        accessibilityLabel={label}
      >
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <Pressable
              key={option.value}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityLabel={option.label}
              onPress={() => onChange(option.value)}
              style={[styles.segment, selected && styles.segmentOn]}
            >
              <AppText
                numberOfLines={1}
                maxFontSizeMultiplier={1.1}
                style={[styles.segmentText, selected && styles.segmentTextOn]}
              >
                {option.label}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.xs,
    padding: spacing.lg,
    borderRadius: radii.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    shadowColor: colors.shadow,
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
  },
  cardHeader: { gap: 2, marginBottom: spacing.xs },
  cardTitle: { fontSize: 24, lineHeight: 28 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: touchTarget + 2,
  },
  pressed: { opacity: 0.7 },
  label: {
    flex: 1,
    fontFamily: fonts.serif,
    fontSize: 17,
    color: colors.title,
  },
  value: { maxWidth: '45%', fontSize: 14 },
  toggleText: { flex: 1, paddingVertical: spacing.xs },
  toggleLabel: { fontSize: 15, lineHeight: 20, color: colors.body },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
  segmented: {
    flexDirection: 'row',
    borderRadius: radii.pill,
    backgroundColor: colors.input,
  },
  segment: {
    minWidth: 64,
    minHeight: 36,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.pill,
  },
  segmentOn: { backgroundColor: colors.primary },
  segmentText: { fontFamily: fonts.serif, fontSize: 15, color: colors.title },
  segmentTextOn: { color: colors.onPrimary },
});
