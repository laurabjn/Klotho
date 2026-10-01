import { Ionicons } from '@expo/vector-icons';
import { useMutation } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/brand/AppHeader';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { GoldRule } from '@/components/ui/GoldRule';
import { authApi } from '@/features/auth/api/auth.api';
import { updateUser, useAuthStore } from '@/features/auth/store/auth.store';
import { errorMessageKey } from '@/lib/api/errors';
import { colors, radii, spacing } from '@/theme/tokens';

/** Opened from the e-mail: klotho://confirm-email?token=… */
export function ConfirmEmailScreen() {
  const { t } = useTranslation();
  const { token } = useLocalSearchParams<{ token?: string }>();
  const signedIn = useAuthStore((state) => state.status === 'signedIn');
  const confirm = useMutation({
    mutationFn: (value: string) => authApi.confirmEmail(value),
    onSuccess: async () => {
      if (signedIn) updateUser(await authApi.me());
    },
  });
  const { mutate } = confirm;

  useEffect(() => {
    if (token) mutate(token);
  }, [token, mutate]);

  const failed = !token || confirm.isError;
  const email = confirm.data?.email ?? '';

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.content}>
        <AppHeader />
        <View style={styles.body}>
          {confirm.isSuccess || failed ? (
            <>
              <View style={[styles.badge, failed && styles.badgeFailed]}>
                <Ionicons
                  name={failed ? 'close' : 'checkmark'}
                  size={48}
                  color={colors.onPrimary}
                />
              </View>
              <AppText variant="title" center>
                {failed
                  ? t('settings.confirmEmail.failedTitle')
                  : t('settings.confirmEmail.doneTitle')}
              </AppText>
              <GoldRule />
              <AppText center>
                {failed
                  ? t(
                      (confirm.error
                        ? errorMessageKey(confirm.error)
                        : 'apiErrors.unknown') as 'apiErrors.unknown',
                    )
                  : t('settings.confirmEmail.doneBody', { email })}
              </AppText>
            </>
          ) : (
            <>
              <ActivityIndicator color={colors.primary} />
              <AppText center>{t('settings.confirmEmail.pending')}</AppText>
            </>
          )}
        </View>
        {(confirm.isSuccess || failed) && (
          <Button
            label={t('settings.confirmEmail.continue')}
            onPress={() => router.replace('/')}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: {
    flex: 1,
    gap: spacing.xl,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
  },
  badge: {
    width: 96,
    height: 96,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  badgeFailed: { backgroundColor: colors.muted },
});
