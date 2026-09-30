import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { KlothoBrandRow } from '@/components/brand/KlothoLogo';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { GoldRule } from '@/components/ui/GoldRule';
import { signOut, useAuthStore } from '@/features/auth/store/auth.store';
import { colors, spacing } from '@/theme/tokens';

/** Placeholder home until Sprint 2+ (weather, outfit of the day, wardrobe). */
export function HomeScreen() {
  const { t } = useTranslation();
  const firstName = useAuthStore((state) => state.user?.firstName ?? '');
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    setSigningOut(true);
    // Unmounts this screen once the session is cleared.
    await signOut();
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KlothoBrandRow />
      <View style={styles.content}>
        <AppText variant="title">{t('home.greeting', { firstName })}</AppText>
        <AppText variant="overline">{t('home.overline')}</AppText>
        <GoldRule />
        <AppText>{t('home.subtitle')}</AppText>
      </View>
      <Button
        variant="secondary"
        icon="log-out-outline"
        label={t('auth.logout.action')}
        onPress={() => setConfirmVisible(true)}
      />
      <ConfirmDialog
        visible={confirmVisible}
        icon="log-out-outline"
        title={t('auth.logout.confirmTitle')}
        message={t('auth.logout.confirmBody')}
        confirmLabel={t('auth.logout.action')}
        cancelLabel={t('common.cancel')}
        loading={signingOut}
        onConfirm={() => void handleSignOut()}
        onCancel={() => setConfirmVisible(false)}
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
