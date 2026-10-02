import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/brand/AppHeader';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { FormError } from '@/components/ui/FormError';
import { FormScrollView } from '@/components/ui/FormScrollView';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { TextField } from '@/components/ui/TextField';
import { authApi } from '@/features/auth/api/auth.api';
import {
  forgetDeletedAccount,
  useAuthStore,
} from '@/features/auth/store/auth.store';
import { errorMessageKey } from '@/lib/api/errors';
import type { IconName } from '@/theme/icons';
import { colors, fonts, radii, spacing } from '@/theme/tokens';

const SECTIONS: { key: SectionKey; icon: IconName }[] = [
  { key: 'data', icon: 'database-outline' },
  { key: 'location', icon: 'map-marker-outline' },
  { key: 'photos', icon: 'camera-outline' },
  { key: 'partners', icon: 'handshake-outline' },
  { key: 'retention', icon: 'clock-outline' },
  { key: 'rights', icon: 'shield-check-outline' },
  { key: 'legal', icon: 'scale-balance' },
];

type SectionKey =
  | 'data'
  | 'location'
  | 'photos'
  | 'partners'
  | 'retention'
  | 'rights'
  | 'legal';

/** Moi → Confidentialité: privacy policy, legal notices, account deletion. */
export function PrivacyScreen() {
  const { t } = useTranslation();
  const signedIn = useAuthStore((state) => state.status === 'signedIn');

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <FormScrollView contentStyle={styles.content}>
        <AppHeader />
        <ScreenHeader
          title={t('privacy.title')}
          overline={t('privacy.overline')}
        />
        <AppText>{t('privacy.intro')}</AppText>

        {SECTIONS.map(({ key, icon }) => (
          <View key={key} style={styles.card}>
            <View style={styles.cardTitle}>
              <View style={styles.icon}>
                <MaterialCommunityIcons
                  name={icon}
                  size={20}
                  color={colors.primary}
                />
              </View>
              <AppText variant="heading" style={styles.heading}>
                {t(`privacy.sections.${key}.title`)}
              </AppText>
            </View>
            <AppText style={styles.body}>
              {t(`privacy.sections.${key}.body`)}
            </AppText>
            {key === 'location' && (
              <Button
                variant="link"
                decorated={false}
                label={t('privacy.sections.location.action')}
                onPress={() => router.push('/weather-settings')}
              />
            )}
          </View>
        ))}

        {/* Signed out (from the sign-up screen), there is no account yet. */}
        {signedIn && <DeleteAccount />}
      </FormScrollView>
    </SafeAreaView>
  );
}

/** "Supprimer mon compte": confirmed with the password, then signed out. */
function DeleteAccount() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState('');
  const remove = useMutation({
    mutationFn: () => authApi.deleteAccount(password),
    onSuccess: async () => {
      queryClient.clear();
      await forgetDeletedAccount();
    },
  });
  const close = () => {
    setOpen(false);
    setPassword('');
    remove.reset();
  };

  return (
    <View style={[styles.card, styles.danger]}>
      <View style={styles.cardTitle}>
        <View style={styles.icon}>
          <MaterialCommunityIcons
            name="trash-can-outline"
            size={20}
            color={colors.primary}
          />
        </View>
        <AppText variant="heading" style={styles.heading}>
          {t('privacy.delete.title')}
        </AppText>
      </View>
      <AppText style={styles.body}>{t('privacy.delete.body')}</AppText>
      <Button
        variant="secondary"
        icon="trash-outline"
        label={t('privacy.delete.action')}
        onPress={() => setOpen(true)}
      />
      <ConfirmDialog
        visible={open}
        tone="danger"
        icon="trash-outline"
        title={t('privacy.delete.confirmTitle')}
        message={t('privacy.delete.confirmBody')}
        confirmLabel={t('privacy.delete.confirm')}
        cancelLabel={t('privacy.delete.cancel')}
        confirmDisabled={password.length === 0}
        loading={remove.isPending}
        onConfirm={() => remove.mutate()}
        onCancel={close}
      >
        <View style={styles.warning}>
          <Ionicons name="warning-outline" size={18} color={colors.error} />
          <AppText style={styles.warningText}>
            {t('privacy.delete.warning')}
          </AppText>
        </View>
        <TextField
          label={t('privacy.delete.password')}
          icon="lock-closed-outline"
          password
          value={password}
          onChangeText={setPassword}
          autoComplete="current-password"
        />
        <FormError
          message={
            remove.error
              ? t(errorMessageKey(remove.error) as 'apiErrors.unknown')
              : null
          }
        />
      </ConfirmDialog>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: {
    gap: spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
  },
  card: {
    gap: spacing.sm,
    padding: spacing.lg,
    borderRadius: radii.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  danger: { borderColor: '#E2C4BA' },
  cardTitle: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  icon: {
    width: 36,
    height: 36,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryLight,
  },
  heading: { flex: 1, fontSize: 20, lineHeight: 25 },
  body: { fontFamily: fonts.serifRegular, fontSize: 15, lineHeight: 21 },
  warning: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    backgroundColor: '#F6DEDA',
  },
  warningText: { fontSize: 15, color: colors.error },
});
