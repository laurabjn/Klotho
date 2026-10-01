import { StyleSheet, Text, type TextProps } from 'react-native';

import { colors, fonts } from '@/theme/tokens';

type Variant =
  'hero' | 'title' | 'heading' | 'overline' | 'body' | 'hint' | 'label';

interface AppTextProps extends TextProps {
  variant?: Variant;
  center?: boolean;
}

/** How much each style may grow with the system text size. */
const MAX_SCALE: Record<Variant, number> = {
  hero: 1.1,
  title: 1.1,
  heading: 1.15,
  overline: 1.2,
  body: 1.3,
  hint: 1.25,
  label: 1.25,
};

export function AppText({
  variant = 'body',
  center,
  style,
  ...props
}: AppTextProps) {
  const isHeading =
    variant === 'hero' || variant === 'title' || variant === 'heading';
  return (
    <Text
      accessibilityRole={isHeading ? 'header' : undefined}
      maxFontSizeMultiplier={MAX_SCALE[variant]}
      style={[styles[variant], center && styles.center, style]}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  hero: {
    fontFamily: fonts.serif,
    fontSize: 44,
    lineHeight: 48,
    color: colors.title,
  },
  title: {
    fontFamily: fonts.serif,
    fontSize: 36,
    lineHeight: 40,
    color: colors.title,
  },
  heading: {
    fontFamily: fonts.serif,
    fontSize: 24,
    lineHeight: 30,
    color: colors.title,
  },
  overline: {
    fontFamily: fonts.sansLight,
    fontSize: 11,
    lineHeight: 18,
    letterSpacing: 2.2,
    textTransform: 'uppercase',
    color: colors.muted,
  },
  body: {
    fontFamily: fonts.serifRegular,
    fontSize: 17,
    lineHeight: 24,
    color: colors.body,
  },
  hint: {
    fontFamily: fonts.sans,
    fontSize: 12,
    lineHeight: 17,
    color: colors.muted,
  },
  label: {
    fontFamily: fonts.serif,
    fontSize: 16,
    lineHeight: 20,
    color: colors.title,
  },
  center: { textAlign: 'center' },
});
