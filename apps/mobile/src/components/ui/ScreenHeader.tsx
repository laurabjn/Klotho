import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { colors, radii, spacing, touchTarget } from '@/theme/tokens';

import { AppText } from './AppText';

interface ScreenHeaderProps {
  title?: string;
  overline?: string;
  /** Rendered at the end of the title row (e.g. a counter or an icon). */
  right?: ReactNode;
  /** Tab screens have no back button. */
  back?: boolean;
  onBack?: () => void;
}

/**
 * Round back button with the serif title beside it, and the overline under
 * the title, as on the mockups' inner screens.
 */
export function ScreenHeader({
  title,
  overline,
  right,
  back = true,
  onBack,
}: ScreenHeaderProps) {
  const { t } = useTranslation();
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {back && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('common.back')}
            onPress={
              onBack ??
              (() => (router.canGoBack() ? router.back() : router.replace('/')))
            }
            hitSlop={4}
            style={({ pressed }) => [styles.back, pressed && styles.pressed]}
          >
            <Ionicons name="chevron-back" size={22} color={colors.title} />
          </Pressable>
        )}
        <View style={styles.titles}>
          {title && <AppText variant="title">{title}</AppText>}
          {overline && <AppText variant="overline">{overline}</AppText>}
        </View>
        {right}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  titles: { flex: 1, gap: spacing.xs },
  back: {
    width: touchTarget,
    height: touchTarget,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.input,
  },
  pressed: { opacity: 0.7 },
});
