import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { colors, fonts, radii, spacing, touchTarget } from '@/theme/tokens';

interface TemperatureFieldProps {
  label: string;
  value: number | null | undefined;
  onChange: (value: number | null) => void;
  invalid?: boolean;
}

const toText = (value: number | null | undefined) =>
  value == null ? '' : String(value);

/** Whole degrees, negatives allowed; keeps "-" while the user is typing. */
export function TemperatureField({
  label,
  value,
  onChange,
  invalid,
}: TemperatureFieldProps) {
  const [text, setText] = useState(toText(value));

  // The typed text wins while it matches the value (it may be a partial
  // entry like "-"); otherwise the value changed from outside (form reset).
  const parsed = Number.parseInt(text, 10);
  const displayed =
    (Number.isNaN(parsed) ? null : parsed) === (value ?? null)
      ? text
      : toText(value);

  return (
    <View style={styles.container}>
      <AppText variant="hint">{label}</AppText>
      <TextInput
        accessibilityLabel={label}
        value={displayed}
        keyboardType="numbers-and-punctuation"
        maxLength={3}
        onChangeText={(next) => {
          const cleaned = next.replace(/[^\d-]/g, '').replace(/(?!^)-/g, '');
          setText(cleaned);
          const parsed = Number.parseInt(cleaned, 10);
          onChange(Number.isNaN(parsed) ? null : parsed);
        }}
        placeholder="—"
        placeholderTextColor={colors.placeholder}
        style={[styles.input, invalid && styles.invalid]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, gap: spacing.xs },
  input: {
    minHeight: touchTarget,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.input,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.input,
    fontFamily: fonts.serifRegular,
    fontSize: 18,
    color: colors.title,
    textAlign: 'center',
  },
  invalid: { borderColor: colors.error },
});
