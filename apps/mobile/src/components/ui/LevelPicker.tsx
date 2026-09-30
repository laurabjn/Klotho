import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fonts, radii, spacing } from '@/theme/tokens';

import { AppText } from './AppText';

interface LevelPickerProps {
  label: string;
  value: number | null | undefined;
  onChange: (value: number | null) => void;
  /** Label of each level, 1 to 5. */
  describe: (level: number) => string;
}

const LEVELS = [1, 2, 3, 4, 5];

/** Segmented 1-5 scale; pressing the selected level clears it (the field is optional). */
export function LevelPicker({
  label,
  value,
  onChange,
  describe,
}: LevelPickerProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <AppText variant="label">{label}</AppText>
        {value != null && <AppText variant="hint">{describe(value)}</AppText>}
      </View>
      <View
        style={styles.track}
        accessibilityRole="radiogroup"
        accessibilityLabel={label}
      >
        {LEVELS.map((level) => {
          const selected = value === level;
          return (
            <Pressable
              key={level}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityLabel={`${label} : ${describe(level)}`}
              onPress={() => onChange(selected ? null : level)}
              style={[styles.segment, selected && styles.selected]}
            >
              <Text style={[styles.number, selected && styles.selectedNumber]}>
                {level}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  track: {
    flexDirection: 'row',
    padding: 4,
    gap: 4,
    borderRadius: radii.pill,
    backgroundColor: colors.input,
  },
  segment: {
    flex: 1,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.pill,
  },
  selected: { backgroundColor: colors.primary },
  number: { fontFamily: fonts.serif, fontSize: 17, color: colors.body },
  selectedNumber: { color: colors.onPrimary },
});
