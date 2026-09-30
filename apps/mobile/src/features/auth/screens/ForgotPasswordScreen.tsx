import { zodResolver } from '@hookform/resolvers/zod';
import { forgotPasswordSchema, type ForgotPasswordInput } from '@klotho/shared';
import { useMutation } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { FormError } from '@/components/ui/FormError';
import { TextField } from '@/components/ui/TextField';
import { errorMessageKey } from '@/lib/api/errors';

import { authApi } from '../api/auth.api';
import { photos } from '@/theme/photos';

import { AuthLayout } from '../components/AuthLayout';
import { useFieldError } from '../hooks/useFieldError';

export function ForgotPasswordScreen() {
  const { t } = useTranslation();
  const fieldError = useFieldError();
  const { control, handleSubmit, formState, getValues } =
    useForm<ForgotPasswordInput>({
      resolver: zodResolver(forgotPasswordSchema),
      defaultValues: { email: '' },
    });
  const request = useMutation({
    mutationFn: (values: ForgotPasswordInput) => authApi.forgotPassword(values),
  });
  const submit = handleSubmit((values) => request.mutate(values));

  if (request.isSuccess) {
    // Same message whether or not the account exists (the API does not tell).
    return (
      <AuthLayout
        showBack
        photo={photos.forgotPassword.source}
        photoRatio={photos.forgotPassword.ratio}
        header={
          <>
            <AppText variant="title" center>
              {t('auth.forgotPassword.sentTitle')}
            </AppText>
            <AppText center>
              {t('auth.forgotPassword.sentBody', { email: getValues('email') })}
            </AppText>
          </>
        }
      >
        <Button
          label={t('auth.forgotPassword.backToLogin')}
          onPress={() => router.replace('/login')}
        />
        <Button
          variant="link"
          label={t('auth.forgotPassword.resend')}
          onPress={() => request.reset()}
        />
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      showBack
      photo={photos.forgotPassword.source}
      photoRatio={photos.forgotPassword.ratio}
      header={
        <>
          <AppText variant="title" center>
            {t('auth.forgotPassword.title')}
          </AppText>
          <AppText variant="overline" center>
            {t('auth.forgotPassword.overline')}
          </AppText>
          <AppText center>{t('auth.forgotPassword.body')}</AppText>
        </>
      }
    >
      <FormError
        message={
          request.error
            ? t(errorMessageKey(request.error) as 'apiErrors.unknown')
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
            onSubmitEditing={submit}
            error={fieldError(formState.errors.email)}
          />
        )}
      />
      <AppText variant="hint">{t('auth.forgotPassword.hint')}</AppText>
      <Button
        label={t('auth.forgotPassword.submit')}
        loading={request.isPending}
        onPress={submit}
      />
      <Button
        variant="link"
        label={t('auth.forgotPassword.backToLogin')}
        onPress={() => router.replace('/login')}
      />
    </AuthLayout>
  );
}
