import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';

const KEY = 'klotho.weatherSync';

interface WeatherSyncState {
  /** "Synchronisation météo": the weather refreshes by itself. */
  enabled: boolean;
  setEnabled(enabled: boolean): void;
}

/** Kept on the phone (Paramètres → Préférences). */
export const useWeatherSyncStore = create<WeatherSyncState>((set) => ({
  enabled: true,
  setEnabled: (enabled) => {
    set({ enabled });
    void SecureStore.setItemAsync(KEY, enabled ? 'on' : 'off').catch(
      () => undefined,
    );
  },
}));

/** At start-up: the choice saved on the phone, if any. */
export async function restoreWeatherSync(): Promise<void> {
  try {
    const stored = await SecureStore.getItemAsync(KEY);
    if (stored) useWeatherSyncStore.setState({ enabled: stored === 'on' });
  } catch {
    // Unreadable: the weather keeps refreshing by itself.
  }
}
