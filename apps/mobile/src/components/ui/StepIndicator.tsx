import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { colors, fonts, radii, spacing } from '@/theme/tokens';

import { AppText } from './AppText';

/** Numbered steps joined by a line, as on the "Ajouter une pièce" mockup. */
export function StepIndicator({
  steps,
  current,
  accessibilityLabel,
}: {
  steps: string[];
  current: number;
  accessibilityLabel: string;
}) {
  return (
    <View
      style={styles.row}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 1, max: steps.length, now: current + 1 }}
    >
      {steps.map((label, index) => {
        const done = index < current;
        const active = index === current;
        return (
          <View key={label} style={styles.step}>
            {index > 0 && (
              <View
                style={[styles.line, (done || active) && styles.lineDone]}
              />
            )}
            <View
              style={[styles.circle, (done || active) && styles.circleActive]}
            >
              {done ? (
                <Ionicons name="checkmark" size={14} color={colors.onPrimary} />
              ) : (
                <Text style={[styles.number, active && styles.numberActive]}>
                  {index + 1}
                </Text>
              )}
            </View>
            <AppText
              variant="hint"
              center
              style={active ? styles.labelActive : undefined}
            >
              {label}
            </AppText>
          </View>
        );
      })}
    </View>
  );
}

const SIZE = 28;

const styles = StyleSheet.create({
  row: { flexDirection: 'row' },
  step: { flex: 1, alignItems: 'center', gap: spacing.xs },
  line: {
    position: 'absolute',
    top: SIZE / 2,
    right: '50%',
    width: '100%',
    height: 1,
    backgroundColor: colors.border,
  },
  lineDone: { backgroundColor: colors.primary },
  circle: {
    width: SIZE,
    height: SIZE,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  circleActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  number: { fontFamily: fonts.sansMedium, fontSize: 13, color: colors.muted },
  numberActive: { color: colors.onPrimary },
  labelActive: { color: colors.title },
});
