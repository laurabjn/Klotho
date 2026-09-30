import { StyleSheet, Text, type TextProps } from 'react-native';

import { colors, fonts } from '@/theme/tokens';

type Variant =
  'hero' | 'title' | 'heading' | 'overline' | 'body' | 'hint' | 'label';

interface AppTextProps extends TextProps {
  variant?: Variant;
  center?: boolean;
}

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
      maxFontSizeMultiplier={variant === 'hero' ? 1.3 : 1.6}
      style={[styles[variant], center && styles.center, style]}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  hero: {
    fontFamily: fonts.serif,
    fontSize: 36,
    lineHeight: 40,
    color: colors.title,
  },
  title: {
    fontFamily: fonts.serif,
    fontSize: 32,
    lineHeight: 36,
    color: colors.title,
  },
  heading: {
    fontFamily: fonts.serif,
    fontSize: 22,
    lineHeight: 28,
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
