import type { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/AppText';
import { EmptyState } from '@/components/ui/EmptyState';
import { colors, spacing } from '@/theme/tokens';

/** Placeholder for tabs whose sprint has not come yet. */
export function ComingSoonScreen({
  title,
  icon,
}: {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
}) {
  const { t } = useTranslation();
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <AppText variant="title">{title}</AppText>
      <View style={styles.center}>
        <EmptyState
          icon={icon}
          title={t('comingSoon.title')}
          body={t('comingSoon.body')}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, padding: spacing.xl, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center' },
});
