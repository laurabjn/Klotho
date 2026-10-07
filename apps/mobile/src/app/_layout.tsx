import '@/i18n';

import { QueryClientProvider } from '@tanstack/react-query';
import { SplashScreen, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';

import { restoreSession, useAuthStore } from '@/features/auth/store/auth.store';
import { restoreWeatherSync } from '@/features/weather/store/weather-sync.store';
import { restoreLanguage } from '@/lib/language';
import { ServerWakeBanner } from '@/components/ui/ServerWakeBanner';
import { Toast } from '@/components/ui/Toast';
import { initMonitoring, wrapRoot } from '@/lib/monitoring';
import { createQueryClient } from '@/lib/query-client';
import { useAppFonts } from '@/theme/fonts';
import { colors } from '@/theme/tokens';

void SplashScreen.preventAutoHideAsync();
initMonitoring();

function RootLayout() {
  const [queryClient] = useState(createQueryClient);
  const fontsReady = useAppFonts();
  const status = useAuthStore((state) => state.status);
  const [languageReady, setLanguageReady] = useState(false);
  const ready = fontsReady && languageReady && status !== 'restoring';

  useEffect(() => {
    void restoreSession();
    // The language chosen in Paramètres, before the first screen shows.
    void Promise.all([restoreLanguage(), restoreWeatherSync()]).finally(() =>
      setLanguageReady(true),
    );
  }, []);

  useEffect(() => {
    if (ready) void SplashScreen.hideAsync();
  }, [ready]);

  // Keep the native splash screen until fonts and session are known.
  if (!ready) return null;

  const signedIn = status === 'signedIn';
  return (
    <QueryClientProvider client={queryClient}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Protected guard={signedIn}>
          <Stack.Screen name="(app)" />
        </Stack.Protected>
        <Stack.Protected guard={!signedIn}>
          <Stack.Screen name="(auth)" />
        </Stack.Protected>
        {/* Reachable in both states: opened from the reset email. */}
        <Stack.Screen name="reset-password" />
        <Stack.Screen name="password-changed" />
        <Stack.Screen name="privacy" />
        <Stack.Screen name="terms" />
        {/* Opened from the confirmation e-mail, signed in or not. */}
        <Stack.Screen name="confirm-email" />
      </Stack>
      {/* Short confirmations ("Tenue ajoutée aux favoris"), above every screen. */}
      <Toast />
      {/* "Klotho se réveille…" while the free server wakes up. */}
      <ServerWakeBanner />
      <StatusBar style="dark" />
    </QueryClientProvider>
  );
}

// Crash reporting around the whole app.
export default wrapRoot(RootLayout);
