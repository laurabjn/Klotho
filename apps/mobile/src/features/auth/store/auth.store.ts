import type { AuthSession, AuthTokens, UserProfile } from '@klotho/shared';
import { create } from 'zustand';

import { ApiError } from '@/lib/api/errors';
import { registerAuthHooks } from '@/lib/api/http';

import { authApi } from '../api/auth.api';
import { tokenStorage } from '../storage/token-storage';

export type AuthStatus = 'restoring' | 'signedOut' | 'signedIn';

interface AuthState {
  status: AuthStatus;
  user: UserProfile | null;
  accessToken: string | null;
}

export const useAuthStore = create<AuthState>(() => ({
  status: 'restoring',
  user: null,
  accessToken: null,
}));

async function storeTokens(tokens: AuthTokens): Promise<void> {
  await tokenStorage.setRefreshToken(tokens.refreshToken);
  useAuthStore.setState({ accessToken: tokens.accessToken });
}

async function endSession(): Promise<void> {
  await tokenStorage.clear();
  useAuthStore.setState({ status: 'signedOut', user: null, accessToken: null });
}

let refreshing: Promise<string | null> | null = null;

/**
 * Exchanges the stored refresh token for new tokens. Concurrent callers share
 * the same request: refresh tokens are single-use, so two parallel refreshes
 * would look like a replay to the API and revoke the session.
 */
export function refreshSession(): Promise<string | null> {
  refreshing ??= (async () => {
    try {
      const refreshToken = await tokenStorage.getRefreshToken();
      if (!refreshToken) return null;
      const tokens = await authApi.refresh(refreshToken);
      await storeTokens(tokens);
      return tokens.accessToken;
    } catch (error) {
      // Only a rejected token ends the session; a network error keeps it for later.
      if (error instanceof ApiError && error.status === 401) await endSession();
      return null;
    } finally {
      refreshing = null;
    }
  })();
  return refreshing;
}

export async function signIn(session: AuthSession): Promise<void> {
  await storeTokens(session.tokens);
  useAuthStore.setState({ status: 'signedIn', user: session.user });
}

export async function signOut(): Promise<void> {
  const refreshToken = await tokenStorage.getRefreshToken();
  if (refreshToken) {
    await authApi.logout(refreshToken).catch(() => undefined); // best effort
  }
  await endSession();
}

/** At startup: turns a stored refresh token back into a signed-in session. */
export async function restoreSession(): Promise<void> {
  const accessToken = await refreshSession();
  if (!accessToken) {
    if (useAuthStore.getState().status === 'restoring') {
      useAuthStore.setState({ status: 'signedOut' });
    }
    return;
  }
  try {
    const user = await authApi.me();
    useAuthStore.setState({ status: 'signedIn', user });
  } catch {
    await endSession();
  }
}

registerAuthHooks({
  getAccessToken: () => useAuthStore.getState().accessToken,
  refreshAccessToken: refreshSession,
});
