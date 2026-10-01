import { zodResolver } from '@hookform/resolvers/zod';
import {
  registerFormSchema,
  type RegisterFormInput,
  type RegisterInput,
} from '@klotho/shared';
import { useMutation } from '@tanstack/react-query';
import { router } from 'expo-router';
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
import { signIn } from '../store/auth.store';

export function RegisterScreen() {
  const { t } = useTranslation();
  const fieldError = useFieldError();
  const { control, handleSubmit, formState } = useForm<RegisterFormInput>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      firstName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });
  const password = useWatch({ control, name: 'password' });
  const register = useMutation({
    mutationFn: (values: RegisterInput) => authApi.register(values),
    onSuccess: signIn,
  });
  const submit = handleSubmit(({ confirmPassword: _confirm, ...body }) =>
    register.mutate(body),
  );

  return (
    <AuthLayout
      showBack
      photo={photos.register.source}
      photoRatio={photos.register.ratio}
      photoPlacement="side"
      header={
        <>
          <AppText variant="hero">{t('auth.register.title')}</AppText>
          <AppText variant="overline">{t('auth.register.overline')}</AppText>
          <GoldRule />
          <AppText>{t('auth.register.body')}</AppText>
        </>
      }
    >
      <FormError
        message={
          register.error
            ? t(errorMessageKey(register.error) as 'apiErrors.unknown')
            : null
        }
      />
      <Controller
        control={control}
        name="firstName"
        render={({ field }) => (
          <TextField
            label={t('auth.fields.firstName')}
            icon="person-outline"
            autoComplete="given-name"
            textContentType="givenName"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={fieldError(formState.errors.firstName)}
          />
        )}
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
      <AppText variant="hint" center>
        {t('auth.register.consent')}
      </AppText>
      <Button
        variant="link"
        decorated={false}
        label={t('auth.register.privacy')}
        onPress={() => router.push('/privacy')}
      />
      <Button
        label={t('auth.register.submit')}
        loading={register.isPending}
        onPress={submit}
      />
      <Button
        variant="link"
        label={t('auth.register.haveAccount')}
        onPress={() => router.replace('/login')}
      />
    </AuthLayout>
  );
}
