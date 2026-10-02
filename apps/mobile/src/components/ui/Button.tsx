import { Ionicons } from '@expo/vector-icons';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type PressableProps,
} from 'react-native';

import { colors, fonts, radii, spacing, touchTarget } from '@/theme/tokens';

/**
 * "outline": thin blush border and dark text ("Passer pour l'instant").
 * "danger": filled red, for what cannot be undone.
 */
type Variant = 'primary' | 'secondary' | 'outline' | 'link' | 'danger';

interface ButtonProps extends Omit<PressableProps, 'children' | 'style'> {
  label: string;
  variant?: Variant;
  loading?: boolean;
  /** Sparkle before and arrow after the label, as on the mockups' main actions. */
  decorated?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
}

export function Button({
  label,
  variant = 'primary',
  loading = false,
  decorated = variant === 'primary',
  icon,
  disabled,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const textColor =
    variant === 'primary' || variant === 'danger'
      ? colors.onPrimary
      : variant === 'link'
        ? colors.link
        : variant === 'outline'
          ? colors.title
          : colors.primary;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      hitSlop={variant === 'link' ? 8 : undefined}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        pressed && variant === 'primary' && styles.primaryPressed,
        pressed && variant === 'danger' && styles.dangerPressed,
        pressed &&
          variant !== 'primary' &&
          variant !== 'danger' &&
          styles.pressed,
        isDisabled && !loading && styles.disabled,
      ]}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <View style={styles.content}>
          {decorated && (
            <Ionicons name="sparkles-outline" size={18} color={textColor} />
          )}
          {icon && <Ionicons name={icon} size={18} color={textColor} />}
          <Text
            // Never wrap a button label: shrink it slightly when space is short.
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.75}
            maxFontSizeMultiplier={1.15}
            style={[
              styles.label,
              variant === 'link' && styles.linkLabel,
              { color: textColor },
            ]}
          >
            {label}
          </Text>
          {decorated && (
            <Ionicons name="arrow-forward" size={18} color={textColor} />
          )}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center' },
  primary: {
    minHeight: 54,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOpacity: 0.35,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  primaryPressed: { backgroundColor: colors.primaryPressed },
  danger: {
    minHeight: 54,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.error,
  },
  dangerPressed: { backgroundColor: '#97362F' },
  secondary: {
    minHeight: 52,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.xl,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: 'transparent',
  },
  outline: {
    minHeight: 52,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.xl,
    borderWidth: 1,
    borderColor: '#E2C4BA',
    backgroundColor: 'rgba(252, 248, 243, 0.85)',
  },
  link: { minHeight: touchTarget, paddingHorizontal: spacing.sm },
  pressed: { opacity: 0.6 },
  disabled: { opacity: 0.5 },
  content: {
    maxWidth: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  label: { flexShrink: 1, fontFamily: fonts.serif, fontSize: 19 },
  linkLabel: { fontSize: 17, textDecorationLine: 'underline' },
});
