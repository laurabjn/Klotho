import type { TranslationResource } from '@klotho/i18n';
import 'i18next';

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation';
    resources: { translation: TranslationResource };
  }
}
