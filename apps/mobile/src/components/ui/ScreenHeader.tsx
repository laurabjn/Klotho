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
  /** Rendered on the right of the back button (e.g. an action icon). */
  right?: ReactNode;
  onBack?: () => void;
}

/** Round back button + serif title, as on the mockups' inner screens. */
export function ScreenHeader({
  title,
  overline,
  right,
  onBack,
}: ScreenHeaderProps) {
  const { t } = useTranslation();
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
          onPress={
            onBack ??
            (() => (router.canGoBack() ? router.back() : router.replace('/')))
          }
          style={styles.back}
        >
          <Ionicons name="chevron-back" size={22} color={colors.title} />
        </Pressable>
        {right}
      </View>
      {title && <AppText variant="title">{title}</AppText>}
      {overline && <AppText variant="overline">{overline}</AppText>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  back: {
    width: touchTarget,
    height: touchTarget,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.input,
  },
});
