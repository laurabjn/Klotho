import '@/i18n';

import { QueryClientProvider } from '@tanstack/react-query';
import { SplashScreen, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';

import { restoreSession, useAuthStore } from '@/features/auth/store/auth.store';
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
  const ready = fontsReady && status !== 'restoring';

  useEffect(() => {
    void restoreSession();
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
      </Stack>
      <StatusBar style="dark" />
    </QueryClientProvider>
  );
}

// Crash reporting around the whole app.
export default wrapRoot(RootLayout);
