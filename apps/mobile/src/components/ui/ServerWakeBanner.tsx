import { useTranslation } from 'react-i18next';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useServerWake } from '@/lib/api/server-wake';
import { colors, fonts, radii, spacing } from '@/theme/tokens';

import { AppText } from './AppText';

/** "Klotho se réveille…": shown while the server is slow to answer. */
export function ServerWakeBanner() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const waiting = useServerWake((s) => s.slowRequests > 0);
  if (!waiting) return null;

  return (
    <View
      pointerEvents="none"
      accessibilityLiveRegion="polite"
      accessibilityRole="alert"
      style={[styles.banner, { top: insets.top + spacing.sm }]}
    >
      <ActivityIndicator size="small" color={colors.onPrimary} />
      <AppText style={styles.text} numberOfLines={2}>
        {t('common.serverWaking')}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    left: spacing.xl,
    right: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.pill,
    backgroundColor: colors.primary,
    shadowColor: colors.shadow,
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  text: {
    flex: 1,
    fontFamily: fonts.serif,
    fontSize: 16,
    color: colors.onPrimary,
  },
});
