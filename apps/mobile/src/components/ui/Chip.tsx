import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { colors, fonts, radii, spacing } from '@/theme/tokens';

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  /** Rendered before the label (e.g. a colour dot). */
  leading?: ReactNode;
  /** Multi-select chips show a check when selected, single-select ones do not. */
  multiple?: boolean;
  testID?: string;
}

/** Pill used for filters and multiple-choice fields, as in the mockups. */
export function Chip({
  label,
  selected = false,
  onPress,
  leading,
  multiple = false,
  testID,
}: ChipProps) {
  return (
    <Pressable
      accessibilityRole={multiple ? 'checkbox' : 'radio'}
      accessibilityState={multiple ? { checked: selected } : { selected }}
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={4}
      testID={testID}
      style={({ pressed }) => [
        styles.chip,
        selected && styles.selected,
        pressed && styles.pressed,
      ]}
    >
      {leading}
      {multiple && selected && (
        <Ionicons name="checkmark" size={14} color={colors.onPrimary} />
      )}
      <Text
        style={[styles.label, selected && styles.selectedLabel]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: 38,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.input,
  },
  selected: { backgroundColor: colors.primary, borderColor: colors.primary },
  pressed: { opacity: 0.7 },
  label: { fontFamily: fonts.serif, fontSize: 16, color: colors.body },
  selectedLabel: { color: colors.onPrimary },
});
