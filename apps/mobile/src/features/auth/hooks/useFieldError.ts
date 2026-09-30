import type { FieldError } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

/** Validation messages are i18n keys coming from the shared zod schemas. */
export function useFieldError() {
  const { t } = useTranslation();
  return (error: FieldError | undefined): string | undefined =>
    error?.message ? t(error.message as 'errors.email.invalid') : undefined;
}
