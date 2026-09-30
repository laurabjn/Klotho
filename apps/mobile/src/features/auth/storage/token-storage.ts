import * as SecureStore from 'expo-secure-store';

const REFRESH_TOKEN_KEY = 'klotho.refreshToken';

/** The refresh token lives in the OS keychain/keystore; the access token only in memory. */
export const tokenStorage = {
  getRefreshToken: () => SecureStore.getItemAsync(REFRESH_TOKEN_KEY),
  setRefreshToken: (token: string) =>
    SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token),
  clear: () => SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
};
