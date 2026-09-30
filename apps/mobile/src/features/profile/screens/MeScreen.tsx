import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { GoldRule } from '@/components/ui/GoldRule';
import { signOut, useAuthStore } from '@/features/auth/store/auth.store';
import { colors, spacing } from '@/theme/tokens';

/** "Moi" tab: identity and sign-out until the profile screens (Sprint 4). */
export function MeScreen() {
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <AppText variant="title">{user?.firstName}</AppText>
        <AppText variant="overline">{user?.email}</AppText>
        <GoldRule />
      </View>
      <View style={styles.center}>
        <EmptyState
          icon="person-outline"
          title={t('comingSoon.title')}
          body={t('comingSoon.body')}
        />
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
        onConfirm={() => {
          setSigningOut(true);
          // Unmounts this screen once the session is cleared.
          void signOut();
        }}
        onCancel={() => setConfirmVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    padding: spacing.xl,
    gap: spacing.lg,
    backgroundColor: colors.background,
  },
  header: { gap: spacing.sm },
  center: { flex: 1, justifyContent: 'center' },
});
