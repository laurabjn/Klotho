import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { KlothoBrandRow } from '@/components/brand/KlothoLogo';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { GoldRule } from '@/components/ui/GoldRule';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { colors, spacing } from '@/theme/tokens';

/** Placeholder home until the weather and outfit of the day (Sprints 5-7). */
export function HomeScreen() {
  const { t } = useTranslation();
  const firstName = useAuthStore((state) => state.user?.firstName ?? '');

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KlothoBrandRow />
      <View style={styles.content}>
        <AppText variant="title">{t('home.greeting', { firstName })}</AppText>
        <AppText variant="overline">{t('home.overline')}</AppText>
        <GoldRule />
        <AppText>{t('home.subtitle')}</AppText>
      </View>
      <Button
        label={t('wardrobe.add')}
        onPress={() => router.push('/piece/new')}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    padding: spacing.xl,
    gap: spacing.xl,
    backgroundColor: colors.background,
  },
  content: { flex: 1, justifyContent: 'center', gap: spacing.md },
});
