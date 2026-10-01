import { Ionicons } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import { changeEmailSchema, type ChangeEmailInput } from '@klotho/shared';
import { useMutation } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { FormError } from '@/components/ui/FormError';
import { GoldRule } from '@/components/ui/GoldRule';
import { TextField } from '@/components/ui/TextField';
import { authApi } from '@/features/auth/api/auth.api';
import { AuthLayout } from '@/features/auth/components/AuthLayout';
import { useFieldError } from '@/features/auth/hooks/useFieldError';
import { updateUser, useAuthStore } from '@/features/auth/store/auth.store';
import { errorMessageKey } from '@/lib/api/errors';
import { photos } from '@/theme/photos';
import { colors, fonts, radii, spacing } from '@/theme/tokens';

/** "Changer l'adresse e-mail": a link is sent to the new address. */
export function ChangeEmailScreen() {
  const { t } = useTranslation();
  const fieldError = useFieldError();
  const user = useAuthStore((state) => state.user);
  const { control, handleSubmit, formState } = useForm<ChangeEmailInput>({
    resolver: zodResolver(changeEmailSchema),
    defaultValues: { newEmail: '', password: '' },
  });
  const change = useMutation({
    mutationFn: (values: ChangeEmailInput) => authApi.changeEmail(values),
    // The profile now shows the address waiting for its confirmation.
    onSuccess: async () => updateUser(await authApi.me()),
  });
  const submit = handleSubmit((values) => change.mutate(values));

  return (
    <AuthLayout
      showBack
      photo={photos.changeEmail.source}
      photoRatio={photos.changeEmail.ratio}
      photoPlacement="side"
      header={
        <>
          <AppText variant="hero" style={styles.title}>
            {t('settings.changeEmail.title')}
          </AppText>
          <AppText variant="overline">
            {t('settings.changeEmail.overline')}
          </AppText>
          <GoldRule />
          <AppText style={styles.body}>
            {t('settings.changeEmail.body')}
          </AppText>
        </>
      }
    >
      <View style={styles.current}>
        <Ionicons name="mail-outline" size={22} color={colors.muted} />
        <View style={styles.flex}>
          <AppText variant="overline">
            {t('settings.changeEmail.current')}
          </AppText>
          <AppText style={styles.currentEmail} numberOfLines={1}>
            {user?.email}
          </AppText>
        </View>
      </View>

      {change.isSuccess ? (
        <View style={styles.sent}>
          <AppText variant="heading">
            {t('settings.changeEmail.sentTitle')}
          </AppText>
          <AppText>
            {t('settings.changeEmail.sentBody', {
              email: change.variables.newEmail,
            })}
          </AppText>
          <Button
            variant="secondary"
            decorated={false}
            label={t('common.back')}
            onPress={() => router.back()}
          />
        </View>
      ) : (
        <>
          {user?.pendingEmail && (
            <AppText variant="hint">
              {t('settings.changeEmail.pending', {
                email: user.pendingEmail,
              })}
            </AppText>
          )}
          <FormError
            message={
              change.error
                ? t(errorMessageKey(change.error) as 'apiErrors.unknown')
                : null
            }
          />
          <Controller
            control={control}
            name="newEmail"
            render={({ field }) => (
              <TextField
                label={t('settings.changeEmail.newEmail')}
                icon="mail-outline"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                error={fieldError(formState.errors.newEmail)}
              />
            )}
          />
          <Controller
            control={control}
            name="password"
            render={({ field }) => (
              <TextField
                label={t('settings.changeEmail.password')}
                icon="lock-closed-outline"
                password
                autoComplete="current-password"
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                onSubmitEditing={submit}
                error={fieldError(formState.errors.password)}
              />
            )}
          />
          <View style={styles.info}>
            <Ionicons
              name="information-circle-outline"
              size={22}
              color={colors.primary}
            />
            <AppText variant="hint" style={styles.flex}>
              {t('settings.changeEmail.info')}
            </AppText>
          </View>
          <Button
            label={t('settings.changeEmail.submit')}
            loading={change.isPending}
            onPress={submit}
          />
          <Button
            variant="link"
            label={t('settings.changeEmail.cancel')}
            onPress={() => router.back()}
          />
        </>
      )}
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  // The title runs over the photo, as on the mockup.
  title: { width: '150%', fontSize: 36, lineHeight: 40 },
  body: { fontSize: 16, lineHeight: 22 },
  flex: { flex: 1 },
  current: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radii.input,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.input,
  },
  currentEmail: { fontFamily: fonts.serif, fontSize: 17, color: colors.title },
  info: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radii.input,
    backgroundColor: colors.primaryLight,
  },
  sent: {
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radii.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
});
