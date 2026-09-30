import { zodResolver } from '@hookform/resolvers/zod';
import {
  resetPasswordFormSchema,
  type ResetPasswordFormInput,
  type ResetPasswordInput,
} from '@klotho/shared';
import { useMutation } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { FormError } from '@/components/ui/FormError';
import { GoldRule } from '@/components/ui/GoldRule';
import { PasswordChecklist } from '@/components/ui/PasswordChecklist';
import { TextField } from '@/components/ui/TextField';
import { errorMessageKey } from '@/lib/api/errors';

import { authApi } from '../api/auth.api';
import { photos } from '@/theme/photos';

import { AuthLayout } from '../components/AuthLayout';
import { useFieldError } from '../hooks/useFieldError';

/** Opened from the email link: klotho://reset-password?token=… */
export function ResetPasswordScreen() {
  const { t } = useTranslation();
  const fieldError = useFieldError();
  const { token } = useLocalSearchParams<{ token?: string }>();
  const { control, handleSubmit, formState } = useForm<ResetPasswordFormInput>({
    resolver: zodResolver(resetPasswordFormSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });
  const password = useWatch({ control, name: 'password' });
  const reset = useMutation({
    mutationFn: (values: ResetPasswordInput) => authApi.resetPassword(values),
    onSuccess: () => router.replace('/password-changed'),
  });
  const submit = handleSubmit(({ password }) =>
    reset.mutate({ token: token ?? '', password }),
  );

  const header = (
    <>
      <AppText variant="hero">{t('auth.resetPassword.title')}</AppText>
      <GoldRule />
      <AppText>{t('auth.resetPassword.body')}</AppText>
    </>
  );

  if (!token) {
    return (
      <AuthLayout
        header={header}
        photo={photos.register.source}
        photoRatio={photos.register.ratio}
        photoPlacement="side"
      >
        <FormError message={t('auth.resetPassword.missingToken')} />
        <Button
          label={t('auth.resetPassword.requestNewLink')}
          onPress={() => router.replace('/forgot-password')}
        />
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      header={header}
      photo={photos.register.source}
      photoRatio={photos.register.ratio}
      photoPlacement="side"
    >
      <FormError
        message={
          reset.error
            ? t(errorMessageKey(reset.error) as 'apiErrors.unknown')
            : null
        }
      />
      <Controller
        control={control}
        name="password"
        render={({ field }) => (
          <TextField
            label={t('auth.fields.newPassword')}
            icon="lock-closed-outline"
            password
            autoComplete="new-password"
            textContentType="newPassword"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            invalid={formState.errors.password !== undefined}
          />
        )}
      />
      <PasswordChecklist password={password} />
      <Controller
        control={control}
        name="confirmPassword"
        render={({ field }) => (
          <TextField
            label={t('auth.fields.confirmPassword')}
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
      <Button
        label={t('auth.resetPassword.submit')}
        loading={reset.isPending}
        onPress={submit}
      />
      {reset.error && (
        <Button
          variant="secondary"
          label={t('auth.resetPassword.requestNewLink')}
          onPress={() => router.replace('/forgot-password')}
        />
      )}
      <Button
        variant="link"
        label={t('common.cancel')}
        onPress={() => router.replace('/')}
      />
    </AuthLayout>
  );
}
