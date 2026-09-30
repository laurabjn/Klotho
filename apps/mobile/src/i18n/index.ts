import {
  DEFAULT_LOCALE,
  DEFAULT_NAMESPACE,
  resolveLocale,
  resources,
} from '@klotho/i18n';
import { getLocales } from 'expo-localization';
import { createInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';

export function detectDeviceLocale() {
  return resolveLocale(getLocales().map((locale) => locale.languageCode));
}

const i18n = createInstance();

void i18n.use(initReactI18next).init({
  resources,
  lng: detectDeviceLocale(),
  fallbackLng: DEFAULT_LOCALE,
  defaultNS: DEFAULT_NAMESPACE,
  interpolation: { escapeValue: false },
  // Translations are bundled: nothing to wait for, so never suspend rendering.
  react: { useSuspense: false },
  initAsync: false,
});

export default i18n;
