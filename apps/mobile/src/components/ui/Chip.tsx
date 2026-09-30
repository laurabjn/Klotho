import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { IconName } from '@/theme/icons';
import { colors, fonts, radii, spacing } from '@/theme/tokens';

export type ChipTone = 'solid' | 'soft';

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  /** Rendered before the label (e.g. a colour dot). */
  leading?: ReactNode;
  icon?: IconName;
  /**
   * "solid": filled when selected (filters, profile). "soft": blush with a
   * round check when selected (the piece forms of the mockups).
   */
  tone?: ChipTone;
  multiple?: boolean;
  /** Display only (a summary), not a choice. */
  readOnly?: boolean;
  testID?: string;
}

/** Pill used for filters and multiple-choice fields, as in the mockups. */
export function Chip({
  label,
  selected = false,
  onPress,
  leading,
  icon,
  tone = 'solid',
  multiple = false,
  readOnly = false,
  testID,
}: ChipProps) {
  const solid = selected && tone === 'solid';
  const soft = selected && tone === 'soft';
  const tint = solid ? colors.onPrimary : soft ? colors.primary : colors.body;

  return (
    <Pressable
      accessibilityRole={readOnly ? 'text' : multiple ? 'checkbox' : 'radio'}
      accessibilityState={
        readOnly ? undefined : multiple ? { checked: selected } : { selected }
      }
      accessibilityLabel={label}
      onPress={readOnly ? undefined : onPress}
      disabled={readOnly}
      hitSlop={4}
      testID={testID}
      style={({ pressed }) => [
        styles.chip,
        solid && styles.solid,
        soft && styles.soft,
        pressed && styles.pressed,
      ]}
    >
      {leading}
      {icon && <MaterialCommunityIcons name={icon} size={18} color={tint} />}
      <Text style={[styles.label, { color: tint }]} numberOfLines={1}>
        {label}
      </Text>
      {soft && multiple && (
        <View style={styles.check}>
          <Ionicons name="checkmark" size={12} color={colors.onPrimary} />
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.input,
  },
  solid: { backgroundColor: colors.primary, borderColor: colors.primary },
  soft: { backgroundColor: colors.primaryLight, borderColor: colors.primary },
  pressed: { opacity: 0.7 },
  label: { flexShrink: 1, fontFamily: fonts.serif, fontSize: 16 },
  check: {
    width: 18,
    height: 18,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
});
