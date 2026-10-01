import { isSupportedLocale, type Locale } from '@klotho/i18n';
import * as SecureStore from 'expo-secure-store';

import i18n from '@/i18n';

const KEY = 'klotho.language';

/** The language chosen in Paramètres, kept on the phone. */
export async function restoreLanguage(): Promise<void> {
  try {
    const stored = await SecureStore.getItemAsync(KEY);
    if (stored && isSupportedLocale(stored) && stored !== i18n.language)
      await i18n.changeLanguage(stored);
  } catch {
    // Unreadable: the phone's language stays.
  }
}

export async function setLanguage(locale: Locale): Promise<void> {
  await i18n.changeLanguage(locale);
  await SecureStore.setItemAsync(KEY, locale).catch(() => undefined);
}
