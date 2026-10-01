import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  changePasswordFormSchema,
  type ChangePasswordFormInput,
} from '@klotho/shared';
import { useMutation } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/brand/AppHeader';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { FormError } from '@/components/ui/FormError';
import { FormScrollView } from '@/components/ui/FormScrollView';
import { PasswordChecklist } from '@/components/ui/PasswordChecklist';
import { TextField } from '@/components/ui/TextField';
import { authApi } from '@/features/auth/api/auth.api';
import { useFieldError } from '@/features/auth/hooks/useFieldError';
import { signIn } from '@/features/auth/store/auth.store';
import { errorMessageKey } from '@/lib/api/errors';
import { photos } from '@/theme/photos';
import { colors, radii, spacing, touchTarget } from '@/theme/tokens';

const CLEAR = 'rgba(251, 247, 242, 0)';

/** "Changer le mot de passe", as on the mockup, then "Mot de passe modifié". */
export function ChangePasswordScreen() {
  const { t } = useTranslation();
  const fieldError = useFieldError();
  const { control, handleSubmit, formState } = useForm<ChangePasswordFormInput>(
    {
      resolver: zodResolver(changePasswordFormSchema),
      defaultValues: {
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      },
    },
  );
  const newPassword = useWatch({ control, name: 'newPassword' });
  const change = useMutation({
    mutationFn: ({ currentPassword, newPassword }: ChangePasswordFormInput) =>
      authApi.changePassword({ currentPassword, newPassword }),
    // The other devices are signed out: this one keeps a fresh session.
    onSuccess: async (session) => {
      await signIn(session);
      router.replace('/password-changed?from=settings');
    },
  });
  const submit = handleSubmit((values) => change.mutate(values));

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <FormScrollView contentStyle={styles.content}>
        <View style={styles.top}>
          <AppHeader />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('common.back')}
            onPress={() => router.back()}
            hitSlop={4}
            style={styles.back}
          >
            <Ionicons name="chevron-back" size={22} color={colors.title} />
          </Pressable>
          <AppText variant="title" center style={styles.title}>
            {t('settings.changePassword.title')}
          </AppText>
          <AppText variant="overline" center>
            {t('settings.changePassword.overline')}
          </AppText>
        </View>

        <View style={styles.form}>
          <FormError
            message={
              change.error
                ? t(errorMessageKey(change.error) as 'apiErrors.unknown')
                : null
            }
          />
          <Controller
            control={control}
            name="currentPassword"
            render={({ field }) => (
              <TextField
                label={t('settings.changePassword.current')}
                icon="lock-closed-outline"
                password
                autoComplete="current-password"
                textContentType="password"
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                error={fieldError(formState.errors.currentPassword)}
              />
            )}
          />
          <Controller
            control={control}
            name="newPassword"
            render={({ field }) => (
              <TextField
                label={t('settings.changePassword.newPassword')}
                icon="lock-closed-outline"
                password
                autoComplete="new-password"
                textContentType="newPassword"
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                invalid={formState.errors.newPassword !== undefined}
              />
            )}
          />
          <Controller
            control={control}
            name="confirmPassword"
            render={({ field }) => (
              <TextField
                label={t('settings.changePassword.confirm')}
                icon="lock-closed-outline"
                password
                autoComplete="new-password"
                textContentType="newPassword"
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                onSubmitEditing={submit}
                error={fieldError(formState.errors.confirmPassword)}
              />
            )}
          />
          <AppText variant="hint">
            {t('settings.changePassword.rulesTitle')}
          </AppText>
          <PasswordChecklist password={newPassword} />
          <Button
            label={t('settings.changePassword.submit')}
            loading={change.isPending}
            onPress={submit}
          />
          <View style={styles.security}>
            <View style={styles.shield}>
              <MaterialCommunityIcons
                name="shield-check-outline"
                size={22}
                color={colors.primary}
              />
            </View>
            <AppText variant="hint" style={styles.securityText}>
              {t('settings.changePassword.security')}
            </AppText>
          </View>
        </View>

        {/* The decor at the bottom of the mockup. */}
        <View
          style={[styles.decor, { aspectRatio: photos.passwordFooter.ratio }]}
          importantForAccessibility="no-hide-descendants"
        >
          <Image
            source={photos.passwordFooter.source}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
          />
          <LinearGradient
            colors={[colors.background, CLEAR]}
            locations={[0, 0.45]}
            style={StyleSheet.absoluteFill}
          />
        </View>
      </FormScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { flexGrow: 1, gap: spacing.lg, paddingTop: spacing.md },
  top: { gap: spacing.sm, paddingHorizontal: spacing.xl },
  back: {
    width: touchTarget,
    height: touchTarget,
    marginTop: spacing.md,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.input,
  },
  title: { fontSize: 32, lineHeight: 37, marginTop: spacing.sm },
  form: { gap: spacing.md, paddingHorizontal: spacing.xl },
  security: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
  },
  shield: {
    width: 44,
    height: 44,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.input,
  },
  securityText: { flex: 1, fontSize: 13, lineHeight: 18 },
  decor: { width: '100%', marginTop: 'auto' },
});
