import * as SecureStore from 'expo-secure-store';

import { ApiError, NetworkError } from '@/lib/api/errors';
import { session } from '@/testing/render';

import { authApi } from '../api/auth.api';
import {
  refreshSession,
  restoreSession,
  signIn,
  signOut,
  useAuthStore,
} from './auth.store';

jest.mock('../api/auth.api');
const api = jest.mocked(authApi);
const keychain = (SecureStore as unknown as { __store: Map<string, string> })
  .__store;
const KEY = 'klotho.refreshToken';

beforeEach(() => {
  jest.resetAllMocks();
  keychain.clear();
  useAuthStore.setState({ status: 'restoring', user: null, accessToken: null });
});

describe('restoreSession', () => {
  it('signs out when no refresh token is stored', async () => {
    await restoreSession();

    expect(useAuthStore.getState().status).toBe('signedOut');
    expect(api.refresh).not.toHaveBeenCalled();
  });

  it('restores the session from the stored refresh token', async () => {
    keychain.set(KEY, 'refresh-1');
    api.refresh.mockResolvedValue({
      ...session.tokens,
      refreshToken: 'refresh-2',
    });
    api.me.mockResolvedValue(session.user);

    await restoreSession();

    expect(useAuthStore.getState()).toMatchObject({
      status: 'signedIn',
      user: session.user,
      accessToken: 'access-1',
    });
    expect(keychain.get(KEY)).toBe('refresh-2'); // rotated
  });

  it('forgets a refresh token rejected by the API', async () => {
    keychain.set(KEY, 'revoked');
    api.refresh.mockRejectedValue(
      new ApiError(401, 'auth.invalidRefreshToken'),
    );

    await restoreSession();

    expect(useAuthStore.getState().status).toBe('signedOut');
    expect(keychain.has(KEY)).toBe(false);
  });

  it('keeps the refresh token when the API is unreachable', async () => {
    keychain.set(KEY, 'refresh-1');
    api.refresh.mockRejectedValue(new NetworkError());

    await restoreSession();

    expect(useAuthStore.getState().status).toBe('signedOut');
    expect(keychain.get(KEY)).toBe('refresh-1');
  });
});

describe('refreshSession', () => {
  it('shares one request between concurrent callers (refresh tokens are single-use)', async () => {
    keychain.set(KEY, 'refresh-1');
    api.refresh.mockResolvedValue(session.tokens);

    const results = await Promise.all([
      refreshSession(),
      refreshSession(),
      refreshSession(),
    ]);

    expect(api.refresh).toHaveBeenCalledTimes(1);
    expect(results).toEqual(['access-1', 'access-1', 'access-1']);
  });
});

describe('signIn / signOut', () => {
  it('signIn keeps the refresh token in the keychain only', async () => {
    await signIn(session);

    expect(keychain.get(KEY)).toBe('refresh-1');
    expect(useAuthStore.getState()).toMatchObject({
      status: 'signedIn',
      accessToken: 'access-1',
    });
    expect(JSON.stringify(useAuthStore.getState())).not.toContain('refresh-1');
  });

  it('signOut revokes the session on the API and forgets everything', async () => {
    await signIn(session);
    api.logout.mockResolvedValue(undefined);

    await signOut();

    expect(api.logout).toHaveBeenCalledWith('refresh-1');
    expect(keychain.has(KEY)).toBe(false);
    expect(useAuthStore.getState()).toMatchObject({
      status: 'signedOut',
      user: null,
      accessToken: null,
    });
  });

  it('signOut still signs out locally when offline', async () => {
    await signIn(session);
    api.logout.mockRejectedValue(new NetworkError());

    await signOut();

    expect(useAuthStore.getState().status).toBe('signedOut');
  });
});
