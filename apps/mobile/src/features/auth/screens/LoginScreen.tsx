import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginInput } from '@klotho/shared';
import { useMutation } from '@tanstack/react-query';
import { Link, router } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { FormError } from '@/components/ui/FormError';
import { TextField } from '@/components/ui/TextField';
import { errorMessageKey } from '@/lib/api/errors';
import { colors, spacing } from '@/theme/tokens';

import { authApi } from '../api/auth.api';
import { AuthLayout } from '../components/AuthLayout';
import { useFieldError } from '../hooks/useFieldError';
import { signIn } from '../store/auth.store';

export function LoginScreen() {
  const { t } = useTranslation();
  const fieldError = useFieldError();
  const { control, handleSubmit, formState } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });
  const login = useMutation({
    mutationFn: (values: LoginInput) => authApi.login(values),
    onSuccess: signIn,
  });

  return (
    <AuthLayout
      centeredBrand
      header={
        <>
          <AppText variant="hero" center>
            {t('auth.login.title')}
          </AppText>
          <AppText variant="overline" center>
            {t('auth.login.overline')}
          </AppText>
        </>
      }
    >
      <FormError
        message={
          login.error
            ? t(errorMessageKey(login.error) as 'apiErrors.unknown')
            : null
        }
      />
      <Controller
        control={control}
        name="email"
        render={({ field }) => (
          <TextField
            label={t('auth.fields.email')}
            icon="mail-outline"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            textContentType="emailAddress"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={fieldError(formState.errors.email)}
          />
        )}
      />
      <Controller
        control={control}
        name="password"
        render={({ field }) => (
          <TextField
            label={t('auth.fields.password')}
            icon="lock-closed-outline"
            password
            autoComplete="current-password"
            textContentType="password"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            onSubmitEditing={handleSubmit((values) => login.mutate(values))}
            error={fieldError(formState.errors.password)}
          />
        )}
      />
      <View style={styles.forgot}>
        <Link href="/forgot-password" asChild>
          <Button variant="link" label={t('auth.login.forgotPassword')} />
        </Link>
      </View>
      <Button
        label={t('auth.login.submit')}
        loading={login.isPending}
        onPress={handleSubmit((values) => login.mutate(values))}
      />
      <View
        style={styles.divider}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        <View style={styles.line} />
        <AppText variant="hint">{t('common.or')}</AppText>
        <View style={styles.line} />
      </View>
      <Button
        variant="secondary"
        icon="person-outline"
        label={t('auth.login.createAccount')}
        onPress={() => router.push('/register')}
      />
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  forgot: { alignItems: 'flex-end', marginTop: -spacing.sm },
  divider: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  line: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
});
