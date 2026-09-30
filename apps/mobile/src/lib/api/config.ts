import Constants from 'expo-constants';

const DEV_API_PORT = 3100;

/**
 * EXPO_PUBLIC_API_URL wins when set. Otherwise, in development, the API is
 * assumed to run on the same machine as the Expo dev server, which makes it
 * reachable from a phone on the same Wi-Fi as well as from emulators.
 */
export function resolveApiUrl(): string {
  const explicit = process.env.EXPO_PUBLIC_API_URL;
  if (explicit) return explicit.replace(/\/$/, '');

  const devHost = Constants.expoConfig?.hostUri?.split(':')[0];
  return `http://${devHost ?? 'localhost'}:${DEV_API_PORT}`;
}
